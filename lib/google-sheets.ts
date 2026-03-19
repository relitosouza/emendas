import { google } from "googleapis";
import { Amendment } from "@/lib/store";

// Environment variables should be set in .env.local
// GOOGLE_SERVICE_ACCOUNT_EMAIL
// GOOGLE_PRIVATE_KEY
// GOOGLE_SHEET_ID

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

export async function getAuthClient() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let key = process.env.GOOGLE_PRIVATE_KEY;

    if (!email || !key) {
        throw new Error("Missing Google Service Account credentials");
    }

    // Vercel/Env var handling for Private Key
    // 1. Remove wrapping double quotes if present
    if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1);
    }

    // 2. Handle escaped newlines (common in Vercel)
    key = key.replace(/\\n/g, "\n");

    // 3. Ensure proper PEM formatting
    if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
        key = "-----BEGIN PRIVATE KEY-----\n" + key;
    }
    if (!key.includes("-----END PRIVATE KEY-----")) {
        key = key + "\n-----END PRIVATE KEY-----";
    }

    if (key.length < 100) {
        console.error("GOOGLE_PRIVATE_KEY is too short or invalid.");
        throw new Error("GOOGLE_PRIVATE_KEY appears to be invalid.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: key,
        },
        scopes: SCOPES,
    });

    return auth;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFirstSheetName(sheets: any, spreadsheetId: string): Promise<string> {
    try {
        const meta = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: "sheets.properties.title",
        });
        return meta.data.sheets?.[0]?.properties?.title || "Sheet1";
    } catch (error) {
        console.warn("Retrying sheet name fetch...", error);
        return "Página1";
    }
}

// Map amendment object to a row array
// Order MUST match getAmendmentsFromSheet mapping (excluding financial fields)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAmendmentToRow(amendment: any): any[] {
    return [
        amendment.id,
        amendment.createdAt || new Date().toISOString(),
        amendment.municipio,
        amendment.cnpj,
        amendment.responsavelNome,
        amendment.responsavelCargo,
        amendment.loa2026Check,
        amendment.ambito,
        amendment.tipoEmenda,
        amendment.tipoEmendaOutro,
        amendment.fundamentoLegal,
        amendment.autor,
        amendment.numeroEmenda,
        amendment.objeto,
        amendment.finalidade,
        amendment.funcao,
        amendment.destinacao,
        amendment.orgaoBeneficiario,
        amendment.localidadeBeneficiada,
        amendment.instrumentoJuridico,
        amendment.possuiCronograma,
        amendment.prazoAplicacao,
        amendment.valor,
        amendment.valorAutorizado,
        amendment.percentualRcl,
        amendment.contaEspecifica,
        amendment.numeroConta,
        amendment.portalTransparenciaCheck,
        amendment.divulgacaoTempoReal,
        amendment.linkPortal,
        amendment.monitoramentoCheck,
        amendment.status,
        amendment.priority,
        amendment.latitude?.toString(),
        amendment.longitude?.toString(),
        amendment.categoria, // 35
        amendment.fornecedor, // 36
        amendment.numeroLicitacao, // 37
        amendment.codigoAplicacao, // 38
        amendment.codigoAplicacaoVariavel, // 39
        amendment.subfuncao, // 40
    ];
}

