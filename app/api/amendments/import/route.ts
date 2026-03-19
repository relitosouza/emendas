import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { readJsonFile, writeJsonFile, AMENDMENTS_FILE, FINANCIAL_FILE } from "@/lib/json-storage";
import crypto from "crypto";

// =====================================================
// CSV Parser
// =====================================================

function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const next = content[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === "," || char === ";") {
                row.push(current.trim());
                current = "";
            } else if (char === "\n" || (char === "\r" && next === "\n")) {
                row.push(current.trim());
                current = "";
                if (row.some((cell) => cell !== "")) {
                    rows.push(row);
                }
                row = [];
                if (char === "\r") i++;
            } else {
                current += char;
            }
        }
    }

    if (current || row.length > 0) {
        row.push(current.trim());
        if (row.some((cell) => cell !== "")) {
            rows.push(row);
        }
    }

    return rows;
}

// =====================================================
// Column Mapping (from csv-to-json.ts)
// =====================================================

const MAIN_COLUMNS = [
    "id", "createdAt", "municipio", "cnpj", "responsavelNome",
    "responsavelCargo", "loa2026Check", "ambito", "tipoEmenda",
    "tipoEmendaOutro", "fundamentoLegal", "autor", "numeroEmenda",
    "objeto", "finalidade", "funcao", "destinacao", "orgaoBeneficiario",
    "localidadeBeneficiada", "instrumentoJuridico", "possuiCronograma",
    "prazoAplicacao", "valor", "valorAutorizado", "percentualRcl",
    "contaEspecifica", "numeroConta", "portalTransparenciaCheck",
    "divulgacaoTempoReal", "linkPortal", "monitoramentoCheck", "status",
    "priority", "latitude", "longitude", "categoria", "fornecedor",
    "numeroLicitacao", "codigoAplicacao", "codigoAplicacaoVariavel", "subfuncao",
];

function detectFormat(headers: string[]): "indexed" | "named" {
    if (headers.length === MAIN_COLUMNS.length) return "indexed";
    const knownHeaders = ["id", "objeto", "autor", "valor", "status", "municipio", "ambito"];
    const normalized = headers.map((h) => h.toLowerCase().trim().replace(/\s+/g, ""));
    const matches = knownHeaders.filter((k) => normalized.some((h) => h.includes(k)));
    return matches.length >= 2 ? "named" : "indexed";
}

