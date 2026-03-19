"use client";

import { useState, useEffect } from "react";

const FONT_SCALES = [1, 1.15, 1.3];
const FONT_SCALE_LABELS = ["Normal", "Médio", "Grande"];

export default function AccessibilityBar() {
    const [fontScale, setFontScale] = useState(0); // index into FONT_SCALES
    const [highContrast, setHighContrast] = useState(false);

    // Persist preferences across page loads
    useEffect(() => {
        const savedScale = localStorage.getItem("a11y-font-scale");
        const savedContrast = localStorage.getItem("a11y-high-contrast");
        if (savedScale) {
            const idx = FONT_SCALES.indexOf(parseFloat(savedScale));
            if (idx >= 0) setFontScale(idx);
        }
        if (savedContrast === "true") setHighContrast(true);
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty("--a11y-font-scale", String(FONT_SCALES[fontScale]));
        localStorage.setItem("a11y-font-scale", String(FONT_SCALES[fontScale]));
    }, [fontScale]);

    useEffect(() => {
        document.documentElement.classList.toggle("high-contrast", highContrast);
        localStorage.setItem("a11y-high-contrast", String(highContrast));
    }, [highContrast]);

    const nextFontScale = () => setFontScale(i => (i + 1) % FONT_SCALES.length);

    return (
        <div
            role="navigation"
            aria-label="Barra de acessibilidade"
            className="w-full bg-slate-800 text-white text-xs flex items-center justify-between px-4 py-1 print:hidden"
        >
            <div className="flex items-center gap-1">
                <span className="text-slate-400 mr-2 hidden sm:inline">Acessibilidade:</span>

                {/* Skip to content */}
                <a
                    href="#conteudo-principal"
                    className="skip-link px-2 py-0.5 rounded hover:bg-slate-700 focus:bg-blue-700 transition-colors whitespace-nowrap"
                >
                    Ir ao conteúdo
                </a>

                {/* Font size toggle */}
                <button
                    onClick={nextFontScale}
                    aria-label={`Tamanho de fonte: ${FONT_SCALE_LABELS[fontScale]}. Clique para alterar`}
                    className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 transition-colors"
                >
                    <span aria-hidden="true" className="font-bold" style={{ fontSize: `${0.7 + fontScale * 0.1}rem` }}>A</span>
                    <span className="sr-only">Fonte {FONT_SCALE_LABELS[fontScale]}</span>
                    <span aria-hidden="true" className="text-slate-400 text-[10px]">{FONT_SCALE_LABELS[fontScale]}</span>
                </button>

                {/* High contrast toggle */}
                <button
                    onClick={() => setHighContrast(v => !v)}
                    aria-label={highContrast ? "Desativar alto contraste" : "Ativar alto contraste"}
                    aria-pressed={highContrast}
                    className={`px-2 py-0.5 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${
                        highContrast ? "bg-yellow-400 text-black font-bold" : "hover:bg-slate-700"
                    }`}
                >
                    <span aria-hidden="true">⬤</span> Contraste
                </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-slate-400">
                <a
                    href="https://www.vlibras.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 rounded"
                    aria-label="VLibras - Tradutor de Libras (abre em nova aba)"
                >
                    VLibras
                </a>
                <span aria-hidden="true">|</span>
                <span>eMAG / WCAG 2.1 AA</span>
            </div>
        </div>
    );
}
