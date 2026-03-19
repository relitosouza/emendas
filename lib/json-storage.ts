import fs from "fs/promises";
import path from "path";
import { Amendment } from "@/lib/store";
import { parseCurrency } from "./amendments-utils";
import { getPool } from "./db";

// =====================================================
// Storage Strategy
// =====================================================
// Se DATABASE_URL estiver definida → PostgreSQL (produção)
// Caso contrário → arquivos JSON locais (desenvolvimento)

const HAS_PG = !!process.env.DATABASE_URL;
const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");

function bundledPath(filename: string) {
    return path.join(BUNDLED_DATA_DIR, filename);
}

export const AMENDMENTS_FILE = "amendments.json";
export const EXTERNAL_FILE = "emendas-externas.json";
export const FINANCIAL_FILE = "financial.json";
export const CARDS_FILE = "cards.json";

// =====================================================
// Helpers: roteamento entre PostgreSQL e JSON local
// =====================================================

// Mapeamento de nomes de arquivo para tabelas no PostgreSQL
const FILE_TO_TABLE: Record<string, string> = {
    "amendments.json": "amendments",
    "emendas-externas.json": "external_amendments",
    "financial.json": "financial_records",
    "cards.json": "dashboard_cards",
    "sync_info.json": "sync_info",
};

async function pgReadAll<T>(tableName: string): Promise<T[]> {
    const pool = getPool();
    try {
        if (tableName === "sync_info") {
            const result = await pool.query("SELECT last_sync FROM sync_info WHERE id = 1");
            if (result.rows.length === 0) return [];
            return [{ lastSync: result.rows[0].last_sync }] as T[];
        }
        if (tableName === "financial_records") {
            const result = await pool.query(
                "SELECT amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos, updated_at FROM financial_records ORDER BY updated_at DESC"
            );
            return result.rows.map((r) => ({
                amendmentId: r.amendment_id,
                empenhado: r.empenhado,
                liquidado: r.liquidado,
                pago: r.pago,
                reservado: r.reservado,
                empenhos: r.empenhos ?? [],
                liquidacoes: r.liquidacoes ?? [],
                pagamentos: r.pagamentos ?? [],
                updatedAt: r.updated_at,
            })) as T[];
        }
        if (tableName === "dashboard_cards") {
            const result = await pool.query(
                'SELECT id, "order", data FROM dashboard_cards ORDER BY "order" ASC'
            );
            return result.rows.map((r) => ({ id: r.id, order: r.order, ...r.data })) as T[];
        }
        // amendments / external_amendments
        const result = await pool.query(`SELECT id, data FROM ${tableName} ORDER BY updated_at DESC`);
        return result.rows.map((r) => ({ id: r.id, ...r.data })) as T[];
    } catch (err) {
        console.error(`[pg-storage] Erro ao ler tabela "${tableName}":`, err);
        throw err;
    }
}

