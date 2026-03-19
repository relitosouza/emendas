# Financial Events History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Add detailed empenho/liquidação/pagamento event history to each amendment, with admin CRUD and public visualization.

**Architecture:** Expand `FinancialRecord` in `lib/json-storage.ts` with optional event arrays; add `/api/financial/events` and `/api/financial/[amendmentId]` routes; create `FinancialHistory` admin component; add public "Execução Financeira" section to the project details page. All changes are retrocompatible — existing `empenhado`/`liquidado`/`pago` fields remain as auto-calculated totals.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, ioredis (Redis Cloud), JSON file fallback for local dev.

**Design doc:** `docs/plans/2026-03-12-empenho-liquidacao-pagamento-design.md`

---

### Task 1: Expand FinancialRecord types in lib/json-storage.ts

**Files:**
- Modify: `lib/json-storage.ts`

**Step 1: Add the three event interfaces and expand FinancialRecord**

In `lib/json-storage.ts`, right before the existing `FinancialRecord` interface (line 86), insert:

```ts
export interface EmpenhoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    credor: string;
    processo: string;
    descricao: string;
    subEmpenho?: string;
    createdAt: string;
}

export interface LiquidacaoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    descricao: string;
    createdAt: string;
}

export interface PagamentoEvent {
    id: string;
    data: string;
    valor: string;
    banco: string;
    agencia: string;
    documento: string;
    ordemBancaria: string;
    descricao: string;
    createdAt: string;
}
```

Then update `FinancialRecord` to add the optional arrays at the end:

```ts
export interface FinancialRecord {
    amendmentId: string;
    empenhado: string;
    liquidado: string;
    pago: string;
    reservado: string;
    updatedAt: string;
    // Event history (undefined on old records — treat as [])
    empenhos?: EmpenhoEvent[];
    liquidacoes?: LiquidacaoEvent[];
    pagamentos?: PagamentoEvent[];
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (existing code uses `FinancialRecord` but doesn't touch the new optional fields).

**Step 3: Commit**

```bash
git add lib/json-storage.ts
git commit -m "feat: expand FinancialRecord with event history types"
```

---

### Task 2: Add event CRUD functions to lib/json-storage.ts

**Files:**
- Modify: `lib/json-storage.ts`

**Step 1: Add helper to recalculate totals from events**

Add this function after `upsertFinancialData`:

```ts
function sumEvents(events: Array<{ valor: string }> = []): string {
    const total = events.reduce((acc, e) => {
        const cleaned = String(e.valor).replace(/[R$\s.]/g, "").replace(",", ".");
        return acc + (parseFloat(cleaned) || 0);
    }, 0);
    if (total === 0) return "0";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total);
}
```

**Step 2: Add addFinancialEvent function**

```ts
export type FinancialEventType = "empenho" | "liquidacao" | "pagamento";

