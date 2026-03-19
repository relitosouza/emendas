"use client";

import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";

interface ShareCardProps {
    title: string;
    autor: string;
    autorPhoto?: string;
    autorInitials: string;
    valor: string;
    status: string;
    statusLabel: string;
    id: string;
}

export default function ShareCard({
    title,
    autor,
    autorPhoto,
    autorInitials,
    valor,
    status,
    statusLabel,
    id,
}: ShareCardProps) {
    const [open, setOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [feedback, setFeedback] = useState("");
    const cardRef = useRef<HTMLDivElement>(null);

    const getStatusColor = () => {
        if (status === "concluido") return { light: "bg-emerald-50 text-emerald-700" };
        if (status === "em_execucao") return { light: "bg-blue-50 text-blue-700" };
        if (status === "suspenso") return { light: "bg-red-50 text-red-700" };
        return { light: "bg-amber-50 text-amber-700" };
    };

    const statusColor = getStatusColor();

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(""), 2500);
    };

    const generateImage = useCallback(async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        setGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: "#0f172a",
                useCORS: true,
                allowTaint: false,
                logging: false,
            });

            return new Promise((resolve) => {
                canvas.toBlob(
                    (blob) => {
                        setGenerating(false);
                        resolve(blob);
                    },
                    "image/png",
                );
            });
        } catch (err) {
            console.error("html2canvas error:", err);
            // Fallback that might ignore some external content but won't crash
            try {
                const canvas = await html2canvas(cardRef.current!, {
                    scale: 2,
                    backgroundColor: "#0f172a",
                    useCORS: true,
                    logging: false,
                });
                return new Promise((resolve) => {
                    canvas.toBlob(
                        (blob) => {
                            setGenerating(false);
                            resolve(blob);
                        },
                        "image/png",
                    );
                });
            } catch (fallbackErr) {
                console.error("Fallback html2canvas error:", fallbackErr);
                setGenerating(false);
                showFeedback("Erro ao gerar imagem");
                return null;
            }
        }
    }, []);

    const handleDownload = async () => {
        const blob = await generateImage();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `emenda-${id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showFeedback("Imagem salva!");
    };

    const handleShare = async () => {
        const blob = await generateImage();
        if (!blob) return;

        const file = new File([blob], `emenda-${id}.png`, { type: "image/png" });

        // Try Web Share API with file
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            try {
                await navigator.share({
                    title: `Emenda: ${title}`,
                    text: `Confira esta emenda parlamentar: ${title} - ${valor}`,
                    files: [file],
                });
                return;
            } catch (err) {
                // User cancelled - that's fine
                if ((err as Error)?.name === "AbortError") return;
            }
        }

        // Fallback: try share without files (just link + text)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Emenda: ${title}`,
                    text: `Confira esta emenda parlamentar: ${title} - ${valor}`,
                    url: `${window.location.origin}/projetos/${id}`,
                });
                return;
            } catch (err) {
                if ((err as Error)?.name === "AbortError") return;
            }
        }

        // Final fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `emenda-${id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showFeedback("Imagem salva!");
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/projetos/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            showFeedback("Link copiado!");
        } catch {
            // Fallback for older browsers
            const input = document.createElement("input");
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            showFeedback("Link copiado!");
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all text-sm active:scale-95"
            >
                <span className="material-symbols-outlined text-xl">share</span>
                Compartilhar
            </button>
        );
    }

    return (
        <>
            {/* Keep the button visible behind modal */}
            <button
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl text-sm opacity-50"
                disabled
            >
                <span className="material-symbols-outlined text-xl">share</span>
                Compartilhar
            </button>

            {/* Modal Overlay */}
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setOpen(false)}
            >
                <div
                    className="relative flex flex-col items-center gap-6 max-w-lg w-full animate-[fadeIn_0.2s_ease-out]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute -top-2 -right-2 z-10 size-10 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    {/* Instagram-style Card */}
                    <div
                        ref={cardRef}
                        className="w-full aspect-[4/5] rounded-2xl overflow-hidden relative flex flex-col"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {/* Background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"></div>
                        {/* Pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                            backgroundSize: "24px 24px",
                        }}></div>

                        {/* Content */}
                        <div className="relative z-10 flex flex-col h-full p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/brasao-osasco.png"
                                        alt="Brasão"
                                        className="w-10 h-10 object-contain drop-shadow-lg"
                                    />
                                    <div>
                                        <p className="text-white text-sm font-bold leading-tight">Portal das Emendas</p>
                                        <p className="text-blue-300 text-[10px] font-medium uppercase tracking-wider">Prefeitura de Osasco</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full ${statusColor.light} text-[10px] font-bold uppercase tracking-wider`}>
                                    {statusLabel}
                                </div>
                            </div>

                            {/* Author section */}
                            <div className="flex flex-col items-center text-center mb-6">
                                {autorPhoto ? (
                                    <div className="relative size-24 mb-4">
                                        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse"></div>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`/api/proxy-image?url=${encodeURIComponent(autorPhoto || "")}`}
                                            alt={autor}
                                            className="relative z-10 size-24 rounded-full object-cover border-4 border-white/20 shadow-xl"
                                        />
                                    </div>
                                ) : (
                                    <div className="size-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-white font-bold text-2xl mb-4">
                                        {autorInitials}
                                    </div>
                                )}
                                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Autor da Emenda</p>
                                <p className="text-white text-lg font-bold">{autor}</p>
                            </div>

                            {/* Divider */}
                            <div className="w-16 h-0.5 bg-blue-500/40 mx-auto mb-6"></div>

                            {/* Title */}
                            <div className="flex-1 flex flex-col justify-center text-center mb-6">
                                <h2 className="text-white text-xl font-extrabold leading-tight line-clamp-3 mb-2">
                                    {title}
                                </h2>
                            </div>

                            {/* Value */}
                            <div className="text-center mb-8">
                                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Valor Destinado</p>
                                <p className="text-white text-3xl font-extrabold tracking-tight">{valor}</p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <p className="text-blue-400/60 text-[10px] font-medium">portaldasemendas.osasco.sp.gov.br</p>
                                <div className="flex items-center gap-1.5 text-blue-400/60">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Dados Oficiais</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback toast */}
                    {feedback && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 font-bold text-sm px-5 py-2.5 rounded-full shadow-xl animate-[fadeIn_0.15s_ease-out] z-20">
                            {feedback}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={handleDownload}
                            disabled={generating}
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3.5 px-6 rounded-xl transition-all hover:bg-slate-100 active:scale-95 disabled:opacity-50 text-sm shadow-lg"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            {generating ? "Gerando..." : "Baixar Imagem"}
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={generating}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 text-sm shadow-lg"
                        >
                            <span className="material-symbols-outlined text-lg">share</span>
                            {generating ? "Gerando..." : "Compartilhar"}
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="size-12 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-95 backdrop-blur-sm border border-white/10"
                            title="Copiar link"
                        >
                            <span className="material-symbols-outlined text-lg">link</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