async function pgWriteAll<T extends object>(tableName: string, data: T[]): Promise<void> {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        if (tableName === "sync_info") {
            const record = data[0] as Record<string, unknown>;
            await client.query(
                "INSERT INTO sync_info (id, last_sync, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET last_sync = $1, updated_at = NOW()",
                [record.lastSync]
            );
        } else if (tableName === "financial_records") {
            // Truncate and reinsert for batch writes (used by sync)
            await client.query("DELETE FROM financial_records");
            for (const item of data) {
                const r = item as FinancialRecord;
                await client.query(
                    `INSERT INTO financial_records
                        (amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                     ON CONFLICT (amendment_id) DO UPDATE SET
                        empenhado = $2, liquidado = $3, pago = $4, reservado = $5,
                        empenhos = $6, liquidacoes = $7, pagamentos = $8, updated_at = NOW()`,
                    [
                        r.amendmentId,
                        r.empenhado ?? "0",
                        r.liquidado ?? "0",
                        r.pago ?? "0",
                        r.reservado ?? "0",
                        JSON.stringify(r.empenhos ?? []),
                        JSON.stringify(r.liquidacoes ?? []),
                        JSON.stringify(r.pagamentos ?? []),
                    ]
                );
            }
        } else if (tableName === "dashboard_cards") {
            await client.query("DELETE FROM dashboard_cards");
            for (const item of data) {
                const { id, order, ...rest } = item as Record<string, unknown>;
                await client.query(
                    'INSERT INTO dashboard_cards (id, "order", data, updated_at) VALUES ($1, $2, $3, NOW())',
                    [id, order ?? 0, JSON.stringify(rest)]
                );
            }
        } else {
            // amendments / external_amendments — truncate and reinsert
            await client.query(`DELETE FROM ${tableName}`);
            for (const item of data) {
                const { id, ...rest } = item as Record<string, unknown>;
                await client.query(
                    `INSERT INTO ${tableName} (id, data, updated_at) VALUES ($1, $2, NOW())`,
                    [id, JSON.stringify(rest)]
                );
            }
        }

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[pg-storage] Erro ao escrever tabela "${tableName}":`, err);
        throw err;
    } finally {
        client.release();
    }
}

export async function readJsonFile<T>(filename: string): Promise<T[]> {
    if (HAS_PG) {
        const tableName = FILE_TO_TABLE[filename];
        if (tableName) return pgReadAll<T>(tableName);
    }
    // Dev local: lê do sistema de arquivos
    try {
        const content = await fs.readFile(bundledPath(filename), "utf-8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
    if (HAS_PG) {
        const tableName = FILE_TO_TABLE[filename];
        if (tableName) {
            await pgWriteAll(tableName, data as object[]);
            return;
        }
    }
    // Dev local: escreve no disco
    await fs.mkdir(BUNDLED_DATA_DIR, { recursive: true });
    await fs.writeFile(bundledPath(filename), JSON.stringify(data, null, 2), "utf-8");
}

// =====================================================
// Financial Data
// =====================================================

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

export interface FinancialRecord {
    amendmentId: string;
    empenhado: string;
    liquidado: string;
    pago: string;
    reservado: string;
    updatedAt: string;
    empenhos?: EmpenhoEvent[];
    liquidacoes?: LiquidacaoEvent[];
    pagamentos?: PagamentoEvent[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertFinancialData(_sheets: any, _spreadsheetId: string, amendmentId: string, data: any): Promise<void> {
    if (HAS_PG) {
        const pool = getPool();
        const existing = await pool.query(
            "SELECT amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos FROM financial_records WHERE amendment_id = $1",
            [amendmentId]
        );
        const cur = existing.rows[0];
        await pool.query(
            `INSERT INTO financial_records
                (amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (amendment_id) DO UPDATE SET
                empenhado = $2, liquidado = $3, pago = $4, reservado = $5, updated_at = NOW()`,
            [
                amendmentId,
                data.empenhado !== undefined ? String(data.empenhado) : (cur?.empenhado ?? ""),
                data.liquidado !== undefined ? String(data.liquidado) : (cur?.liquidado ?? ""),
                data.pago !== undefined ? String(data.pago) : (cur?.pago ?? ""),
                data.reservado !== undefined ? String(data.reservado) : (cur?.reservado ?? ""),
                JSON.stringify(cur?.empenhos ?? []),
                JSON.stringify(cur?.liquidacoes ?? []),
                JSON.stringify(cur?.pagamentos ?? []),
            ]
        );
        return;
    }

    const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    const recordMap = new Map<string, FinancialRecord>();
    for (const r of rawRecords) {
        if (r.amendmentId) recordMap.set(r.amendmentId, r);
    }
    const currentRecord = recordMap.get(amendmentId);
    const record: FinancialRecord = {
        amendmentId,
        empenhado: data.empenhado !== undefined ? String(data.empenhado) : (currentRecord?.empenhado || ""),
        liquidado: data.liquidado !== undefined ? String(data.liquidado) : (currentRecord?.liquidado || ""),
        pago: data.pago !== undefined ? String(data.pago) : (currentRecord?.pago || ""),
        reservado: data.reservado !== undefined ? String(data.reservado) : (currentRecord?.reservado || ""),
        updatedAt: new Date().toISOString(),
        empenhos: currentRecord?.empenhos,
        liquidacoes: currentRecord?.liquidacoes,
        pagamentos: currentRecord?.pagamentos,
    };
    recordMap.set(amendmentId, record);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
}

function sumEvents(events: Array<{ valor: string }> = []): string {
    const total = events.reduce((acc, e) => acc + parseCurrency(e.valor), 0);
    if (total === 0) return "0,00";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total);
}

export type FinancialEventType = "empenho" | "liquidacao" | "pagamento";

export async function addFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData: any
): Promise<FinancialRecord> {
    if (HAS_PG) {
        const pool = getPool();
        const result = await pool.query(
            "SELECT amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos FROM financial_records WHERE amendment_id = $1",
            [amendmentId]
        );
        const cur = result.rows[0] ?? {
            amendment_id: amendmentId,
            empenhado: "0", liquidado: "0", pago: "0", reservado: "0",
            empenhos: [], liquidacoes: [], pagamentos: [],
        };
        const newEvent = { ...eventData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const empenhos: EmpenhoEvent[] = tipo === "empenho" ? [...(cur.empenhos ?? []), newEvent] : (cur.empenhos ?? []);
        const liquidacoes: LiquidacaoEvent[] = tipo === "liquidacao" ? [...(cur.liquidacoes ?? []), newEvent] : (cur.liquidacoes ?? []);
        const pagamentos: PagamentoEvent[] = tipo === "pagamento" ? [...(cur.pagamentos ?? []), newEvent] : (cur.pagamentos ?? []);

        const empenhado = empenhos.length > 0 ? sumEvents(empenhos) : cur.empenhado;
        const liquidado = liquidacoes.length > 0 ? sumEvents(liquidacoes) : cur.liquidado;
        const pago = pagamentos.length > 0 ? sumEvents(pagamentos) : cur.pago;

        await pool.query(
            `INSERT INTO financial_records
                (amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (amendment_id) DO UPDATE SET
                empenhado = $2, liquidado = $3, pago = $4,
                empenhos = $6, liquidacoes = $7, pagamentos = $8, updated_at = NOW()`,
            [amendmentId, empenhado, liquidado, pago, cur.reservado, JSON.stringify(empenhos), JSON.stringify(liquidacoes), JSON.stringify(pagamentos)]
        );
        return { amendmentId, empenhado, liquidado, pago, reservado: cur.reservado, updatedAt: new Date().toISOString(), empenhos, liquidacoes, pagamentos };
    }

    const rawRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    const recordMap = new Map<string, FinancialRecord>();
    for (const r of rawRecords) {
        if (r.amendmentId) recordMap.set(r.amendmentId, r);
    }
    const current = recordMap.get(amendmentId) ?? {
        amendmentId, empenhado: "0", liquidado: "0", pago: "0", reservado: "0", updatedAt: new Date().toISOString(),
    };
    const newEvent = { ...eventData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated: FinancialRecord = {
        ...current,
        empenhos: tipo === "empenho" ? [...(current.empenhos ?? []), newEvent] : (current.empenhos ?? []),
        liquidacoes: tipo === "liquidacao" ? [...(current.liquidacoes ?? []), newEvent] : (current.liquidacoes ?? []),
        pagamentos: tipo === "pagamento" ? [...(current.pagamentos ?? []), newEvent] : (current.pagamentos ?? []),
        updatedAt: new Date().toISOString(),
    };
    updated.empenhado = (updated.empenhos ?? []).length > 0 ? sumEvents(updated.empenhos) : current.empenhado;
    updated.liquidado = (updated.liquidacoes ?? []).length > 0 ? sumEvents(updated.liquidacoes) : current.liquidado;
    updated.pago = (updated.pagamentos ?? []).length > 0 ? sumEvents(updated.pagamentos) : current.pago;
    recordMap.set(amendmentId, updated);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
    return updated;
}

export async function updateFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    eventId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventData: any
): Promise<FinancialRecord> {
    if (HAS_PG) {
        const pool = getPool();
        const result = await pool.query(
            "SELECT amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos FROM financial_records WHERE amendment_id = $1",
            [amendmentId]
        );
        const cur = result.rows[0];
        if (!cur) throw new Error(`FinancialRecord not found for amendmentId: ${amendmentId}`);

        const replaceById = (arr: Array<{ id: string }> = []) =>
            arr.map((e) => (e.id === eventId ? { ...e, ...eventData, id: eventId } : e));

        const empenhos = tipo === "empenho" ? replaceById(cur.empenhos) as EmpenhoEvent[] : (cur.empenhos ?? []);
        const liquidacoes = tipo === "liquidacao" ? replaceById(cur.liquidacoes) as LiquidacaoEvent[] : (cur.liquidacoes ?? []);
        const pagamentos = tipo === "pagamento" ? replaceById(cur.pagamentos) as PagamentoEvent[] : (cur.pagamentos ?? []);

        const empenhado = empenhos.length > 0 ? sumEvents(empenhos) : cur.empenhado;
        const liquidado = liquidacoes.length > 0 ? sumEvents(liquidacoes) : cur.liquidado;
        const pago = pagamentos.length > 0 ? sumEvents(pagamentos) : cur.pago;

        await pool.query(
            `UPDATE financial_records SET
                empenhado = $2, liquidado = $3, pago = $4,
                empenhos = $5, liquidacoes = $6, pagamentos = $7, updated_at = NOW()
             WHERE amendment_id = $1`,
            [amendmentId, empenhado, liquidado, pago, JSON.stringify(empenhos), JSON.stringify(liquidacoes), JSON.stringify(pagamentos)]
        );
        return { amendmentId, empenhado, liquidado, pago, reservado: cur.reservado, updatedAt: new Date().toISOString(), empenhos, liquidacoes, pagamentos };
    }

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
    updated.empenhado = (updated.empenhos ?? []).length > 0 ? sumEvents(updated.empenhos) : current.empenhado;
    updated.liquidado = (updated.liquidacoes ?? []).length > 0 ? sumEvents(updated.liquidacoes) : current.liquidado;
    updated.pago = (updated.pagamentos ?? []).length > 0 ? sumEvents(updated.pagamentos) : current.pago;
    recordMap.set(amendmentId, updated);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
    return updated;
}

export async function deleteFinancialEvent(
    amendmentId: string,
    tipo: FinancialEventType,
    eventId: string
): Promise<FinancialRecord> {
    if (HAS_PG) {
        const pool = getPool();
        const result = await pool.query(
            "SELECT amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos FROM financial_records WHERE amendment_id = $1",
            [amendmentId]
        );
        const cur = result.rows[0];
        if (!cur) throw new Error(`FinancialRecord not found for amendmentId: ${amendmentId}`);

        const removeById = (arr: Array<{ id: string }> = []) => arr.filter((e) => e.id !== eventId);
        const empenhos = tipo === "empenho" ? removeById(cur.empenhos) as EmpenhoEvent[] : (cur.empenhos ?? []);
        const liquidacoes = tipo === "liquidacao" ? removeById(cur.liquidacoes) as LiquidacaoEvent[] : (cur.liquidacoes ?? []);
        const pagamentos = tipo === "pagamento" ? removeById(cur.pagamentos) as PagamentoEvent[] : (cur.pagamentos ?? []);

        const empenhado = empenhos.length > 0 ? sumEvents(empenhos) : cur.empenhado;
        const liquidado = liquidacoes.length > 0 ? sumEvents(liquidacoes) : cur.liquidado;
        const pago = pagamentos.length > 0 ? sumEvents(pagamentos) : cur.pago;

        await pool.query(
            `UPDATE financial_records SET
                empenhado = $2, liquidado = $3, pago = $4,
                empenhos = $5, liquidacoes = $6, pagamentos = $7, updated_at = NOW()
             WHERE amendment_id = $1`,
            [amendmentId, empenhado, liquidado, pago, JSON.stringify(empenhos), JSON.stringify(liquidacoes), JSON.stringify(pagamentos)]
        );
        return { amendmentId, empenhado, liquidado, pago, reservado: cur.reservado, updatedAt: new Date().toISOString(), empenhos, liquidacoes, pagamentos };
    }

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
    updated.empenhado = (updated.empenhos ?? []).length > 0 ? sumEvents(updated.empenhos) : current.empenhado;
    updated.liquidado = (updated.liquidacoes ?? []).length > 0 ? sumEvents(updated.liquidacoes) : current.liquidado;
    updated.pago = (updated.pagamentos ?? []).length > 0 ? sumEvents(updated.pagamentos) : current.pago;
    recordMap.set(amendmentId, updated);
    await writeJsonFile(FINANCIAL_FILE, Array.from(recordMap.values()));
    return updated;
}

export async function getFinancialRecord(amendmentId: string): Promise<FinancialRecord | null> {
    if (HAS_PG) {
        const pool = getPool();
        const result = await pool.query(
            "SELECT amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos, updated_at FROM financial_records WHERE amendment_id = $1",
            [amendmentId]
        );
        if (result.rows.length === 0) return null;
        const r = result.rows[0];
        return {
            amendmentId: r.amendment_id,
            empenhado: r.empenhado,
            liquidado: r.liquidado,
            pago: r.pago,
            reservado: r.reservado,
            empenhos: r.empenhos ?? [],
            liquidacoes: r.liquidacoes ?? [],
            pagamentos: r.pagamentos ?? [],
            updatedAt: r.updated_at,
        };
    }
    const records = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    return records.find((r) => r.amendmentId === amendmentId) ?? null;
}

// =====================================================
// Amendment CRUD
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function appendAmendmentToSheet(amendment: any): Promise<any> {
    if (HAS_PG) {
        const pool = getPool();
        const { id, ...rest } = amendment;
        await pool.query(
            "INSERT INTO amendments (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()",
            [id, JSON.stringify(rest)]
        );
        if (amendment.reservado || amendment.empenhado || amendment.liquidado || amendment.pago) {
            await upsertFinancialData(null, "", amendment.id, amendment);
        }
        return { success: true };
    }

    const amendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    amendments.push(amendment);
    await writeJsonFile(AMENDMENTS_FILE, amendments);
    if (amendment.reservado || amendment.empenhado || amendment.liquidado || amendment.pago) {
        await upsertFinancialData(null, "", amendment.id, amendment);
    }
    return { success: true };
}

export async function deleteAmendmentFromSheet(id: string): Promise<boolean> {
    if (HAS_PG) {
        const pool = getPool();
        const res1 = await pool.query("DELETE FROM amendments WHERE id = $1 RETURNING id", [id]);
        const res2 = await pool.query("DELETE FROM external_amendments WHERE id = $1 RETURNING id", [id]);
        await pool.query("DELETE FROM financial_records WHERE amendment_id = $1", [id]);
        if (res1.rowCount === 0 && res2.rowCount === 0) throw new Error("Amendment not found");
        return true;
    }

    let deletedAny = false;
    const amendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    const filteredAmendments = amendments.filter((a) => a.id !== id);
    if (filteredAmendments.length < amendments.length) {
        deletedAny = true;
        await writeJsonFile(AMENDMENTS_FILE, filteredAmendments);
    }
    const external = await readJsonFile<Amendment>(EXTERNAL_FILE);
    const filteredExternal = external.filter((a) => a.id !== id);
    if (filteredExternal.length < external.length) {
        deletedAny = true;
        await writeJsonFile(EXTERNAL_FILE, filteredExternal);
    }
    const financial = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);
    const filteredFinancial = financial.filter((r) => r.amendmentId !== id);
    if (filteredFinancial.length < financial.length) {
        await writeJsonFile(FINANCIAL_FILE, filteredFinancial);
    }
    if (!deletedAny) throw new Error("Amendment not found");
    return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateAmendmentInSheet(id: string, amendment: any): Promise<boolean> {
    if (HAS_PG) {
        const pool = getPool();
        const { id: _id, ...rest } = amendment;
        const result = await pool.query(
            "UPDATE amendments SET data = data || $2, updated_at = NOW() WHERE id = $1 RETURNING id",
            [id, JSON.stringify(rest)]
        );
        if (result.rowCount === 0) {
            await appendAmendmentToSheet(amendment);
            return true;
        }
        if (amendment.reservado !== undefined || amendment.empenhado !== undefined || amendment.liquidado !== undefined || amendment.pago !== undefined) {
            await upsertFinancialData(null, "", id, amendment);
        }
        return true;
    }

    const amendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    const index = amendments.findIndex((a) => a.id === id);
    if (index === -1) {
        await appendAmendmentToSheet(amendment);
        return true;
    }
    amendments[index] = { ...amendments[index], ...amendment, id };
    await writeJsonFile(AMENDMENTS_FILE, amendments);
    if (amendment.reservado !== undefined || amendment.empenhado !== undefined || amendment.liquidado !== undefined || amendment.pago !== undefined) {
        await upsertFinancialData(null, "", id, amendment);
    }
    return true;
}

export async function getAmendmentsFromSheet(): Promise<Amendment[]> {
    if (HAS_PG) {
        const pool = getPool();
        const [mainRes, extRes, finRes] = await Promise.all([
            pool.query("SELECT id, data FROM amendments ORDER BY updated_at DESC"),
            pool.query("SELECT id, data FROM external_amendments ORDER BY updated_at DESC"),
            pool.query("SELECT amendment_id, empenhado, liquidado, pago, reservado, empenhos, liquidacoes, pagamentos FROM financial_records"),
        ]);

        const financialMap = new Map<string, FinancialRecord>();
        for (const r of finRes.rows) {
            financialMap.set(r.amendment_id, {
                amendmentId: r.amendment_id,
                empenhado: r.empenhado,
                liquidado: r.liquidado,
                pago: r.pago,
                reservado: r.reservado,
                empenhos: r.empenhos ?? [],
                liquidacoes: r.liquidacoes ?? [],
                pagamentos: r.pagamentos ?? [],
                updatedAt: "",
            });
        }

        const mergeFinancial = (row: { id: string; data: Record<string, unknown> }): Amendment => {
            const base = { id: row.id, ...row.data } as Amendment;
            const fin = financialMap.get(row.id);
            if (!fin) return base;
            return {
                ...base,
                empenhado: fin.empenhado,
                liquidado: fin.liquidado,
                pago: fin.pago,
                reservado: fin.reservado,
                empenhos: fin.empenhos ?? [],
                liquidacoes: fin.liquidacoes ?? [],
                pagamentos: fin.pagamentos ?? [],
            };
        };

        const resultMap = new Map<string, Amendment>();
        for (const row of extRes.rows) resultMap.set(row.id, mergeFinancial(row));
        for (const row of mainRes.rows) resultMap.set(row.id, mergeFinancial(row));
        return Array.from(resultMap.values());
    }

    const mainAmendments = await readJsonFile<Amendment>(AMENDMENTS_FILE);
    const externalAmendments = await readJsonFile<Amendment>(EXTERNAL_FILE);
    const financialRecords = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

    const mergeFinancial = (amendment: Amendment): Amendment => {
        const financial = financialRecords.find((r) => r.amendmentId === amendment.id);
        if (financial) {
            return {
                ...amendment,
                empenhado: financial.empenhado !== undefined ? financial.empenhado : amendment.empenhado,
                liquidado: financial.liquidado !== undefined ? financial.liquidado : amendment.liquidado,
                pago: financial.pago !== undefined ? financial.pago : amendment.pago,
                reservado: financial.reservado !== undefined ? financial.reservado : amendment.reservado,
                empenhos: financial.empenhos ?? [],
                liquidacoes: financial.liquidacoes ?? [],
                pagamentos: financial.pagamentos ?? [],
            };
        }
        return amendment;
    };

    const resultMap = new Map<string, Amendment>();
    for (const a of externalAmendments) {
        if (a.id) resultMap.set(a.id, mergeFinancial(a));
    }
    for (const a of mainAmendments) {
        if (a.id) resultMap.set(a.id, mergeFinancial(a));
    }
    return Array.from(resultMap.values());
}

// =====================================================
// Dashboard Cards
// =====================================================

export interface DashboardCard {
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

export async function getDashboardCards(): Promise<DashboardCard[]> {
    if (HAS_PG) {
        const pool = getPool();
        const result = await pool.query('SELECT id, "order", data FROM dashboard_cards ORDER BY "order" ASC');
        return result.rows.map((r) => ({ id: r.id, order: r.order, ...r.data })) as DashboardCard[];
    }
    const cards = await readJsonFile<DashboardCard>(CARDS_FILE);
    return cards.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveDashboardCards(cards: DashboardCard[]): Promise<void> {
    if (HAS_PG) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query("DELETE FROM dashboard_cards");
            for (const [idx, card] of cards.entries()) {
                const { id, order, ...rest } = card;
                await client.query(
                    'INSERT INTO dashboard_cards (id, "order", data, updated_at) VALUES ($1, $2, $3, NOW())',
                    [id, order ?? idx, JSON.stringify(rest)]
                );
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
        return;
    }
    const cardsWithOrder = cards.map((card, idx) => ({ ...card, order: card.order ?? idx }));
    await writeJsonFile(CARDS_FILE, cardsWithOrder);
}

// =====================================================
// Compatibility
// =====================================================

export async function getAuthClient(): Promise<null> {
    return null;
}