function getFinancialSheetName(): string {
    return "ExecucaoFinanceira";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertFinancialData(sheets: any, spreadsheetId: string, amendmentId: string, data: any) {
    const sheetName = getFinancialSheetName();

    // 1. Try to find existing row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows: any[] = [];
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:A`,
        });
        rows = response.data.values || [];
    } catch {
        // Sheet might not exist or be empty, ignore
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowIndex = rows.findIndex((row: any) => row[0] === amendmentId);

    const rowData = [
        amendmentId,
        data.empenhado || "",
        data.liquidado || "",
        data.pago || "",
        data.reservado || "",
        new Date().toISOString()
    ];

    if (rowIndex >= 0) {
        // Update
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A${rowIndex + 1}:F${rowIndex + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [rowData] },
        });
    } else {
        // Append
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:F`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [rowData] },
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function appendAmendmentToSheet(amendment: any) {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Missing GOOGLE_SHEET_ID");
    }

    const sheetName = await getFirstSheetName(sheets, spreadsheetId);
    const row = mapAmendmentToRow(amendment);

    const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:AO`, // Expanded range to AO (approx 40 cols)
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [row],
        },
    });

    // If financial data is present on creation (unlikely but possible), save it
    if (amendment.reservado || amendment.empenhado || amendment.liquidado || amendment.pago) {
        await upsertFinancialData(sheets, spreadsheetId, amendment.id, amendment);
    }

    return response.data;
}

export async function deleteAmendmentFromSheet(id: string) {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetList = meta.data.sheets || [];

    let deletedAny = false;

    // Helper to delete from a specific sheet
    const deleteFromSheetName = async (sheetTitle: string) => {
        try {
            const getRes = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetTitle}!A:A`,
            });
            const rows = getRes.data.values;
            if (!rows) return;
            const rowIndex = rows.findIndex((row: any) => row[0] === id);
            if (rowIndex === -1) return;

            const sheetInfo = sheetList.find((s: any) => s.properties?.title === sheetTitle);
            const sheetId = sheetInfo?.properties?.sheetId;
            if (sheetId === undefined) return;

            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            deleteDimension: {
                                range: {
                                    sheetId: sheetId,
                                    dimension: "ROWS",
                                    startIndex: rowIndex,
                                    endIndex: rowIndex + 1,
                                },
                            },
                        },
                    ],
                },
            });
            deletedAny = true;
        } catch (e) {
            console.error(`Error deleting from ${sheetTitle}:`, e);
        }
    };

    const firstSheetTitle = sheetList[0]?.properties?.title || "Página1";
    await deleteFromSheetName(firstSheetTitle);
    await deleteFromSheetName("Emendas");
    await deleteFromSheetName(getFinancialSheetName());

    if (!deletedAny) {
        throw new Error("Amendment not found");
    }

    return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateAmendmentInSheet(id: string, amendment: any) {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) throw new Error("Missing GOOGLE_SHEET_ID");

    const sheetName = await getFirstSheetName(sheets, spreadsheetId);

    // 1. Find the row index
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`,
    });

    const rows = response.data.values;
    if (!rows) throw new Error("No data found");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowIndex = rows.findIndex((row: any) => row[0] === id);

    if (rowIndex === -1) {
        console.log(`Amendment ${id} not found in main sheet, appending as new row`);
        await appendAmendmentToSheet(amendment);
        return true;
    }

    // 2. Update the row (Main Sheet)
    const row = mapAmendmentToRow(amendment);

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowIndex + 1}:AO${rowIndex + 1}`, // Expanded range
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [row],
        },
    });

    // 3. Update/Insert Financial Data (Secondary Sheet)
    if (amendment.reservado !== undefined || amendment.empenhado !== undefined || amendment.liquidado !== undefined || amendment.pago !== undefined) {
        await upsertFinancialData(sheets, spreadsheetId, id, amendment);
    }

    return true;
}

