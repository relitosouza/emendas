"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Amendment, getAmendments, clearAmendments, deleteAmendment } from "@/lib/store";
import Navbar from "@/components/shared/navbar";
import { getSectorColor } from "@/lib/sector-colors";
import { getNormalizedStatus } from "@/lib/status-mapper";
import { parseCurrency } from "@/lib/amendments-utils";

export default function DashboardPage() {
    const [amendments, setAmendments] = useState<Amendment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);
    const [financialModal, setFinancialModal] = useState<Amendment | null>(null);
    const [financialData, setFinancialData] = useState({ reservado: "", empenhado: "", liquidado: "", pago: "" });
    const [savingFinancial, setSavingFinancial] = useState(false);
    const [financialFeedback, setFinancialFeedback] = useState<string | null>(null);

    // CSV Import state
    const [importModal, setImportModal] = useState(false);
    const [importType, setImportType] = useState<"financial" | "amendments">("financial");
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<string[][] | null>(null);
    const [importing, setImporting] = useState(false);
    const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Sync state
    const [syncing, setSyncing] = useState(false);
    const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [lastSync, setLastSync] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                // Fetch last sync info
                const syncRes = await fetch("/api/sync-financeiro");
                const syncData = await syncRes.json();
                if (syncData.lastSync) setLastSync(syncData.lastSync);

                const response = await fetch("/api/amendments");
                const data = await response.json();
                if (data.warning || data.error) {
                    setAmendments(getAmendments());
                } else if (Array.isArray(data)) {
                    setAmendments(data);
                } else {
                    setAmendments(getAmendments());
                }
            } catch (error) {
                console.error("Failed to load from API", error);
                setAmendments(getAmendments());
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta emenda?")) return;
        setDeleting(id);
        try {
            const response = await fetch(`/api/amendments?id=${id}`, { method: "DELETE" });
            const result = await response.json();

            if (response.ok || result.success) {
                // Remove from local storage regardless of API warning (e.g. missing sheets credentials)
                deleteAmendment(id);
                setAmendments((prev) => prev.filter((a) => a.id !== id));
                if (result.warning) {
                    console.warn("Deleted locally. API warning:", result.warning);
                }
            } else {
                alert("Erro ao excluir: " + result.error);
            }
        } catch {
            alert("Erro ao excluir emenda.");
        } finally {
            setDeleting(null);
        }
    };

    const handleClear = () => {
        if (confirm("Tem certeza que deseja limpar todas as emendas?")) {
            clearAmendments();
            setAmendments([]);
        }
    };

    // Computed stats
    const totalValue = amendments.reduce((acc, curr) => {
        return acc + parseCurrency(curr.valor);
    }, 0);

    const emExecucao = amendments.filter((a) => getNormalizedStatus(a.status as string) === "Execução").length;
    const concluidos = amendments.filter((a) => getNormalizedStatus(a.status as string) === "Executada").length;
    const planejamento = amendments.filter((a) => getNormalizedStatus(a.status as string) === "Em Análise" || getNormalizedStatus(a.status as string) === "Não Iniciada" || getNormalizedStatus(a.status as string) === "Elaboração").length;

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
        return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    };

    const getStatusConfig = (rawStatus: string) => {
        const status = getNormalizedStatus(rawStatus);
        const map: Record<string, { label: string; color: string; icon: string }> = {
            "Não Iniciada": { label: "Não Iniciada", color: "blue", icon: "edit_note" },
            "Em Análise": { label: "Em Análise", color: "indigo", icon: "pending_actions" },
            "Elaboração": { label: "Elaboração", color: "cyan", icon: "design_services" },
            "Viabilização": { label: "Viabilização", color: "purple", icon: "verified" },
            "Contratação": { label: "Contratação", color: "pink", icon: "gavel" },
            "Execução": { label: "Execução", color: "amber", icon: "engineering" },
            "Executada": { label: "Executada", color: "emerald", icon: "check_circle" },
            "Prestação de Contas": { label: "Prestação de Contas", color: "teal", icon: "receipt_long" },
            "Cancelada": { label: "Cancelada", color: "red", icon: "cancel" },
        };
        return map[status] || { label: status || "—", color: "slate", icon: "help" };
    };

    const getPriorityConfig = (priority: string) => {
        const map: Record<string, { label: string; dot: string }> = {
            urgente: { label: "Urgente", dot: "bg-red-500" },
            alta: { label: "Alta", dot: "bg-amber-500" },
            normal: { label: "Normal", dot: "bg-blue-500" },
        };
        return map[priority] || { label: priority || "—", dot: "bg-slate-400" };
    };

    const filteredAmendments = amendments.filter((a) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();

        const titleMatch = (a.objeto || a.title || "").toLowerCase().includes(term);
        const autorMatch = (a.autor || a.author || a.responsavelNome || "").toLowerCase().includes(term);
        const statusMatch = getNormalizedStatus(a.status as string).toLowerCase().includes(term);
        const locMatch = (a.localidadeBeneficiada || a.address || "").toLowerCase().includes(term);
        const numMatch = (a.numeroEmenda || "").toLowerCase().includes(term);

        return titleMatch || autorMatch || statusMatch || locMatch || numMatch;
    });

    // Quick nav cards
    const quickActions = [
        { label: "Nova Emenda", desc: "Cadastrar nova emenda parlamentar", icon: "add_circle", href: "/admin/wizard", color: "from-blue-600 to-blue-500" },
        { label: "Gerenciar Cards", desc: "Cards de estatísticas do painel", icon: "widgets", href: "/admin/cards", color: "from-teal-600 to-teal-500" },
    ];

    // CSV Import handlers
    const handleFileSelect = (file: File) => {
        setImportFile(file);
        setImportFeedback(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            const lines = text.split("\n").filter((l) => l.trim());
            const preview = lines.slice(0, 6).map((line) => {
                const cells: string[] = [];
                let current = "";
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (inQuotes) {
                        if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
                        else if (char === '"') { inQuotes = false; }
                        else { current += char; }
                    } else {
                        if (char === '"') { inQuotes = true; }
                        else if (char === "," || char === ";") { cells.push(current.trim()); current = ""; }
                        else if (char === "\r") { continue; }
                        else { current += char; }
                    }
                }
                cells.push(current.trim());
                return cells;
            });
            setImportPreview(preview);
        };
        reader.readAsText(file);
    };

    const handleSync = async () => {
        if (!confirm("Isso irá consultar o Portal de Transparência de Osasco e atualizar os dados financeiros de todas as emendas locais. Deseja continuar?")) return;
        
        setSyncing(true);
        setSyncFeedback(null);
        
        try {
            const res = await fetch("/api/sync-financeiro", { method: "POST" });
            const result = await res.json();
            
            if (res.ok && result.success) {
                setSyncFeedback({ 
                    type: "success", 
                    message: `${result.message}. ${result.updatedCount} emendas atualizadas.` 
                });
                
                // Refresh list to show updated values
                const dataRes = await fetch("/api/amendments");
                const data = await dataRes.json();
                if (Array.isArray(data)) setAmendments(data);
                
                const syncDataRes = await fetch("/api/sync-financeiro");
                const syncDataNext = await syncDataRes.json();
                if (syncDataNext.lastSync) setLastSync(syncDataNext.lastSync);
            } else {
                setSyncFeedback({ 
                    type: "error", 
                    message: result.error || "Erro na sincronização" 
                });
            }
        } catch (error) {
            setSyncFeedback({ type: "error", message: "Erro de conexão ao sincronizar" });
        } finally {
            setSyncing(false);
            // Clear success feedback after a while
            setTimeout(() => setSyncFeedback(null), 5000);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportFeedback(null);
        try {
            const formData = new FormData();
            formData.append("file", importFile);
            const endpoint = importType === "financial" ? "/api/financial/import" : "/api/amendments/import";
            const res = await fetch(endpoint, { method: "POST", body: formData });
            const result = await res.json();
            if (res.ok) {
                if (importType === "financial") {
                    setImportFeedback({ type: "success", message: `${result.updated} atualizados, ${result.added} novos. Total: ${result.total}` });
                } else {
                    setImportFeedback({ type: "success", message: `${result.amendments} emendas importadas${result.financial > 0 ? `, ${result.financial} registros financeiros extraídos` : ""}` });
                    // Reload amendments
                    const dataRes = await fetch("/api/amendments");
                    const data = await dataRes.json();
                    if (Array.isArray(data)) setAmendments(data);
                }
            } else {
                setImportFeedback({ type: "error", message: result.error || "Erro ao importar" });
            }
        } catch {
            setImportFeedback({ type: "error", message: "Erro de conexão ao importar" });
        } finally {
            setImporting(false);
        }
    };

    const resetImportModal = () => {
        setImportModal(false);
        setImportFile(null);
        setImportPreview(null);
        setImportFeedback(null);
    };

    const handleExportExcel = () => {
        if (filteredAmendments.length === 0) {
            alert("Nenhuma emenda para exportar.");
            return;
        }

        const headers = [
            "Número", "Ano", "Objeto/Título", "Autor", "Valor Autorizado", "Status", "Localidade", "Empenhado", "Liquidado", "Pago"
        ];

        const rows = filteredAmendments.map(a => [
            a.numeroEmenda || "",
            a.year || "",
            a.objeto || a.title || "",
            a.autor || a.author || "",
            a.valor || a.valorAutorizado || "",
            getNormalizedStatus(a.status as string) || "",
            a.localidadeBeneficiada || a.address || "",
            a.empenhado || "",
            a.liquidado || "",
            a.pago || ""
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"));

        // O separador \uFEFF força o Excel a reconhecer os caracteres UTF-8 corretamente
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `emendas_exportativas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-[1400px] p-6 lg:p-10 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Painel Administrativo</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Gerencie emendas, acompanhe dados e administre o portal.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Sistema Online
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                                style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-100`}></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{action.label}</p>
                                        <p className="text-xs text-white/70">{action.desc}</p>
                                    </div>
                                    <span className="material-symbols-outlined ml-auto text-white/50 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </Link>
                        ))}
                        
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white transition-all hover:shadow-lg hover:-translate-y-0.5 text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-500 opacity-100"></div>
                            <div className="relative flex items-center gap-4">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                    <span className={`material-symbols-outlined text-[24px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{syncing ? "Sincronizando..." : "Sincronizar Portal"}</p>
                                    <p className="text-[10px] text-white/70 truncate uppercase font-bold tracking-wider">
                                        {lastSync 
                                            ? `Última: ${new Date(lastSync).toLocaleDateString("pt-BR")} ${new Date(lastSync).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}` 
                                            : "Dados da prefeitura"}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined ml-auto text-white/50 group-hover:translate-x-1 transition-transform">refresh</span>
                            </div>
                            {syncFeedback && (
                                <div className={`absolute bottom-0 left-0 right-0 py-1 px-4 text-[10px] font-bold text-center ${syncFeedback.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`}>
                                    {syncFeedback.message}
                                </div>
                            )}
                        </button>

                        <button
                            onClick={() => setImportModal(true)}
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white transition-all hover:shadow-lg hover:-translate-y-0.5 text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-500 opacity-100"></div>
                            <div className="relative flex items-center gap-4">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-[24px]">upload_file</span>
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Importar CSV</p>
                                    <p className="text-xs text-white/70">Google Sheets/CSV</p>
                                </div>
                                <span className="material-symbols-outlined ml-auto text-white/50 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: "Total de Emendas", value: amendments.length.toString(), icon: "description", color: "blue", sub: "cadastradas" },
                            { label: "Valor Total", value: formatCurrency(totalValue), icon: "payments", color: "teal", sub: "em emendas" },
                            { label: "Em Execução", value: emExecucao.toString(), icon: "engineering", color: "amber", sub: "projetos ativos" },
                            { label: "Concluídos", value: concluidos.toString(), icon: "check_circle", color: "emerald", sub: `de ${amendments.length}` },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                                    <div className={`flex size-8 items-center justify-center rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                                        <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-800">{loading ? "—" : stat.value}</p>
                                <p className="text-[11px] text-slate-400 mt-1">{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Status Distribution Bar */}
                    {amendments.length > 0 && (
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Distribuição por Status</h3>
                            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                {planejamento > 0 && (
                                    <div className="bg-blue-500 transition-all" style={{ width: `${(planejamento / amendments.length) * 100}%` }} title={`Planejamento: ${planejamento}`}></div>
                                )}
                                {emExecucao > 0 && (
                                    <div className="bg-amber-500 transition-all" style={{ width: `${(emExecucao / amendments.length) * 100}%` }} title={`Em Execução: ${emExecucao}`}></div>
                                )}
                                {concluidos > 0 && (
                                    <div className="bg-emerald-500 transition-all" style={{ width: `${(concluidos / amendments.length) * 100}%` }} title={`Concluídos: ${concluidos}`}></div>
                                )}
                            </div>
                            <div className="flex gap-6 mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                                    <span className="text-xs text-slate-500">Planejamento ({planejamento})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                                    <span className="text-xs text-slate-500">Em Execução ({emExecucao})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-xs text-slate-500">Concluídos ({concluidos})</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Amendments Table/List Section */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-600">list_alt</span>
                                <h2 className="text-lg font-bold text-slate-800">Emendas Cadastradas</h2>
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">{amendments.length}</span>
                            </div>
                            <div className="flex gap-2">
                                {amendments.length > 0 && (
                                    <button
                                        onClick={handleClear}
                                        className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                                        Limpar Tudo
                                    </button>
                                )}
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 border border-emerald-200"
                                >
                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                    Exportar Planilha
                                </button>
                                <Link
                                    href="/admin/wizard"
                                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Nova Emenda
                                </Link>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 flex items-center">
                            <div className="relative flex-1 max-w-md">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar por número, título, autor ou local..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
                                    <span className="text-xs text-slate-400">Carregando emendas...</span>
                                </div>
                            </div>
                        ) : amendments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <span className="material-symbols-outlined text-[32px]">inbox</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">Nenhuma emenda encontrada</h3>
                                <p className="mt-1 text-sm text-slate-500 max-w-sm">Comece cadastrando uma nova emenda parlamentar pelo assistente.</p>
                                <Link
                                    href="/admin/wizard"
                                    className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Cadastrar Agora
                                </Link>
                            </div>
                        ) : filteredAmendments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <span className="material-symbols-outlined text-[32px]">manage_search</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">Nenhuma emenda para "{searchTerm}"</h3>
                                <p className="mt-1 text-sm text-slate-500 max-w-sm">Tente usar outros termos para a busca.</p>
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
                                >
                                    Limpar Busca
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {/* Table Header */}
                                <div className="hidden lg:grid grid-cols-12 gap-4 bg-slate-50/80 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <div className="col-span-4">Emenda</div>
                                    <div className="col-span-2">Parlamentar</div>
                                    <div className="col-span-2">Valor</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-2 text-right">Ações</div>
                                </div>

                                {filteredAmendments.map((amendment) => {
                                    const statusCfg = getStatusConfig(amendment.status);
                                    const priorityCfg = getPriorityConfig(amendment.priority || "normal");

                                    return (
                                        <div
                                            key={amendment.id}
                                            className="group grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 px-6 py-4 items-center transition-colors hover:bg-blue-50/30"
                                        >
                                            {/* Emenda */}
                                            <div className="col-span-4 flex items-center gap-3 min-w-0">
                                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-${statusCfg.color}-50 text-${statusCfg.color}-600`}>
                                                    <span className="material-symbols-outlined text-[20px]">{statusCfg.icon}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate" title={amendment.objeto || amendment.title}>
                                                        {amendment.objeto || amendment.title || "Sem objeto"}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {amendment.localidadeBeneficiada || amendment.address || "Sem localidade"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Parlamentar */}
                                            <div className="col-span-2">
                                                <p className="text-sm text-slate-600 truncate">{amendment.autor || amendment.author || "—"}</p>
                                            </div>

                                            {/* Valor */}
                                            <div className="col-span-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`h-2 w-2 rounded-full ${priorityCfg.dot}`}></div>
                                                    <span className="font-mono text-sm font-bold text-slate-800">R$ {amendment.valor || "0,00"}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 capitalize">{priorityCfg.label}</span>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full bg-${statusCfg.color}-50 px-3 py-1 text-xs font-bold text-${statusCfg.color}-700`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full bg-${statusCfg.color}-500`}></span>
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-2 flex justify-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        setFinancialModal(amendment);
                                                        setFinancialData({
                                                            reservado: amendment.reservado || "",
                                                            empenhado: amendment.empenhado || "",
                                                            liquidado: amendment.liquidado || "",
                                                            pago: amendment.pago || "",
                                                        });
                                                        setFinancialFeedback(null);
                                                    }}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                                    title="Execução Financeira"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">attach_money</span>
                                                </button>
                                                <Link
                                                    href={`/projetos/${amendment.id}`}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                                    title="Ver Detalhe"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </Link>
                                                <Link
                                                    href={`/admin/amendments/${amendment.id}/edit`}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(amendment.id)}
                                                    disabled={deleting === amendment.id}
                                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {deleting === amendment.id ? "hourglass_empty" : "delete"}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main >

            {/* Financial Modal */}
            {
                financialModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-100 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <span className="material-symbols-outlined">account_balance</span>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Execução Financeira</h2>
                                        <p className="text-xs text-slate-400 truncate max-w-[220px]">{financialModal.objeto || financialModal.title || "Emenda"}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFinancialModal(null)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Valor autorizado reference */}
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Valor Autorizado</p>
                                    <p className="text-xl font-bold text-slate-800 font-mono">R$ {financialModal.valor || financialModal.valorAutorizado || "0,00"}</p>
                                </div>

                                {/* Financial Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full bg-violet-500"></span>
                                            Reservado
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                            <input
                                                type="text"
                                                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm font-mono outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                                                placeholder="0,00"
                                                value={financialData.reservado}
                                                onChange={(e) => setFinancialData({ ...financialData, reservado: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                                            Empenhado
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                            <input
                                                type="text"
                                                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                placeholder="0,00"
                                                value={financialData.empenhado}
                                                onChange={(e) => setFinancialData({ ...financialData, empenhado: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                                            Liquidado
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                            <input
                                                type="text"
                                                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm font-mono outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                                placeholder="0,00"
                                                value={financialData.liquidado}
                                                onChange={(e) => setFinancialData({ ...financialData, liquidado: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                            Pago
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                                            <input
                                                type="text"
                                                className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                                placeholder="0,00"
                                                value={financialData.pago}
                                                onChange={(e) => setFinancialData({ ...financialData, pago: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Visual progress */}
                                <div className="rounded-xl border border-slate-100 p-4 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fluxo de Execução</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between text-[10px] text-slate-500"><span>Empenhado</span><span className="font-mono">R$ {financialData.empenhado || "0"}</span></div>
                                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: financialData.empenhado ? '100%' : '0%' }}></div></div>
                                        </div>
                                        <span className="material-symbols-outlined text-[14px] text-slate-300">arrow_forward</span>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between text-[10px] text-slate-500"><span>Liquidado</span><span className="font-mono">R$ {financialData.liquidado || "0"}</span></div>
                                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: financialData.liquidado ? '100%' : '0%' }}></div></div>
                                        </div>
                                        <span className="material-symbols-outlined text-[14px] text-slate-300">arrow_forward</span>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex justify-between text-[10px] text-slate-500"><span>Pago</span><span className="font-mono">R$ {financialData.pago || "0"}</span></div>
                                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: financialData.pago ? '100%' : '0%' }}></div></div>
                                        </div>
                                    </div>
                                </div>

                                {financialFeedback && (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-medium text-emerald-700">
                                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                        {financialFeedback}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
                                <button
                                    onClick={() => setFinancialModal(null)}
                                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        setSavingFinancial(true);
                                        try {
                                            const res = await fetch("/api/financial", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    amendmentId: financialModal.id,
                                                    reservado: financialData.reservado,
                                                    empenhado: financialData.empenhado,
                                                    liquidado: financialData.liquidado,
                                                    pago: financialData.pago,
                                                }),
                                            });
                                            if (res.ok) {
                                                // Update local state
                                                setAmendments((prev) =>
                                                    prev.map((a) =>
                                                        a.id === financialModal.id
                                                            ? { ...a, reservado: financialData.reservado, empenhado: financialData.empenhado, liquidado: financialData.liquidado, pago: financialData.pago }
                                                            : a
                                                    )
                                                );
                                                setFinancialFeedback("Dados financeiros salvos!");
                                                setTimeout(() => {
                                                    setFinancialModal(null);
                                                    setFinancialFeedback(null);
                                                }, 1500);
                                            } else {
                                                alert("Erro ao salvar dados financeiros.");
                                            }
                                        } catch {
                                            alert("Erro ao salvar dados financeiros.");
                                        } finally {
                                            setSavingFinancial(false);
                                        }
                                    }}
                                    disabled={savingFinancial}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all hover:shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{savingFinancial ? "hourglass_empty" : "save"}</span>
                                    {savingFinancial ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CSV Import Modal */}
            {importModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <span className="material-symbols-outlined">upload_file</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Importar CSV</h2>
                                    <p className="text-xs text-slate-400">Selecione o tipo e o arquivo CSV</p>
                                </div>
                            </div>
                            <button
                                onClick={resetImportModal}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Type Selector */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Tipo de Importação</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setImportType("amendments"); setImportFile(null); setImportPreview(null); setImportFeedback(null); }}
                                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${importType === "amendments" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                                    >
                                        <span className={`material-symbols-outlined text-[24px] ${importType === "amendments" ? "text-blue-600" : "text-slate-400"}`}>description</span>
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${importType === "amendments" ? "text-blue-700" : "text-slate-700"}`}>Emendas</p>
                                            <p className="text-[10px] text-slate-400">Página1 do Google Sheets</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setImportType("financial"); setImportFile(null); setImportPreview(null); setImportFeedback(null); }}
                                        className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${importType === "financial" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}
                                    >
                                        <span className={`material-symbols-outlined text-[24px] ${importType === "financial" ? "text-emerald-600" : "text-slate-400"}`}>attach_money</span>
                                        <div className="text-left">
                                            <p className={`text-sm font-bold ${importType === "financial" ? "text-emerald-700" : "text-slate-700"}`}>Financeiro</p>
                                            <p className="text-[10px] text-slate-400">ExecucaoFinanceira</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* File Input */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Arquivo CSV</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileSelect(file);
                                        }}
                                        className="w-full rounded-xl border-2 border-dashed border-slate-200 p-4 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-blue-600 hover:border-slate-300 transition-colors"
                                    />
                                </div>
                                {importFile && (
                                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                                        {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            {/* Preview */}
                            {importPreview && importPreview.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                        Preview ({importPreview.length > 1 ? `${importPreview.length - 1} linhas` : "cabeçalho"})
                                    </label>
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    {importPreview[0].slice(0, 6).map((header, i) => (
                                                        <th key={i} className="px-3 py-2 text-left font-bold text-slate-500 whitespace-nowrap">{header || `Col ${i + 1}`}</th>
                                                    ))}
                                                    {importPreview[0].length > 6 && <th className="px-3 py-2 text-slate-400">...</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.slice(1, 6).map((row, ri) => (
                                                    <tr key={ri} className="border-t border-slate-100">
                                                        {row.slice(0, 6).map((cell, ci) => (
                                                            <td key={ci} className="px-3 py-2 text-slate-600 whitespace-nowrap max-w-[150px] truncate">{cell || "—"}</td>
                                                        ))}
                                                        {row.length > 6 && <td className="px-3 py-2 text-slate-400">...</td>}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Feedback */}
                            {importFeedback && (
                                <div className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${importFeedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                                    <span className="material-symbols-outlined text-[18px]">{importFeedback.type === "success" ? "check_circle" : "error"}</span>
                                    {importFeedback.message}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
                            <button
                                onClick={resetImportModal}
                                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                {importFeedback?.type === "success" ? "Fechar" : "Cancelar"}
                            </button>
                            {importFeedback?.type !== "success" && (
                                <button
                                    onClick={handleImport}
                                    disabled={!importFile || importing}
                                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all hover:shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{importing ? "hourglass_empty" : "upload"}</span>
                                    {importing ? "Importando..." : "Importar"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="font-mono text-xs text-slate-400">© 2026 Portal das Emendas Osasco • Painel Administrativo</p>
                    <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <a href="#" className="transition-colors hover:text-blue-600">Transparência</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Termos</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Contato</a>
                    </div>
                </div>
            </footer>
        </div >
    );
}
