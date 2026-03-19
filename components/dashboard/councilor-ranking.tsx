"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Councilor {
  name: string;
  count: number;
  foto?: string;
  initials: string;
}

interface CouncilorRankingProps {
  councilors: Councilor[];
}

export default function CouncilorRanking({ councilors }: CouncilorRankingProps) {
  const [isOpen, setIsOpen] = useState(false);

  const top5 = councilors.slice(0, 5);
  const remaining = councilors.slice(5);

  if (councilors.length === 0) {
    return <div className="p-6 text-center text-slate-400">Nenhum autor encontrado.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-0.5">Ranking de Participação</h3>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Por número de emendas</p>
        </div>
        <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
           <Trophy className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500">
        <div className="divide-y divide-slate-50">
          {top5.map((author, idx) => (
            <CouncilorItem key={author.name} author={author} rank={idx + 1} />
          ))}
        </div>

        {remaining.length > 0 && (
          <Accordion.Root
            type="single"
            collapsible
            onValueChange={(value) => setIsOpen(value === "item-1")}
          >
            <Accordion.Item value="item-1" className="border-none">
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up transition-all duration-300">
                <div className="divide-y divide-slate-50 border-t border-slate-50 bg-slate-50/20">
                  {remaining.map((author, idx) => (
                    <CouncilorItem key={author.name} author={author} rank={idx + 6} />
                  ))}
                </div>
              </Accordion.Content>
              
              <Accordion.Trigger asChild>
                <button 
                  className={cn(
                    "w-full p-4 flex items-center justify-center gap-2 group transition-all duration-300 cursor-pointer",
                    isOpen ? "bg-slate-100/50" : "bg-white hover:bg-slate-50"
                  )}
                >
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">
                    {isOpen ? "Recolher Ranking" : "Ver ranking completo"}
                  </span>
                  <div className={cn(
                    "w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 transition-transform duration-500",
                    isOpen && "rotate-180 bg-blue-600 text-white"
                  )}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </button>
              </Accordion.Trigger>
            </Accordion.Item>
          </Accordion.Root>
        )}
      </div>
    </div>
  );
}

function CouncilorItem({ author, rank }: { author: Councilor; rank: number }) {
  return (
    <Link
      href={`/projetos?search=${encodeURIComponent(author.name)}`}
      className="p-4 flex items-center justify-between group hover:bg-blue-50/40 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 group-hover:scale-105 group-hover:rotate-2 shadow-sm",
            rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" : 
            rank === 2 ? "bg-slate-100 text-slate-700 border border-slate-200" :
            rank === 3 ? "bg-orange-100 text-orange-700 border border-orange-200" :
            "bg-slate-50 text-slate-500 border border-slate-100"
          )}>
            {author.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.foto} alt={author.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span>{author.initials}</span>
            )}
          </div>
          {rank <= 3 && (
            <div className={cn(
              "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm",
              rank === 1 ? "bg-amber-500 text-white" :
              rank === 2 ? "bg-slate-400 text-white" :
              "bg-orange-500 text-white"
            )}>
              {rank}
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors uppercase tracking-tight">
            {author.name}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            Câmara Municipal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Emendas</p>
          <p className="text-xs font-black text-slate-700">{author.count}</p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
          rank === 1 ? "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white" : "bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
        )}>
          <ChevronDown className="-rotate-90 w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
