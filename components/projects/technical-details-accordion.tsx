"use client";

import { useState } from "react";

interface TechnicalDetailsAccordionProps {
    orgaoBeneficiario?: string;
    municipio?: string;
    cnpj?: string;
    fornecedor?: string;
    instrumentoJuridico?: string;
    prazoAplicacao?: string;
    codigoAplicacao?: string;
    numeroLicitacao?: string;
    headingLevel?: "h2" | "h3" | "h4";
}

interface FieldItem {
    label: string;
    value: string | undefined;
}

const INVALID_VALUES = new Set(["", "-", "—", "n/a", "N/A", "Não informado", "não informado"]);

function isValidValue(value: string | undefined): boolean {
    if (!value) return false;
    const trimmed = value.trim();
    if (trimmed === "") return false;
    return !INVALID_VALUES.has(trimmed);
}

export default function TechnicalDetailsAccordion({
    orgaoBeneficiario,
    municipio,
    cnpj,
    fornecedor,
    instrumentoJuridico,
    prazoAplicacao,
    codigoAplicacao,
    numeroLicitacao,
    headingLevel: HeadingTag = "h2",
}: TechnicalDetailsAccordionProps) {
    const [open, setOpen] = useState(false);

    const fields: FieldItem[] = [
        { label: "Órgão Beneficiário", value: orgaoBeneficiario },
        { label: "Município", value: municipio },
        { label: "CNPJ", value: cnpj },
        { label: "Fornecedor", value: fornecedor },
        { label: "Instrumento Jurídico", value: instrumentoJuridico },
        { label: "Prazo de Aplicação", value: prazoAplicacao },
        { label: "Código de Aplicação", value: codigoAplicacao },
        { label: "Nº Licitação", value: numeroLicitacao },
    ].filter(f => isValidValue(f.value));

    if (fields.length === 0) return null;

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-6 lg:p-8 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={open}
                aria-controls="technical-details-panel"
                id="technical-details-heading"
            >
                <div>
                    <HeadingTag className="text-xl font-bold">Detalhes Técnicos</HeadingTag>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {fields.length} campos disponíveis
                    </p>
                </div>
                <span
                    className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                >
                    expand_more
                </span>
            </button>

            <div
                id="technical-details-panel"
                role="region"
                aria-labelledby="technical-details-heading"
                className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="px-6 lg:px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 border-t border-slate-100 pt-6">
                    {fields.map(field => (
                        <div key={field.label}>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {field.label}
                            </p>
                            <p className="text-sm font-medium text-slate-800 break-words">
                                {field.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
