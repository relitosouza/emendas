"use client";

import React from "react";
import Link from "next/link";
import { findVereadorPhoto, formatCurrency, parseCurrency, getCategoryLabel } from "@/lib/amendments-utils";
import { getSectorColor } from "@/lib/sector-colors";
import { getNormalizedStatus } from "@/lib/status-mapper";
import { cn } from "@/lib/utils";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Users, TrendingUp } from "lucide-react";

const PROGRESS_MAP: Record<string, number> = {
  "Não Iniciada": 0,
  "Em Análise": 12,
  "Elaboração": 25,
  "Viabilização": 37,
  "Contratação": 50,
  "Execução": 75,
  "Executada": 100,
  "Prestação de Contas": 100,
  "Cancelada": 0
};

interface Participant {
  id: string;
  nome: string;
  valor: string;
  valorNum: number;
  foto?: string;
  protocolo: string;
}

interface GroupedData {
  objeto: string;
  sector: string;
  valorTotal: number;
  progress: number;
  participantes: Participant[];
}

interface GroupedAmendmentsProps {
  amendments: any[];
}

export default function GroupedAmendments({ amendments }: GroupedAmendmentsProps) {
  const grouped = React.useMemo(() => {
    const map: Record<string, GroupedData> = {};

    amendments.forEach((a) => {
      const key = (a.objeto || a.title || "Sem Objetivo").trim();
      const sector = getCategoryLabel(a.categoria) || "Infraestrutura";
      const valor = parseCurrency(a.valor);
      const autor = a.autor || a.responsavelNome || "Não informado";

      if (!map[key]) {
        map[key] = {
          objeto: key,
          sector,
          valorTotal: 0,
          progress: 0,
          participantes: [],
        };
      }

      const status = getNormalizedStatus(a.status);
      map[key].progress += (PROGRESS_MAP[status] || 0);
      map[key].valorTotal += valor;
      map[key].participantes.push({
        id: a.id,
        nome: autor,
        valor: formatCurrency(valor),
        valorNum: valor,
        foto: findVereadorPhoto(autor),
        protocolo: a.numeroEmenda || a.id || "---",
      });
    });

    // Final processing: sort participants by value and calculate average progress
    Object.values(map).forEach(group => {
      group.participantes.sort((a, b) => b.valorNum - a.valorNum);
      group.progress = Math.round(group.progress / group.participantes.length);
    });

    return Object.values(map).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [amendments]);

  return (
    <div className="grid grid-cols-1 gap-8">
      {grouped.map((group, idx) => (
        <GroupedAmendmentCard key={idx} group={group} />
      ))}
    </div>
  );
}

function GroupedAmendmentCard({ group }: { group: GroupedData }) {
  const sc = getSectorColor(group.sector);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 overflow-hidden flex flex-col group">
      {/* Topo */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h2 className="text-lg font-extrabold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
            {group.objeto}
          </h2>
          <div className="text-right shrink-0">
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Valor Total</p>
             <p className="text-lg font-black text-blue-600">{formatCurrency(group.valorTotal)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none",
            sc.badgeBg, sc.badgeText
          )}>
            {group.sector}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <TrendingUp className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execução: {group.progress}%</span>
          </div>
        </div>

        {/* Barra de Progresso Compacta */}
        <div className="mt-4 w-full h-1 bg-slate-50 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-1000", sc.bar)}
            style={{ width: `${group.progress}%` }}
          />
        </div>
      </div>

      {/* Meio: Lista Técnica */}
      <div className="px-5 py-3 flex-1">
        <div className="space-y-1">
          <div className="grid grid-cols-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 mb-2">
            <span>Vereador</span>
            <span>Valor</span>
            <span className="text-right">Protocolo</span>
          </div>
          
          {/* Top 5 Participants */}
          {group.participantes.slice(0, 5).map((p, i) => (
            <ParticipantRow key={i} p={p} />
          ))}

          {/* Remaining in Accordion */}
          {group.participantes.length > 5 && (
            <Accordion.Root type="single" collapsible className="w-full">
              <Accordion.Item value="remaining" className="border-none">
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <div className="space-y-1 pt-1 mt-1">
                    {group.participantes.slice(5).map((p, i) => (
                      <ParticipantRow key={i + 5} p={p} />
                    ))}
                  </div>
                </Accordion.Content>
                <Accordion.Trigger asChild>
                  <button className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:bg-slate-50 rounded-lg transition-all group/trigger mt-1">
                    <span className="group-data-[state=open]/trigger:hidden">Ver mais (+{group.participantes.length - 5})</span>
                    <span className="hidden group-data-[state=open]/trigger:block">Recolher</span>
                    <ChevronDown className="w-2.5 h-2.5 transition-transform duration-300 group-data-[state=open]/trigger:rotate-180" />
                  </button>
                </Accordion.Trigger>
              </Accordion.Item>
            </Accordion.Root>
          )}
        </div>
      </div>

      {/* Rodapé: Avatar Stack */}
      <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-50">
        <p className="text-[11px] font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
          Vereadores nesta emenda
          <span className="inline-flex items-center justify-center size-4 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black">
            {group.participantes.length}
          </span>
        </p>
        
        <div className="flex items-center">
          <div className="flex -space-x-4 overflow-hidden">
            <Tooltip.Provider>
              {group.participantes.slice(0, 5).map((v) => (
                <Tooltip.Root key={v.id}>
                  <Tooltip.Trigger asChild>
                    <div className="relative group/avatar cursor-pointer">
                      <div className="size-12 rounded-full ring-4 ring-white shadow-sm overflow-hidden bg-slate-200 transition-transform hover:scale-110 hover:z-20 relative">
                        {v.foto ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={v.foto}
                            alt={v.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                            {v.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100]"
                      sideOffset={5}
                    >
                      {v.nome}
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </Tooltip.Provider>

            {group.participantes.length > 5 && (
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-sm font-black ring-4 ring-white shadow-sm z-10">
                +{group.participantes.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantRow({ p }: { p: Participant }) {
  return (
    <div className="grid grid-cols-3 items-center py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group/row">
      <div className="flex items-center gap-2 truncate pr-2">
        <span className="text-[13px] font-bold text-slate-700 truncate group-hover/row:text-blue-600 transition-colors">
          {p.nome}
        </span>
      </div>
      <span className="text-[12px] font-medium text-slate-500">{p.valor}</span>
      <Link 
        href={`/projetos/${p.id}`}
        className="text-[11px] font-mono font-bold text-slate-400 text-right hover:text-blue-500 transition-colors hover:underline"
      >
        {p.protocolo}
      </Link>
    </div>
  );
}