export async function addFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData: any
): Promise<FinancialRecord> {
    const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    const recordMap = new Map<string, FinancialRecord>();
    for (const r of rawRecords) {
        if (r.amendmentId) recordMap.set(r.amendmentId, r);
    }

    const current = recordMap.get(amendmentId) ?? {
        amendmentId,
        empenhado: "0",
        liquidado: "0",
        pago: "0",
        reservado: "0",
        updatedAt: new Date().toISOString(),
    };

    const newEvent = { ...eventData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

    const updated: FinancialRecord = {
        ...current,
        empenhos: tipo === "empenho" ? [...(current.empenhos ?? []), newEvent] : (current.empenhos ?? []),
        liquidacoes: tipo === "liquidacao" ? [...(current.liquidacoes ?? []), newEvent] : (current.liquidacoes ?? []),
        pagamentos: tipo === "pagamento" ? [...(current.pagamentos ?? []), newEvent] : (current.pagamentos ?? []),
        updatedAt: new Date().toISOString(),
    };

    // Recalculate totals
    updated.empenhado = sumEvents(updated.empenhos) || current.empenhado;
    updated.liquidado = sumEvents(updated.liquidacoes) || current.liquidado;
    updated.pago = sumEvents(updated.pagamentos) || current.pago;

    recordMap.set(amendmentId, updated);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
    return updated;
}
```

**Step 3: Add updateFinancialEvent function**

```ts
export async function updateFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    eventId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData: any
): Promise<FinancialRecord> {
    const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    const recordMap = new Map<string, FinancialRecord>();
    for (const r of rawRecords) {
        if (r.amendmentId) recordMap.set(r.amendmentId, r);
    }

    const current = recordMap.get(amendmentId);
    if (!current) throw new Error(`FinancialRecord not found for amendmentId: ${amendmentId}`);

    const replaceById = (arr: Array<{ id: string }> = []) =>
        arr.map((e) => (e.id === eventId ? { ...e, ...eventData, id: eventId } : e));

    const updated: FinancialRecord = {
        ...current,
        empenhos: tipo === "empenho" ? replaceById(current.empenhos) as EmpenhoEvent[] : current.empenhos,
        liquidacoes: tipo === "liquidacao" ? replaceById(current.liquidacoes) as LiquidacaoEvent[] : current.liquidacoes,
        pagamentos: tipo === "pagamento" ? replaceById(current.pagamentos) as PagamentoEvent[] : current.pagamentos,
        updatedAt: new Date().toISOString(),
    };

    updated.empenhado = sumEvents(updated.empenhos) || current.empenhado;
    updated.liquidado = sumEvents(updated.liquidacoes) || current.liquidado;
    updated.pago = sumEvents(updated.pagamentos) || current.pago;

    recordMap.set(amendmentId, updated);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
    return updated;
}
```

**Step 4: Add deleteFinancialEvent function**

```ts
export async function deleteFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    eventId: string
): Promise<FinancialRecord> {
    const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    const recordMap = new Map<string, FinancialRecord>();
    for (const r of rawRecords) {
        if (r.amendmentId) recordMap.set(r.amendmentId, r);
    }

    const current = recordMap.get(amendmentId);
    if (!current) throw new Error(`FinancialRecord not found for amendmentId: ${amendmentId}`);

    const removeById = (arr: Array<{ id: string }> = []) => arr.filter((e) => e.id !== eventId);

    const updated: FinancialRecord = {
        ...current,
        empenhos: tipo === "empenho" ? removeById(current.empenhos) as EmpenhoEvent[] : current.empenhos,
        liquidacoes: tipo === "liquidacao" ? removeById(current.liquidacoes) as LiquidacaoEvent[] : current.liquidacoes,
        pagamentos: tipo === "pagamento" ? removeById(current.pagamentos) as PagamentoEvent[] : current.pagamentos,
        updatedAt: new Date().toISOString(),
    };

    updated.empenhado = sumEvents(updated.empenhos) || current.empenhado;
    updated.liquidado = sumEvents(updated.liquidacoes) || current.liquidado;
    updated.pago = sumEvents(updated.pagamentos) || current.pago;

    recordMap.set(amendmentId, updated);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
    return updated;
}
```

**Step 5: Add getFinancialRecord function**

```ts
export async function getFinancialRecord(amendmentId: string): Promise<FinancialRecord | null> {
    const records = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    return records.find((r) => r.amendmentId === amendmentId) ?? null;
}
```

**Step 6: Update getAmendmentsFromSheet to pass event arrays through**

In the `mergeFinancial` function (around line 199), update the returned object to also spread event arrays:

```ts
return {
    ...amendment,
    empenhado: financial.empenhado !== undefined ? financial.empenhado : amendment.empenhado,
    liquidado: financial.liquidado !== undefined ? financial.liquidado : amendment.liquidado,
    pago: financial.pago !== undefined ? financial.pago : amendment.pago,
    reservado: financial.reservado !== undefined ? financial.reservado : amendment.reservado,
    // Pass event history to amendment
    empenhos: financial.empenhos ?? [],
    liquidacoes: financial.liquidacoes ?? [],
    pagamentos: financial.pagamentos ?? [],
};
```

**Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 8: Commit**

```bash
git add lib/json-storage.ts
git commit -m "feat: add event CRUD functions to json-storage (addFinancialEvent, updateFinancialEvent, deleteFinancialEvent)"
```

---

### Task 3: Add GET /api/financial/[amendmentId] route

**Files:**
- Create: `app/api/financial/[amendmentId]/route.ts`

**Step 1: Create the route file**

```ts
import { NextResponse } from "next/server";
import { getFinancialRecord } from "@/lib/json-storage";

