"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/shared/navbar";

interface CardData {
    id: string;
    label: string;
    value: string;
    trend?: string;
    icon: string;
    color: string;
    description?: string;
    total?: string;
    order: number;
}

const ICON_OPTIONS = [
    "payments", "analytics", "verified", "trending_up", "people",
    "location_city", "school", "local_hospital", "security", "construction",
    "eco", "sports", "theater_comedy", "directions_bus", "savings",
];

const COLOR_OPTIONS = [
    { value: "blue", label: "Azul", bg: "bg-blue-500" },
    { value: "teal", label: "Verde", bg: "bg-teal-500" },
    { value: "amber", label: "Âmbar", bg: "bg-amber-500" },
    { value: "red", label: "Vermelho", bg: "bg-red-500" },
    { value: "purple", label: "Roxo", bg: "bg-purple-500" },
    { value: "emerald", label: "Esmeralda", bg: "bg-emerald-500" },
    { value: "rose", label: "Rosa", bg: "bg-rose-500" },
];

const emptyCard: CardData = {
    id: "",
    label: "",
    value: "",
    trend: "",
    icon: "payments",
    color: "blue",
    description: "",
    total: "",
    order: 0,
};

export default function AdminCardsPage() {
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingCard, setEditingCard] = useState<CardData | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    useEffect(() => {
        fetchCards();
    }, []);

    async function fetchCards() {
        try {
            const res = await fetch("/api/dashboard-cards");
            const data = await res.json();
            if (Array.isArray(data)) setCards(data);
        } catch (error) {
            console.error("Error fetching cards:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await fetch("/api/dashboard-cards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cards }),
            });
            if (res.ok) {
                setFeedback({ type: "success", msg: "Cards salvos com sucesso!" });
                setTimeout(() => setFeedback(null), 3000);
            } else {
                throw new Error("Failed");
            }
        } catch {
            setFeedback({ type: "error", msg: "Erro ao salvar os cards." });
        } finally {
            setSaving(false);
        }
    }

    function handleAddOrUpdate(card: CardData) {
        if (card.id) {
            setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
        } else {
            const newCard = { ...card, id: `card_${Date.now()}`, order: cards.length };
            setCards((prev) => [...prev, newCard]);
        }
        setEditingCard(null);
        setShowForm(false);
    }

    function handleDelete(id: string) {
        setCards((prev) => prev.filter((c) => c.id !== id));
    }

    function handleMoveUp(index: number) {
        if (index === 0) return;
        const updated = [...cards];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        updated.forEach((c, i) => (c.order = i));
        setCards(updated);
    }

    function handleMoveDown(index: number) {
        if (index === cards.length - 1) return;
        const updated = [...cards];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        updated.forEach((c, i) => (c.order = i));
        setCards(updated);
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans text-slate-800">
            <Navbar />

            <main className="flex-1">
                <div className="mx-auto max-w-[1100px] p-6 lg:p-10 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-2">
                                <Link href="/admin/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                                <span className="text-slate-700 font-bold">Gerenciar Cards</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Cards do Painel</h1>
                            <p className="text-sm text-slate-500 mt-1">Gerencie os cards de estatísticas exibidos na página principal.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setEditingCard({ ...emptyCard });
                                    setShowForm(true);
                                }}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Novo Card
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">{saving ? "hourglass_empty" : "save"}</span>
                                {saving ? "Salvando..." : "Salvar Tudo"}
                            </button>
                        </div>
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div className={`flex items-center gap-3 rounded-xl p-4 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                            <span className="material-symbols-outlined text-[18px]">{feedback.type === "success" ? "check_circle" : "error"}</span>
                            {feedback.msg}
                        </div>
                    )}

                    {/* Cards List */}
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Carregando...</div>
                    ) : cards.length === 0 ? (
                        <div className="text-center py-16 space-y-4">
                            <span className="material-symbols-outlined text-[48px] text-slate-300">widgets</span>
                            <p className="text-slate-500">Nenhum card cadastrado ainda.</p>
                            <p className="text-xs text-slate-400">Clique em "Novo Card" para começar.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cards.map((card, index) => (
                                <div
                                    key={card.id}
                                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
                                >
                                    {/* Order Controls */}
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === cards.length - 1}
                                            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                                        </button>
                                    </div>

                                    {/* Preview Icon */}
                                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-${card.color}-50 text-${card.color}-600`}>
                                        <span className="material-symbols-outlined">{card.icon}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{card.label}</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <p className="text-xl font-bold text-slate-800">{card.value}</p>
                                            {card.trend && <span className={`text-xs font-bold text-${card.color}-600`}>{card.trend}</span>}
                                            {card.total && <span className="text-sm text-slate-400">{card.total}</span>}
                                        </div>
                                        {card.description && <p className="text-xs text-slate-400 mt-1 truncate">{card.description}</p>}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => {
                                                setEditingCard({ ...card });
                                                setShowForm(true);
                                            }}
                                            className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(card.id)}
                                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Preview */}
                    {cards.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Pré-visualização</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {cards.map((card) => (
                                    <div key={card.id} className="relative overflow-hidden rounded-[16px] bg-white border border-slate-100 p-8 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.03)]">
                                        <div className="mb-4 flex items-start justify-between">
                                            <p className="font-mono text-sm uppercase tracking-widest text-slate-500">{card.label}</p>
                                            <span className={`material-symbols-outlined text-${card.color}-500`}>{card.icon}</span>
                                        </div>
                                        <div className="mb-2 flex items-baseline gap-2">
                                            <h3 className="font-heading text-4xl font-bold text-slate-800">{card.value}</h3>
                                            {card.trend && <span className={`font-mono text-sm text-${card.color}-600 bg-${card.color}-50 px-2 py-1 rounded`}>{card.trend}</span>}
                                            {card.total && <span className="text-lg text-slate-400">{card.total}</span>}
                                        </div>
                                        {card.description && <p className="text-xs text-slate-500 mt-2">{card.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Form */}
            {showForm && editingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingCard.id ? "Editar Card" : "Novo Card"}
                            </h2>
                            <button
                                onClick={() => { setShowForm(false); setEditingCard(null); }}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Label */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Título</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Ex: Orçamento Aprovado 2026"
                                    value={editingCard.label}
                                    onChange={(e) => setEditingCard({ ...editingCard, label: e.target.value })}
                                />
                            </div>

                            {/* Value + Trend Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Valor Principal</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Ex: R$ 12.5M ou 64%"
                                        value={editingCard.value}
                                        onChange={(e) => setEditingCard({ ...editingCard, value: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Badge / Tendência</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Ex: +15% ou Pago"
                                        value={editingCard.trend || ""}
                                        onChange={(e) => setEditingCard({ ...editingCard, trend: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Total */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Complemento (total)</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Ex: / 45 (opcional)"
                                    value={editingCard.total || ""}
                                    onChange={(e) => setEditingCard({ ...editingCard, total: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Descrição</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Breve descrição do card"
                                    value={editingCard.description || ""}
                                    onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                                />
                            </div>

                            {/* Icon + Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ícone</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ICON_OPTIONS.map((icon) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setEditingCard({ ...editingCard, icon })}
                                                className={`rounded-lg p-2 transition-all ${editingCard.icon === icon
                                                    ? "bg-blue-100 text-blue-600 ring-2 ring-blue-500"
                                                    : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Cor</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLOR_OPTIONS.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setEditingCard({ ...editingCard, color: color.value })}
                                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${editingCard.color === color.value
                                                    ? "ring-2 ring-slate-900 bg-slate-100"
                                                    : "bg-slate-50 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <span className={`h-3 w-3 rounded-full ${color.bg}`}></span>
                                                {color.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
                            <button
                                onClick={() => { setShowForm(false); setEditingCard(null); }}
                                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleAddOrUpdate(editingCard)}
                                disabled={!editingCard.label || !editingCard.value}
                                className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50 transition-all hover:shadow-lg"
                            >
                                {editingCard.id ? "Atualizar" : "Adicionar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white px-6 py-8 lg:px-8">
                <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="font-mono text-xs text-slate-400">© 2026 Portal das Emendas Osasco</p>
                    <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <a href="#" className="transition-colors hover:text-blue-600">Transparência</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Termos</a>
                        <a href="#" className="transition-colors hover:text-blue-600">Contato</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
