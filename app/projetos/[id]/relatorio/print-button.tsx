"use client";

export default function PrintReportButton() {
    return (
        <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={() => window.print()}
        >
            <span className="material-symbols-outlined text-sm">print</span>
            Imprimir Relatório
        </button>
    );
}