function normalizeHeaderName(header: string): string {
    const map: Record<string, string> = {
        "id": "id", "criadoem": "createdAt", "createdat": "createdAt",
        "datacriacao": "createdAt", "municipio": "municipio", "município": "municipio",
        "cnpj": "cnpj", "responsavel": "responsavelNome", "responsavelnome": "responsavelNome",
        "nomeresponsavel": "responsavelNome", "cargo": "responsavelCargo",
        "responsavelcargo": "responsavelCargo", "loa2026": "loa2026Check",
        "loa2026check": "loa2026Check", "ambito": "ambito", "âmbito": "ambito",
        "tipoemenda": "tipoEmenda", "tipodeemenda": "tipoEmenda", "tipo": "tipoEmenda",
        "tipoemendaoutro": "tipoEmendaOutro", "fundamentolegal": "fundamentoLegal",
        "fundamento": "fundamentoLegal", "autor": "autor", "parlamentar": "autor",
        "numeroemenda": "numeroEmenda", "numero": "numeroEmenda", "número": "numeroEmenda",
        "objeto": "objeto", "titulo": "objeto", "title": "objeto",
        "finalidade": "finalidade", "funcao": "funcao", "função": "funcao",
        "subfuncao": "subfuncao", "subfunção": "subfuncao", "destinacao": "destinacao",
        "destinação": "destinacao", "orgaobeneficiario": "orgaoBeneficiario",
        "órgão": "orgaoBeneficiario", "orgao": "orgaoBeneficiario",
        "localidade": "localidadeBeneficiada", "localidadebeneficiada": "localidadeBeneficiada",
        "local": "localidadeBeneficiada", "endereco": "localidadeBeneficiada",
        "endereço": "localidadeBeneficiada", "instrumentojuridico": "instrumentoJuridico",
        "instrumento": "instrumentoJuridico", "possuicronograma": "possuiCronograma",
        "cronograma": "possuiCronograma", "prazoaplicacao": "prazoAplicacao",
        "prazo": "prazoAplicacao", "valor": "valor", "valorautorizado": "valorAutorizado",
        "percentualrcl": "percentualRcl", "contaespecifica": "contaEspecifica",
        "conta": "contaEspecifica", "numeroconta": "numeroConta",
        "portaltransparencia": "portalTransparenciaCheck",
        "portaltransparenciacheck": "portalTransparenciaCheck",
        "divulgacaotemporeal": "divulgacaoTempoReal", "linkportal": "linkPortal",
        "monitoramento": "monitoramentoCheck", "monitoramentocheck": "monitoramentoCheck",
        "status": "status", "prioridade": "priority", "priority": "priority",
        "latitude": "latitude", "longitude": "longitude", "categoria": "categoria",
        "setor": "categoria", "fornecedor": "fornecedor",
        "numerolicitacao": "numeroLicitacao", "licitacao": "numeroLicitacao",
        "licitação": "numeroLicitacao", "codigoaplicacao": "codigoAplicacao",
        "codigoaplicacaovariavel": "codigoAplicacaoVariavel",
        "reservado": "reservado", "empenhado": "empenhado",
        "liquidado": "liquidado", "pago": "pago",
        "reservador": "reservado", "empenhador": "empenhado", "liquidador": "liquidado", "pagor": "pago",
    };

    const clean = (s: string) => s
        .toLowerCase().trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

    // Logic: 
    // 1. Try exact cleaned match
    const k1 = clean(header);
    if (map[k1]) return map[k1];

    // 2. Try match before first parenthetical or special char
    const part = header.split(/[\(\[\ ]/)[0];
    const k2 = clean(part);
    if (map[k2]) return map[k2];

    return header.trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAmendment(row: string[], columns: string[]): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: Record<string, any> = {};

    columns.forEach((col, idx) => {
        const value = row[idx] ?? "";
        if (col === "latitude" || col === "longitude") {
            obj[col] = value ? parseFloat(value) : undefined;
        } else {
            obj[col] = value;
        }
    });

    if (!obj.id) obj.id = crypto.randomUUID();
    if (!obj.createdAt) obj.createdAt = new Date().toISOString();
    if (!obj.status) obj.status = "pendente";
    if (!obj.priority) obj.priority = "normal";

    obj.title = obj.objeto || obj.title || "";
    obj.address = obj.localidadeBeneficiada || obj.address || "";
    obj.year = obj.year || "2026";

    return obj;
}

// =====================================================
// POST Handler
// =====================================================

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Arquivo CSV obrigatório" }, { status: 400 });
        }

        const content = await file.text();
        const rows = parseCSV(content);

        if (rows.length < 2) {
            return NextResponse.json({ error: "CSV vazio ou sem dados" }, { status: 400 });
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);
        const format = detectFormat(headers);

        let columns: string[];
        if (format === "named") {
            columns = headers.map(normalizeHeaderName);
        } else {
            columns = MAIN_COLUMNS.slice(0, headers.length);
        }

        const csvAmendments = dataRows.map((row) => rowToAmendment(row, columns));

        // Read existing for merging and ID preservation
        const existingAmendments = await readJsonFile<any>(AMENDMENTS_FILE);

        const amendmentMap = new Map<string, any>();
        for (const a of existingAmendments) {
            if (a.id) amendmentMap.set(a.id, a);
        }

        // Helper to match by other fields
        const findExistingByNumero = (num?: string) => {
            if (!num) return null;
            return existingAmendments.find(a => a.numeroEmenda === num);
        };

        const findExistingByObjeto = (obj?: string) => {
            if (!obj) return null;
            return existingAmendments.find(a => a.objeto === obj || a.title === obj);
        };

        const finalAmendments: any[] = [];
        const financialData: any[] = [];
        const financialKeys = ["empenhado", "liquidado", "pago", "reservado"];

        for (const csvA of csvAmendments) {
            let targetId = csvA.id;
            
            // If ID is a new UUID generated by rowToAmendment, try to find original ID
            const isFreshUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId);
            
            if (isFreshUuid) {
                const matched = findExistingByNumero(csvA.numeroEmenda) || findExistingByObjeto(csvA.objeto);
                if (matched) {
                    targetId = matched.id;
                }
            }

            const existingA = amendmentMap.get(targetId);
            const mergedA = { ...(existingA || {}), ...csvA, id: targetId };

            // Extract financial data
            const hasFinancialInCsv = financialKeys.some(k => k in csvA);
            if (hasFinancialInCsv) {
                financialData.push({
                    amendmentId: targetId,
                    empenhado: csvA.empenhado !== undefined ? String(csvA.empenhado) : (existingA?.empenhado || ""),
                    liquidado: csvA.liquidado !== undefined ? String(csvA.liquidado) : (existingA?.liquidado || ""),
                    pago: csvA.pago !== undefined ? String(csvA.pago) : (existingA?.pago || ""),
                    reservado: csvA.reservado !== undefined ? String(csvA.reservado) : (existingA?.reservado || ""),
                    updatedAt: new Date().toISOString(),
                });
                
                // Remove from main amendment object
                financialKeys.forEach(k => delete mergedA[k]);
            }

            finalAmendments.push(mergedA);
        }

        // Save amendments (merged) — usa json-storage (Redis em prod, disco em dev)
        await writeJsonFile(AMENDMENTS_FILE, finalAmendments);

        // Save financial data (merge with existing)
        if (financialData.length > 0) {
            const existing = await readJsonFile<any>(FINANCIAL_FILE);

            for (const record of financialData) {
                const idx = existing.findIndex((r) => r.amendmentId === record.amendmentId);
                if (idx >= 0) {
                    existing[idx] = record;
                } else {
                    existing.push(record);
                }
            }

            await writeJsonFile(FINANCIAL_FILE, existing);
        }

        return NextResponse.json({
            success: true,
            amendments: finalAmendments.length,
            financial: financialData.length,
        });
    } catch (error) {
        console.error("Error importing amendments CSV:", error);
        return NextResponse.json({ error: "Falha ao importar CSV de emendas" }, { status: 500 });
    }
}
