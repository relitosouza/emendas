"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "@/components/shared/navbar";
import CouncilorRanking from "@/components/dashboard/councilor-ranking";
import { useCountUp } from "@/hooks/useCountUp";
import { getSectorColor } from "@/lib/sector-colors";
import { getNormalizedStatus } from "@/lib/status-mapper";
import { CATEGORY_MAP, parseCurrency as parseValor, findVereadorPhoto } from "@/lib/amendments-utils";
import GroupedAmendments from "@/components/dashboard/grouped-amendments";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [amendments, setAmendments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalReservado = amendments.reduce((acc, e) => {
    const res = parseValor(e.reservado);
    const emp = parseValor(e.empenhado);
    // O valor "sai" da reserva quando é empenhado
    return acc + Math.max(0, res - emp);
  }, 0);
  const totalEmpenhado = amendments.reduce((acc, e) => acc + parseValor(e.empenhado), 0);
  const totalLiquidado = amendments.reduce((acc, e) => acc + parseValor(e.liquidado), 0);
  const totalPago = amendments.reduce((acc, e) => acc + parseValor(e.pago), 0);
  const totalValor = amendments.reduce((acc: number, e: any) => acc + parseValor(e.valor), 0);

  const porcentagemEmpenhada = totalValor > 0 ? (totalEmpenhado / totalValor) * 100 : 0;
  const porcentagemFormatada = porcentagemEmpenhada.toFixed(1);
  const porcentagemReservada = totalValor > 0 ? (totalReservado / totalValor) * 100 : 0;
  const porcentagemReservadaFormatada = porcentagemReservada.toFixed(1);
  const porcentagemLiquidada = totalValor > 0 ? (totalLiquidado / totalValor) * 100 : 0;
  const porcentagemLiquidadaFormatada = porcentagemLiquidada.toFixed(1);
  const porcentagemPaga = totalValor > 0 ? (totalPago / totalValor) * 100 : 0;
  const porcentagemPagaFormatada = porcentagemPaga.toFixed(1);


  // Pago percentage for the circle
  const pagoPct = Math.min(Number(porcentagemPagaFormatada), 100);
  const circumference = 2 * Math.PI * 42; // r=42
  const strokeDashoffset = circumference - (pagoPct / 100) * circumference;

  // Animated counters (2s ease-out)
  const animatedValor = useCountUp(loading ? 0 : totalValor, 2000);
  const animatedReservado = useCountUp(loading ? 0 : totalReservado, 2000);
  const animatedEmpenhado = useCountUp(loading ? 0 : totalEmpenhado, 2000);
  const animatedLiquidado = useCountUp(loading ? 0 : totalLiquidado, 2000);
  const animatedPago = useCountUp(loading ? 0 : totalPago, 2000);
  const animatedCount = useCountUp(loading ? 0 : amendments.length, 2000);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      router.push(`/projetos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      router.push(`/projetos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Group amendments by author
  const getAuthorRanking = () => {
    const authorMap: Record<string, { count: number; foto?: string }> = {};
    amendments.forEach((e: any) => {
      const autor = e.autor || e.responsavelNome || "Não informado";
      if (!authorMap[autor]) {
        authorMap[autor] = { 
          count: 0, 
          foto: e.autorFoto || e.responsavelFoto || findVereadorPhoto(autor)
        };
      }
      authorMap[autor].count += 1;
    });
    return Object.entries(authorMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        foto: data.foto,
        initials: name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Map sector categories
  const categoryMap = CATEGORY_MAP;

  // Group amendments by sector
  const getSectorData = () => {
    const sectorMap: Record<string, { count: number, valor: number, catNum: string }> = {};
    amendments.forEach((e: any) => {
      let catNum = e.categoria;
      // Handle cases where categoria might come as "10 - Saúde" or just "10"
      if (typeof catNum === "string" && catNum.includes(" - ")) {
        catNum = catNum.split(" - ")[0].trim();
      }

      const cat = catNum ? (categoryMap[String(catNum)] || `Categoria ${catNum}`) : "Sem Categoria";
      if (!sectorMap[cat]) sectorMap[cat] = { count: 0, valor: 0, catNum: String(catNum || "") };
      sectorMap[cat].count += 1;
      sectorMap[cat].valor += parseValor(e.valor);
    });
    return Object.entries(sectorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.valor - a.valor);
  };

  useEffect(() => {
    async function fetchData(isRefresh = false) {
      if (isRefresh) setIsRefreshing(true);
      try {
        const res = await fetch("/api/amendments");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAmendments(data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        if (isRefresh) setIsRefreshing(false);
      }
    }

    fetchData();
    const interval = setInterval(() => fetchData(true), 120000);
    return () => clearInterval(interval);
  }, []);

  const authorRanking = getAuthorRanking();
  const sectorData = getSectorData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8" aria-label="Conteúdo principal">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative group">
            <label htmlFor="busca-emendas" className="sr-only">
              Buscar emendas por autor, título ou valor
            </label>
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" aria-hidden="true">
              search
            </span>
            <input
              id="busca-emendas"
              className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-2xl shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
              placeholder="Pesquisar por objetivo, autor ou número..."
              type="search"
              aria-label="Buscar emendas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
            {searchTerm.trim() && (
              <button
                onClick={handleSearchSubmit}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                aria-label="Buscar"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Card - Budget */}
        <section className="mb-10" aria-label="Resumo orçamentário das emendas">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-8 md:p-12 text-white shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" aria-hidden="true"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-4 opacity-80">
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">account_balance_wallet</span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Emendas aprovadas</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-8" aria-live="polite" aria-atomic="true">
                  {loading ? "Carregando..." : animatedValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link href="/projetos" className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-colors">
                    <span className="material-symbols-outlined text-sm">description</span>
                    <span className="text-sm font-semibold">{loading ? "..." : Math.round(animatedCount)} emendas</span>
                  </Link>
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2 border border-white/10">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span className="text-sm font-semibold">{loading ? "..." : `${porcentagemFormatada}% empenhado`}</span>
                  </div>
                </div>
                {/* Indicador de atualização */}
                {!loading && (
                  <div className="mt-4 flex items-center gap-2 opacity-70">
                    {isRefreshing ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                        <span className="text-xs font-semibold">Atualizando...</span>
                      </>
                    ) : lastUpdated ? (
                      <>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="text-xs font-semibold">
                          Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div
                  className="relative w-40 h-40 flex items-center justify-center"
                  role="img"
                  aria-label={loading ? "Carregando percentual pago" : `${porcentagemPagaFormatada}% do valor total já foi pago`}
                >
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" fill="transparent" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                    <circle
                      className="text-white transition-all duration-1000"
                      cx="50" cy="50" fill="transparent" r="42"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={loading ? circumference : strokeDashoffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
                    <span className="text-2xl font-black">{loading ? "--" : `${porcentagemPagaFormatada}%`}</span>
                    <span className="text-[10px] font-bold uppercase opacity-80">Pago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Financial Cards */}
            <section aria-label="Indicadores financeiros das emendas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reservado */}
              <Link
                href="/projetos?filtro=reservado"
                aria-label={`Total Reservado: ${loading ? "carregando" : animatedReservado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — ${loading ? "" : porcentagemReservadaFormatada + "% do total"}. Ver emendas reservadas`}
                className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-amber-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined" aria-hidden="true">account_balance</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Previsão</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Reservado</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedReservado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemReservadaFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemReservadaFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Empenhado */}
              <Link
                href="/projetos?filtro=empenhado"
                aria-label={`Total Empenhado: ${loading ? "carregando" : animatedEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — ${loading ? "" : porcentagemFormatada + "% do total"}. Ver emendas empenhadas`}
                className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-blue-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined" aria-hidden="true">payments</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alocação Inicial</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Empenhado</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Liquidado */}
              <Link
                href="/projetos?filtro=liquidado"
                aria-label={`Total Liquidado: ${loading ? "carregando" : animatedLiquidado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — ${loading ? "" : porcentagemLiquidadaFormatada + "% do total"}. Ver emendas liquidadas`}
                className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-indigo-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execução</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Liquidado</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedLiquidado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemLiquidadaFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemLiquidadaFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Pago */}
              <Link
                href="/projetos?filtro=pago"
                aria-label={`Total Pago: ${loading ? "carregando" : animatedPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — ${loading ? "" : porcentagemPagaFormatada + "% do total"}. Ver emendas pagas`}
                className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md hover:border-emerald-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fase Final</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pago</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
                    {loading ? "Carregando..." : animatedPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Percentual do Total</span>
                      <span>{loading ? "--" : `${porcentagemPagaFormatada}%`}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: loading ? "0%" : `${Math.min(Number(porcentagemPagaFormatada), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
            </section>

            {/* Grouped Amendments by Objective */}
            <section aria-label="Emendas agrupadas por objetivo" className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Emendas por Objetivo</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Agrupamento consolidado de investimentos</p>
                </div>
                <Link href="/projetos?view=grouped" className="text-sm font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  Ver todas <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400">
                  <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  Carregando grupos...
                </div>
              ) : (
                <GroupedAmendments amendments={amendments.slice(0, 100)} />
              )}
            </section>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Author Ranking */}
            {loading ? (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando Ranking...</span>
              </div>
            ) : (
              <CouncilorRanking councilors={authorRanking} />
            )}

            {/* Sector Card */}
            <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <span className="material-symbols-outlined text-sm">pie_chart</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Investimento por Setor</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {loading ? "Carregando dados..." : `${amendments.filter(a => a.categoria && a.categoria !== "Sem Categoria").length} categorizadas`}
                  </p>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="p-6 text-center text-slate-400">Carregando...</div>
                ) : sectorData.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">Nenhum setor encontrado.</div>
                ) : (
                  sectorData.map((sector) => {
                    const sc = getSectorColor(sector.catNum);
                    const maxValor = sectorData[0].valor;
                    const widthPercent = Math.max((sector.valor / maxValor) * 100, 5);
                    const valorFormatado = sector.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

                    return (
                      <Link href={`/projetos?search=${encodeURIComponent(sector.name)}`} key={sector.name} className="p-4 hover:bg-slate-50 transition-colors block cursor-pointer">
                        <div className="flex justify-between items-end mb-2">
                          <span className={`text-xs font-bold truncate pr-2 ${sc.badgeText}`} title={sector.name}>{sector.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 text-right shrink-0">{sector.count} emendas<br />{valorFormatado}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${sc.bar} rounded-full`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <Link href="/projetos" className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline">
                  Ver análise completa
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brasao-osasco.png" alt="Brasão de Osasco" className="w-8 h-8 object-contain" />
            <span className="font-bold text-slate-400">Portal das Emendas - Prefeitura Municipal de Osasco © 2026</span>
          </div>
          <div className="flex gap-8">
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="https://transparencia.osasco.sp.gov.br/#/" target="_blank" rel="noopener noreferrer">Transparência</a>
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="https://transparencia.osasco.sp.gov.br/#/dados_abertos" target="_blank" rel="noopener noreferrer">Dados Abertos</a>
            <a className="text-sm text-slate-500 hover:text-blue-500 transition-colors" href="#">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