interface RouteParams {
    params: Promise<{ amendmentId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
    const { amendmentId } = await params;

    try {
        const record = await getFinancialRecord(amendmentId);
        if (!record) {
            return NextResponse.json({
                amendmentId,
                empenhado: "0",
                liquidado: "0",
                pago: "0",
                reservado: "0",
                empenhos: [],
                liquidacoes: [],
                pagamentos: [],
                updatedAt: "",
            });
        }
        return NextResponse.json({
            ...record,
            empenhos: record.empenhos ?? [],
            liquidacoes: record.liquidacoes ?? [],
            pagamentos: record.pagamentos ?? [],
        });
    } catch {
        return NextResponse.json({ error: "Falha ao buscar dados financeiros" }, { status: 500 });
    }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Manually test the endpoint (dev server)**

Start: `npm run dev`
Fetch: `GET /api/financial/112.17.15.2026`
Expected: JSON with `reservado: "271.000,00"` and empty `empenhos`/`liquidacoes`/`pagamentos` arrays.

**Step 4: Commit**

```bash
git add app/api/financial/[amendmentId]/route.ts
git commit -m "feat: add GET /api/financial/[amendmentId] route"
```

---

### Task 4: Add POST/PUT/DELETE /api/financial/events route

**Files:**
- Create: `app/api/financial/events/route.ts`

**Step 1: Create the route file**

```ts
import { NextResponse } from "next/server";
import { addFinancialEvent, updateFinancialEvent, deleteFinancialEvent, FinancialEventType } from "@/lib/json-storage";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const VALID_TYPES: FinancialEventType[] = ["empenho", "liquidacao", "pagamento"];

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, tipo, event } = body;

        if (!amendmentId || !tipo || !event) {
            return NextResponse.json({ error: "amendmentId, tipo, and event are required" }, { status: 400 });
        }
        if (!VALID_TYPES.includes(tipo)) {
            return NextResponse.json({ error: `tipo must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const updated = await addFinancialEvent(amendmentId, tipo, event);
        return NextResponse.json({ success: true, record: updated }, { status: 201 });
    } catch {
        return NextResponse.json({ error: "Falha ao adicionar evento" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, tipo, eventId, event } = body;

        if (!amendmentId || !tipo || !eventId || !event) {
            return NextResponse.json({ error: "amendmentId, tipo, eventId, and event are required" }, { status: 400 });
        }
        if (!VALID_TYPES.includes(tipo)) {
            return NextResponse.json({ error: `tipo must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const updated = await updateFinancialEvent(amendmentId, tipo, eventId, event);
        return NextResponse.json({ success: true, record: updated });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) {
            return NextResponse.json({ error: msg }, { status: 404 });
        }
        return NextResponse.json({ error: "Falha ao atualizar evento" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { amendmentId, tipo, eventId } = body;

        if (!amendmentId || !tipo || !eventId) {
            return NextResponse.json({ error: "amendmentId, tipo, and eventId are required" }, { status: 400 });
        }
        if (!VALID_TYPES.includes(tipo)) {
            return NextResponse.json({ error: `tipo must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
        }

        const updated = await deleteFinancialEvent(amendmentId, tipo, eventId);
        return NextResponse.json({ success: true, record: updated });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("not found")) {
            return NextResponse.json({ error: msg }, { status: 404 });
        }
        return NextResponse.json({ error: "Falha ao remover evento" }, { status: 500 });
    }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Manually test POST (dev server)**

```bash
curl -X POST http://localhost:3000/api/financial/events \
  -H "Content-Type: application/json" \
  -d '{"amendmentId":"112.17.15.2026","tipo":"empenho","event":{"numero":"2026NE000001","data":"15/03/2026","valor":"50.000,00","credor":"Empresa Teste Ltda","processo":"001/2026","descricao":"Teste de empenho","subEmpenho":""}}'
```
Expected: 401 (not authenticated) or 201 with record.

**Step 4: Commit**

```bash
git add app/api/financial/events/route.ts
git commit -m "feat: add POST/PUT/DELETE /api/financial/events route"
```

---

### Task 5: Create FinancialHistory admin component

**Files:**
- Create: `components/admin/financial-history.tsx`

**Step 1: Create the component**

This is a large component — create `components/admin/financial-history.tsx` with the following structure:

```tsx
"use client";

import { useState, useEffect } from "react";
import { parseCurrency, formatCurrency } from "@/lib/amendments-utils";

interface EmpenhoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    credor: string;
    processo: string;
    descricao: string;
    subEmpenho?: string;
    createdAt: string;
}

interface LiquidacaoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    descricao: string;
    createdAt: string;
}

interface PagamentoEvent {
    id: string;
    data: string;
    valor: string;
    banco: string;
    agencia: string;
    documento: string;
    ordemBancaria: string;
    descricao: string;
    createdAt: string;
}

interface FinancialHistoryProps {
    amendmentId: string;
    reservado?: string;
    onTotalsChange?: (totals: { empenhado: string; liquidado: string; pago: string }) => void;
}

const EMPTY_EMPENHO: Omit<EmpenhoEvent, "id" | "createdAt"> = {
    numero: "", data: "", valor: "", credor: "", processo: "", descricao: "", subEmpenho: ""
};
const EMPTY_LIQUIDACAO: Omit<LiquidacaoEvent, "id" | "createdAt"> = {
    numero: "", data: "", valor: "", descricao: ""
};
const EMPTY_PAGAMENTO: Omit<PagamentoEvent, "id" | "createdAt"> = {
    data: "", valor: "", banco: "", agencia: "", documento: "", ordemBancaria: "", descricao: ""
};

export function FinancialHistory({ amendmentId, reservado, onTotalsChange }: FinancialHistoryProps) {
    const [activeTab, setActiveTab] = useState<"empenhos" | "liquidacoes" | "pagamentos">("empenhos");
    const [empenhos, setEmpenhos] = useState<EmpenhoEvent[]>([]);
    const [liquidacoes, setLiquidacoes] = useState<LiquidacaoEvent[]>([]);
    const [pagamentos, setPagamentos] = useState<PagamentoEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modal, setModal] = useState<{ open: boolean; mode: "add" | "edit"; tipo: "empenho" | "liquidacao" | "pagamento"; data: any; editId?: string }>({
        open: false, mode: "add", tipo: "empenho", data: { ...EMPTY_EMPENHO }
    });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/financial/${encodeURIComponent(amendmentId)}`);
                if (res.ok) {
                    const data = await res.json();
                    setEmpenhos(data.empenhos ?? []);
                    setLiquidacoes(data.liquidacoes ?? []);
                    setPagamentos(data.pagamentos ?? []);
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [amendmentId]);

    const sumValores = (arr: Array<{ valor: string }>) =>
        formatCurrency(arr.reduce((s, e) => s + parseCurrency(e.valor), 0));

    const empenhadoTotal = sumValores(empenhos);
    const liquidadoTotal = sumValores(liquidacoes);
    const pagoTotal = sumValores(pagamentos);

    useEffect(() => {
        onTotalsChange?.({ empenhado: empenhadoTotal, liquidado: liquidadoTotal, pago: pagoTotal });
    }, [empenhadoTotal, liquidadoTotal, pagoTotal]);

    const openAdd = (tipo: "empenho" | "liquidacao" | "pagamento") => {
        const emptyData = tipo === "empenho" ? { ...EMPTY_EMPENHO } : tipo === "liquidacao" ? { ...EMPTY_LIQUIDACAO } : { ...EMPTY_PAGAMENTO };
        setModal({ open: true, mode: "add", tipo, data: emptyData });
    };

    const openEdit = (tipo: "empenho" | "liquidacao" | "pagamento", event: any) => {
        setModal({ open: true, mode: "edit", tipo, data: { ...event }, editId: event.id });
    };

    const closeModal = () => setModal((m) => ({ ...m, open: false }));

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            const isEdit = modal.mode === "edit";
            const url = "/api/financial/events";
            const body = isEdit
                ? { amendmentId, tipo: modal.tipo, eventId: modal.editId, event: modal.data }
                : { amendmentId, tipo: modal.tipo, event: modal.data };

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Erro ao salvar");

            setEmpenhos(json.record.empenhos ?? []);
            setLiquidacoes(json.record.liquidacoes ?? []);
            setPagamentos(json.record.pagamentos ?? []);
            setFeedback({ type: "success", msg: isEdit ? "Evento atualizado." : "Evento adicionado." });
            closeModal();
        } catch (e: any) {
            setFeedback({ type: "error", msg: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (tipo: "empenho" | "liquidacao" | "pagamento", eventId: string) => {
        if (!confirm("Remover este evento?")) return;
        try {
            const res = await fetch("/api/financial/events", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amendmentId, tipo, eventId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Erro ao remover");
            setEmpenhos(json.record.empenhos ?? []);
            setLiquidacoes(json.record.liquidacoes ?? []);
            setPagamentos(json.record.pagamentos ?? []);
            setFeedback({ type: "success", msg: "Evento removido." });
        } catch (e: any) {
            setFeedback({ type: "error", msg: e.message });
        }
    };

    const TABS = [
        { key: "empenhos" as const, label: "Empenhos", count: empenhos.length, total: empenhadoTotal },
        { key: "liquidacoes" as const, label: "Liquidações", count: liquidacoes.length, total: liquidadoTotal },
        { key: "pagamentos" as const, label: "Pagamentos", count: pagamentos.length, total: pagoTotal },
    ];

    if (loading) {
        return <div className="animate-pulse h-32 rounded-xl bg-slate-100" />;
    }

    return (
        <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Reservado", value: reservado ? formatCurrency(parseCurrency(reservado)) : "R$ 0,00", color: "blue" },
                    { label: "Empenhado", value: empenhadoTotal, color: "yellow" },
                    { label: "Liquidado", value: liquidadoTotal, color: "orange" },
                    { label: "Pago", value: pagoTotal, color: "green" },
                ].map((card) => (
                    <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Feedback */}
            {feedback && (
                <div className={`rounded-lg px-4 py-2 text-sm font-medium ${feedback.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {feedback.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.key ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-1.5 text-xs bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    {/* Empenhos tab */}
                    {activeTab === "empenhos" && (
                        <EventTable
                            events={empenhos}
                            columns={["Número", "Data", "Valor", "Credor", "Processo"]}
                            renderRow={(e: EmpenhoEvent) => [e.numero, e.data, formatCurrency(parseCurrency(e.valor)), e.credor, e.processo]}
                            onAdd={() => openAdd("empenho")}
                            onEdit={(e) => openEdit("empenho", e)}
                            onDelete={(id) => handleDelete("empenho", id)}
                        />
                    )}

                    {/* Liquidações tab */}
                    {activeTab === "liquidacoes" && (
                        <EventTable
                            events={liquidacoes}
                            columns={["Número", "Data", "Valor", "Descrição"]}
                            renderRow={(e: LiquidacaoEvent) => [e.numero, e.data, formatCurrency(parseCurrency(e.valor)), e.descricao]}
                            onAdd={() => openAdd("liquidacao")}
                            onEdit={(e) => openEdit("liquidacao", e)}
                            onDelete={(id) => handleDelete("liquidacao", id)}
                        />
                    )}

                    {/* Pagamentos tab */}
                    {activeTab === "pagamentos" && (
                        <EventTable
                            events={pagamentos}
                            columns={["Data", "Valor", "Banco", "OB", "Documento"]}
                            renderRow={(e: PagamentoEvent) => [e.data, formatCurrency(parseCurrency(e.valor)), e.banco, e.ordemBancaria, e.documento]}
                            onAdd={() => openAdd("pagamento")}
                            onEdit={(e) => openEdit("pagamento", e)}
                            onDelete={(id) => handleDelete("pagamento", id)}
                        />
                    )}
                </div>
            </div>

            {/* Modal */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <h3 className="font-bold text-slate-900 capitalize">
                                {modal.mode === "add" ? "Adicionar" : "Editar"} {modal.tipo}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            <EventForm tipo={modal.tipo} data={modal.data} onChange={(data) => setModal((m) => ({ ...m, data }))} />
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                            >
                                {saving ? "Salvando..." : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface EventTableProps {
    events: Array<{ id: string }>;
    columns: string[];
    renderRow: (event: any) => string[];
    onAdd: () => void;
    onEdit: (event: any) => void;
    onDelete: (id: string) => void;
}

function EventTable({ events, columns, renderRow, onAdd, onEdit, onDelete }: EventTableProps) {
    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <button onClick={onAdd} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Adicionar
                </button>
            </div>
            {events.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Nenhum evento registrado ainda.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100">
                                {columns.map((col) => (
                                    <th key={col} className="pb-2 pr-4 text-left text-xs font-semibold text-slate-500">{col}</th>
                                ))}
                                <th className="pb-2 text-right text-xs font-semibold text-slate-500">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => {
                                const cells = renderRow(event);
                                return (
                                    <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50">
                                        {cells.map((cell, i) => (
                                            <td key={i} className="py-2 pr-4 text-slate-700 max-w-[180px] truncate">{cell}</td>
                                        ))}
                                        <td className="py-2 text-right">
                                            <button onClick={() => onEdit(event)} className="mr-2 text-slate-400 hover:text-blue-600">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button onClick={() => onDelete(event.id)} className="text-slate-400 hover:text-red-600">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

interface EventFormProps {
    tipo: "empenho" | "liquidacao" | "pagamento";
    data: any;
    onChange: (data: any) => void;
}

function EventForm({ tipo, data, onChange }: EventFormProps) {
    const field = (label: string, key: string, placeholder?: string) => (
        <div key={key}>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
            <input
                value={data[key] ?? ""}
                onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
        </div>
    );
    const textarea = (label: string, key: string) => (
        <div key={key}>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
            <textarea
                value={data[key] ?? ""}
                onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none"
            />
        </div>
    );

    if (tipo === "empenho") return (
        <div className="space-y-3">
            {field("Número do Empenho", "numero", "2026NE000123")}
            {field("Data", "data", "DD/MM/AAAA")}
            {field("Valor (R$)", "valor", "50.000,00")}
            {field("Credor / Fornecedor", "credor")}
            {field("Número do Processo", "processo", "001/2026")}
            {field("Sub-empenho (opcional)", "subEmpenho")}
            {textarea("Descrição / Histórico", "descricao")}
        </div>
    );

    if (tipo === "liquidacao") return (
        <div className="space-y-3">
            {field("Número da Liquidação", "numero", "2026NL000045")}
            {field("Data", "data", "DD/MM/AAAA")}
            {field("Valor (R$)", "valor", "50.000,00")}
            {textarea("Descrição / Histórico", "descricao")}
        </div>
    );

    // pagamento
    return (
        <div className="space-y-3">
            {field("Data", "data", "DD/MM/AAAA")}
            {field("Valor (R$)", "valor", "50.000,00")}
            {field("Banco", "banco", "Banco do Brasil")}
            {field("Agência", "agencia")}
            {field("Ordem Bancária (OB)", "ordemBancaria")}
            {field("Número do Documento", "documento")}
            {textarea("Descrição / Histórico", "descricao")}
        </div>
    );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add components/admin/financial-history.tsx
git commit -m "feat: add FinancialHistory admin component with event CRUD"
```

---

### Task 6: Integrate FinancialHistory into the admin edit page

**Files:**
- Modify: `app/admin/amendments/[id]/edit/page.tsx`

**Step 1: Locate the "financeiro" phase section**

In `app/admin/amendments/[id]/edit/page.tsx`, search for `key: "financeiro"` or the section that renders financial fields. The phase tabs are defined around line 18-25.

**Step 2: Import FinancialHistory at the top of the file**

Add after the existing imports:

```tsx
import { FinancialHistory } from "@/components/admin/financial-history";
```

**Step 3: Add FinancialHistory below the financial fields**

Find the JSX block that renders when `activePhase === "financeiro"`. At the **bottom of that block**, before the closing div, add:

```tsx
{amendment?.id && (
    <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">receipt_long</span>
            Histórico de Execução Financeira
        </h3>
        <FinancialHistory
            amendmentId={amendment.id}
            reservado={amendment.reservado}
        />
    </div>
)}
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 5: Manually test in browser**

Navigate to `/admin/amendments/<any-id>/edit`, click the "Financeiro" tab.
Expected: "Histórico de Execução Financeira" section visible below financial fields with 3 tabs (Empenhos, Liquidações, Pagamentos) and "Adicionar" button.

**Step 6: Commit**

```bash
git add app/admin/amendments/[id]/edit/page.tsx
git commit -m "feat: integrate FinancialHistory into admin edit page"
```

---

### Task 7: Add public "Execução Financeira" section to project details page

**Files:**
- Create: `components/projects/financial-execution.tsx`
- Modify: `app/projetos/[id]/page.tsx`

**Step 1: Create the public display component**

Create `components/projects/financial-execution.tsx`:

```tsx
import { parseCurrency, formatCurrency } from "@/lib/amendments-utils";

interface EmpenhoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    credor: string;
    processo: string;
    descricao: string;
    subEmpenho?: string;
}

interface LiquidacaoEvent {
    id: string;
    numero: string;
    data: string;
    valor: string;
    descricao: string;
}

interface PagamentoEvent {
    id: string;
    data: string;
    valor: string;
    banco: string;
    agencia: string;
    documento: string;
    ordemBancaria: string;
    descricao: string;
}

interface FinancialExecutionProps {
    valorTotal: number;
    reservado: number;
    empenhado: number;
    liquidado: number;
    pago: number;
    empenhos?: EmpenhoEvent[];
    liquidacoes?: LiquidacaoEvent[];
    pagamentos?: PagamentoEvent[];
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

function StageCard({ label, value, total, color, barColor }: { label: string; value: number; total: number; color: string; barColor: string }) {
    return (
        <div className={`rounded-xl border p-4 ${color}`}>
            <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
            <p className="text-base font-bold text-slate-800">{formatCurrency(value)}</p>
            <div className="mt-2">
                <ProgressBar value={value} max={total} color={barColor} />
                <p className="text-[11px] text-slate-400 mt-1">{total > 0 ? `${((value / total) * 100).toFixed(1)}% do total` : "—"}</p>
            </div>
        </div>
    );
}

function AccordionSection({ title, count, total, children }: { title: string; count: number; total: string; children: React.ReactNode }) {
    if (count === 0) return null;
    return (
        <details className="group rounded-xl border border-slate-200 bg-white">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 list-none">
                <span className="flex items-center gap-2">
                    {title}
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{count} registro{count !== 1 ? "s" : ""}</span>
                </span>
                <span className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">{total}</span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 transition-transform group-open:rotate-180">expand_more</span>
                </span>
            </summary>
            <div className="px-5 pb-4 pt-2 border-t border-slate-100">
                {children}
            </div>
        </details>
    );
}

export function FinancialExecution({
    valorTotal, reservado, empenhado, liquidado, pago,
    empenhos = [], liquidacoes = [], pagamentos = []
}: FinancialExecutionProps) {
    const hasAnyEvent = empenhos.length > 0 || liquidacoes.length > 0 || pagamentos.length > 0;

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">account_balance_wallet</span>
                Execução Financeira
            </h2>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StageCard label="Reservado" value={reservado} total={valorTotal} color="border-blue-100 bg-blue-50/40" barColor="bg-blue-400" />
                <StageCard label="Empenhado" value={empenhado} total={valorTotal} color="border-yellow-100 bg-yellow-50/40" barColor="bg-yellow-400" />
                <StageCard label="Liquidado" value={liquidado} total={valorTotal} color="border-orange-100 bg-orange-50/40" barColor="bg-orange-400" />
                <StageCard label="Pago" value={pago} total={valorTotal} color="border-green-100 bg-green-50/40" barColor="bg-green-500" />
            </div>

            {/* Event history */}
            {!hasAnyEvent ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum evento financeiro registrado ainda.</p>
            ) : (
                <div className="space-y-2">
                    <AccordionSection title="Empenhos" count={empenhos.length} total={formatCurrency(empenhos.reduce((s, e) => s + parseCurrency(e.valor), 0))}>
                        <div className="space-y-2">
                            {empenhos.map((e) => (
                                <div key={e.id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                                        <span><span className="font-semibold">Nº:</span> {e.numero}</span>
                                        <span><span className="font-semibold">Data:</span> {e.data}</span>
                                        <span><span className="font-semibold">Valor:</span> {formatCurrency(parseCurrency(e.valor))}</span>
                                        <span><span className="font-semibold">Credor:</span> {e.credor}</span>
                                        {e.processo && <span><span className="font-semibold">Processo:</span> {e.processo}</span>}
                                    </div>
                                    {e.descricao && <p className="mt-1 text-slate-500 text-xs">{e.descricao}</p>}
                                </div>
                            ))}
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Liquidações" count={liquidacoes.length} total={formatCurrency(liquidacoes.reduce((s, e) => s + parseCurrency(e.valor), 0))}>
                        <div className="space-y-2">
                            {liquidacoes.map((e) => (
                                <div key={e.id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                                        <span><span className="font-semibold">Nº:</span> {e.numero}</span>
                                        <span><span className="font-semibold">Data:</span> {e.data}</span>
                                        <span><span className="font-semibold">Valor:</span> {formatCurrency(parseCurrency(e.valor))}</span>
                                    </div>
                                    {e.descricao && <p className="mt-1 text-slate-500 text-xs">{e.descricao}</p>}
                                </div>
                            ))}
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Pagamentos" count={pagamentos.length} total={formatCurrency(pagamentos.reduce((s, e) => s + parseCurrency(e.valor), 0))}>
                        <div className="space-y-2">
                            {pagamentos.map((e) => (
                                <div key={e.id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                                        <span><span className="font-semibold">Data:</span> {e.data}</span>
                                        <span><span className="font-semibold">Valor:</span> {formatCurrency(parseCurrency(e.valor))}</span>
                                        {e.banco && <span><span className="font-semibold">Banco:</span> {e.banco}</span>}
                                        {e.ordemBancaria && <span><span className="font-semibold">OB:</span> {e.ordemBancaria}</span>}
                                        {e.documento && <span><span className="font-semibold">Doc:</span> {e.documento}</span>}
                                    </div>
                                    {e.descricao && <p className="mt-1 text-slate-500 text-xs">{e.descricao}</p>}
                                </div>
                            ))}
                        </div>
                    </AccordionSection>
                </div>
            )}
        </section>
    );
}
```

**Step 2: Import and use FinancialExecution in the public details page**

In `app/projetos/[id]/page.tsx`:

1. Add import at the top:
```tsx
import { FinancialExecution } from "@/components/projects/financial-execution";
```

2. Find where `empenhado`, `liquidado`, `pago` variables are used in the JSX (the existing financial summary section). After that section (or replacing it if there's already a summary), add the `FinancialExecution` component:

```tsx
<FinancialExecution
    valorTotal={valorTotal}
    reservado={reservado}
    empenhado={empenhado}
    liquidado={liquidado}
    pago={pago}
    empenhos={(amendment as any).empenhos ?? []}
    liquidacoes={(amendment as any).liquidacoes ?? []}
    pagamentos={(amendment as any).pagamentos ?? []}
/>
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4: Manually verify in browser**

Navigate to `/projetos/<any-id>`.
Expected: "Execução Financeira" section visible with 4 summary cards and "Nenhum evento financeiro registrado ainda." message (since no events exist yet).

**Step 5: Commit**

```bash
git add components/projects/financial-execution.tsx app/projetos/[id]/page.tsx
git commit -m "feat: add public FinancialExecution section to project details page"
```

---

### Task 8: End-to-end smoke test

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Log in to admin and open an amendment for editing**

Navigate to `/admin/amendments/<id>/edit`, click "Financeiro" tab.

**Step 3: Add an empenho event**

Click "Adicionar" in the Empenhos tab, fill in:
- Número: `2026NE000001`
- Data: `15/03/2026`
- Valor: `50.000,00`
- Credor: `Empresa Teste Ltda`
- Processo: `001/2026`
- Descrição: `Teste de empenho`

Click "Salvar". Expected: event appears in table, summary card "Empenhado" updates to R$ 50.000,00.

**Step 4: Verify public page**

Navigate to `/projetos/<same-id>`.
Expected: "Execução Financeira" shows Empenhado = R$ 50.000,00 and Empenhos accordion with 1 registro.

**Step 5: Edit and delete the event**

Back in admin, edit the event (change valor to `60.000,00`), save. Verify total updates.
Then delete the event. Verify table empties and total resets.

**Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: smoke test fixes for financial events feature"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Expand FinancialRecord types | `lib/json-storage.ts` |
| 2 | Add event CRUD storage functions | `lib/json-storage.ts` |
| 3 | GET /api/financial/[amendmentId] | `app/api/financial/[amendmentId]/route.ts` |
| 4 | POST/PUT/DELETE /api/financial/events | `app/api/financial/events/route.ts` |
| 5 | FinancialHistory admin component | `components/admin/financial-history.tsx` |
| 6 | Integrate into admin edit page | `app/admin/amendments/[id]/edit/page.tsx` |
| 7 | Public FinancialExecution component + integration | `components/projects/financial-execution.tsx`, `app/projetos/[id]/page.tsx` |
| 8 | End-to-end smoke test | — |
