"use client";

import { useState, useEffect, useRef } from "react";
import { FinancialEventType, FinancialRecord } from "@/lib/json-storage";

interface Event {
    id: string;
    [key: string]: any;
}

interface FinancialHistoryProps {
    amendmentId: string;
    onUpdate?: (record: FinancialRecord) => void;
}

const TAB_CONFIG: Record<FinancialEventType, { label: string; icon: string; columns: string[] }> = {
    empenho: {
        label: "Empenhos",
        icon: "contract",
        columns: ["numero", "data", "credor", "valor", "processo", "descricao"],
    },
    liquidacao: {
        label: "Liquidações",
        icon: "verified",
        columns: ["numero", "data", "valor", "descricao"],
    },
    pagamento: {
        label: "Pagamentos",
        icon: "payments",
        columns: ["data", "documento", "ordemBancaria", "valor", "banco", "descricao"],
    },
};

export function FinancialHistory({ amendmentId, onUpdate }: FinancialHistoryProps) {
    const [activeTab, setActiveTab] = useState<FinancialEventType>("empenho");
    const [record, setRecord] = useState<Partial<FinancialRecord> | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/financial/${amendmentId}`);
            const data = await res.json();
            setRecord(data);
            if (onUpdate) onUpdate(data);
        } catch (error) {
            console.error("Failed to fetch financial history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (amendmentId) fetchHistory();
    }, [amendmentId]);

    const handleAdd = () => {
        const emptyEvent: any = {};
        TAB_CONFIG[activeTab].columns.forEach(col => emptyEvent[col] = "");
        setModalData({ id: null, ...emptyEvent });
        setShowModal(true);
    };

    const handleEdit = (event: any) => {
        setModalData({ ...event });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const isEdit = !!modalData.id;
            const res = await fetch("/api/financial/events", {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amendmentId,
                    tipo: activeTab,
                    eventId: modalData.id,
                    event: { ...modalData }
                }),
            });
            if (res.ok) {
                await fetchHistory();
                setShowModal(false);
            }
        } catch (error) {
            console.error("Error saving event", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este evento?")) return;
        try {
            const res = await fetch("/api/financial/events", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amendmentId, tipo: activeTab, eventId: id }),
            });
            if (res.ok) await fetchHistory();
        } catch (error) {
            console.error("Error deleting event", error);
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tipo", activeTab);
        formData.append("amendmentId", amendmentId);

        try {
            const res = await fetch("/api/financial/events/import", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Importação concluída: ${data.added} eventos adicionados.`);
                await fetchHistory();
            } else {
                alert(`Erro na importação: ${data.error}`);
            }
        } catch (error) {
            console.error("CSV import error", error);
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const events = (record ? (record as any)[activeTab === "empenho" ? "empenhos" : activeTab === "liquidacao" ? "liquidacoes" : "pagamentos"] : []) || [];

    if (loading) return <div className="p-8 text-center text-slate-400">Carregando histórico...</div>;

    return (
        <div className="space-y-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-100">
                {(Object.keys(TAB_CONFIG) as FinancialEventType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
                            activeTab === type
                                ? "border-blue-500 text-blue-600 bg-blue-50/10"
                                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">{TAB_CONFIG[type].icon}</span>
                        {TAB_CONFIG[type].label}
                        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === type ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                            {((record as any)?.[type === "empenho" ? "empenhos" : type === "liquidacao" ? "liquidacoes" : "pagamentos"]?.length) || 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Adicionar {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">{importing ? "hourglass_empty" : "upload_file"}</span>
                        {importing ? "Importando..." : "Importar CSV"}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
                </div>
                <p className="text-xs text-slate-400 italic">
                    Dica: O CSV deve conter colunas com os nomes oficiais dos campos.
                </p>
            </div>

            {/* Events Table */}
            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            {TAB_CONFIG[activeTab].columns.map(col => (
                                <th key={col} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{col}</th>
                            ))}
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={TAB_CONFIG[activeTab].columns.length + 1} className="p-12 text-center text-slate-400 text-sm">
                                    Nenhum evento registrado nesta aba.
                                </td>
                            </tr>
                        ) : (
                            events.map((event: any) => (
                                <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                                    {TAB_CONFIG[activeTab].columns.map(col => (
                                        <td key={col} className={`px-5 py-4 text-sm ${col === 'valor' ? 'font-mono font-bold text-slate-900' : 'text-slate-600'}`}>
                                            {event[col] || "-"}
                                        </td>
                                    ))}
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleEdit(event)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(event.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                                <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <h3 className="font-bold text-slate-800">
                                {modalData.id ? "Editar" : "Adicionar"} {activeTab}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {TAB_CONFIG[activeTab].columns.map(col => (
                                <div key={col}>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{col}</label>
                                    {col === 'descricao' ? (
                                        <textarea
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all"
                                            rows={2}
                                            value={modalData[col] || ""}
                                            onChange={(e) => setModalData({ ...modalData, [col]: e.target.value })}
                                        />
                                    ) : (
                                        <input
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all"
                                            type={col === 'data' ? 'text' : 'text'}
                                            placeholder={col === 'data' ? 'DD/MM/AAAA' : col === 'valor' ? '0,00' : ''}
                                            value={modalData[col] || ""}
                                            onChange={(e) => setModalData({ ...modalData, [col]: e.target.value })}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/30 px-6 py-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                            >
                                {saving ? "Salvando..." : "Salvar Registro"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
