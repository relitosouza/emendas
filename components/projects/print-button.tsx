"use client";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 print:hidden"
        >
            <span className="material-symbols-outlined text-xl">print</span>
            Imprimir Relatório / PDF
        </button>
    );
}