export async function getAmendmentsFromSheet(): Promise<Amendment[]> {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
        throw new Error("Missing GOOGLE_SHEET_ID");
    }

    const sheetName = await getFirstSheetName(sheets, spreadsheetId);
    const financialSheetName = getFinancialSheetName();

    // Fetch Main Data
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:AO`, // Expanded range
    });

    // Fetch Emendas (Vereador) Data
    let emendasRows: any[] = [];
    try {
        const emendasResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `Emendas!A:W`, // Up to 23 cols to be safe
        });
        emendasRows = emendasResponse.data.values || [];
    } catch (e) {
        console.warn("Could not fetch Emendas sheet, assuming empty.", e);
    }

    // Fetch Financial Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let financialRows: any[] = [];
    try {
        const finResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${financialSheetName}!A:F`,
        });
        financialRows = finResponse.data.values || [];
    } catch (e) {
        console.warn("Could not fetch financial sheet, assuming empty.", e);
    }

    const rows = response.data.values || [];
    const dataRows = rows.length > 0 ? rows.slice(1) : []; // Skip header
    const emendasDataRows = emendasRows.length > 0 ? emendasRows.slice(1) : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mainAmendments: Amendment[] = dataRows.map((row: any[]) => {
        const id = row[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const financial = financialRows.find((r: any) => r[0] === id);

        return {
            id: row[0],
            createdAt: row[1],
            municipio: row[2],
            cnpj: row[3],
            responsavelNome: row[4],
            responsavelCargo: row[5],
            loa2026Check: row[6],
            ambito: row[7],
            tipoEmenda: row[8],
            tipoEmendaOutro: row[9],
            fundamentoLegal: row[10],
            autor: row[11],
            numeroEmenda: row[12],
            objeto: row[13],
            finalidade: row[14],
            funcao: row[15],
            destinacao: row[16],
            orgaoBeneficiario: row[17],
            localidadeBeneficiada: row[18],
            instrumentoJuridico: row[19],
            possuiCronograma: row[20],
            prazoAplicacao: row[21],
            valor: row[22],
            valorAutorizado: row[23],
            percentualRcl: row[24],
            contaEspecifica: row[25],
            numeroConta: row[26],
            portalTransparenciaCheck: row[27],
            divulgacaoTempoReal: row[28],
            linkPortal: row[29],
            monitoramentoCheck: row[30],
            status: row[31],
            priority: row[32],
            latitude: row[33] ? parseFloat(row[33]) : undefined,
            longitude: row[34] ? parseFloat(row[34]) : undefined,
            categoria: row[35],
            fornecedor: row[36],
            numeroLicitacao: row[37],
            codigoAplicacao: row[38],
            codigoAplicacaoVariavel: row[39],
            subfuncao: row[40],

            // Financial Data (Merged)
            empenhado: financial ? financial[1] : undefined,
            liquidado: financial ? financial[2] : undefined,
            pago: financial ? financial[3] : undefined,
            reservado: financial ? financial[4] : undefined,

            // Mapped for compatibility
            title: row[13], // Objeto
            address: row[18], // Localidade
            year: "2026",
        };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const externalAmendments: Amendment[] = emendasDataRows.map((row: any[]) => {
        const id = row[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const financial = financialRows.find((r: any) => r[0] === id);

        return {
            id: row[0] || crypto.randomUUID(),
            createdAt: row[16] || new Date().toISOString(),
            municipio: "",
            cnpj: "",
            responsavelNome: "",
            responsavelCargo: "",
            loa2026Check: "",
            ambito: row[2] || "",
            tipoEmenda: row[3] || "",
            tipoEmendaOutro: "",
            fundamentoLegal: row[4] || "",
            autor: row[5] || "",
            numeroEmenda: row[6] || "",
            objeto: row[7] || "",
            finalidade: row[8] || "",
            funcao: "",
            destinacao: row[9] || "",
            orgaoBeneficiario: "",
            localidadeBeneficiada: row[10] || "",
            instrumentoJuridico: row[11] || "",
            possuiCronograma: "",
            prazoAplicacao: "",
            valor: row[12] || "",
            valorAutorizado: row[13] || "",
            percentualRcl: "",
            contaEspecifica: "",
            numeroConta: "",
            portalTransparenciaCheck: "",
            divulgacaoTempoReal: "",
            linkPortal: "",
            monitoramentoCheck: "",
            status: "pendente",
            priority: "normal",
            latitude: undefined,
            longitude: undefined,
            categoria: row[14] || "",
            fornecedor: "",
            numeroLicitacao: "",
            codigoAplicacao: "",
            codigoAplicacaoVariavel: "",
            subfuncao: "",

            // Financial Data (Merged)
            empenhado: financial ? financial[1] : undefined,
            liquidado: financial ? financial[2] : undefined,
            pago: financial ? financial[3] : undefined,
            reservado: financial ? financial[4] : undefined,

            // Mapped for compatibility
            title: row[7] || "", // Objeto
            address: row[10] || "", // Localidade
            year: "2026",
        };
    });

    // Merge external and main
    const resultMap = new Map<string, Amendment>();

    // Add external first
    externalAmendments.forEach(a => {
        if (a.id) resultMap.set(a.id, a);
    });

    // Add main (will overwrite external if ID matches)
    mainAmendments.forEach(a => {
        if (a.id) resultMap.set(a.id, a);
    });

    return Array.from(resultMap.values());
}

// =====================================================
// Dashboard Cards (Stats) Management
// =====================================================

const CARDS_SHEET_NAME = "Cards";

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

async function ensureCardsSheet(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
    try {
        const meta = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: "sheets.properties.title",
        });
        const names = meta.data.sheets?.map((s) => s.properties?.title) || [];
        if (!names.includes(CARDS_SHEET_NAME)) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: { title: CARDS_SHEET_NAME },
                            },
                        },
                    ],
                },
            });
            // Add headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${CARDS_SHEET_NAME}!A1:I1`,
                valueInputOption: "RAW",
                requestBody: {
                    values: [["id", "label", "value", "trend", "icon", "color", "description", "total", "order"]],
                },
            });
        }
    } catch (error) {
        console.warn("Error ensuring Cards sheet:", error);
    }
}

export async function getDashboardCards(): Promise<DashboardCard[]> {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

    await ensureCardsSheet(sheets, spreadsheetId);

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${CARDS_SHEET_NAME}!A2:I100`,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
        id: row[0] || "",
        label: row[1] || "",
        value: row[2] || "",
        trend: row[3] || undefined,
        icon: row[4] || "info",
        color: row[5] || "blue",
        description: row[6] || undefined,
        total: row[7] || undefined,
        order: parseInt(row[8] || "0", 10),
    })).sort((a, b) => a.order - b.order);
}

export async function saveDashboardCards(cards: DashboardCard[]) {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

    await ensureCardsSheet(sheets, spreadsheetId);

    // Clear existing data (keep headers)
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${CARDS_SHEET_NAME}!A2:I100`,
    });

    if (cards.length === 0) return;

    const rows = cards.map((card, idx) => [
        card.id,
        card.label,
        card.value,
        card.trend || "",
        card.icon,
        card.color,
        card.description || "",
        card.total || "",
        (card.order ?? idx).toString(),
    ]);

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${CARDS_SHEET_NAME}!A2:I${rows.length + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
    });
}

