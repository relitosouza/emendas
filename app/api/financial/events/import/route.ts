import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { addFinancialEvent, FinancialEventType } from "@/lib/json-storage";

function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    // Simple parser that handles quotes and both , and ; as delimiters
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

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const tipo = formData.get("tipo") as FinancialEventType | null;
        const amendmentIdFromParams = formData.get("amendmentId") as string | null;

        if (!file || !tipo) {
            return NextResponse.json({ error: "Arquivo CSV e 'tipo' são obrigatórios" }, { status: 400 });
        }

        const content = await file.text();
        const rows = parseCSV(content);

        if (rows.length < 2) {
            return NextResponse.json({ error: "CSV vazio ou sem dados" }, { status: 400 });
        }

        const headers = rows[0].map(h => h.toLowerCase());
        const dataRows = rows.slice(1);

        let added = 0;
        let errors = 0;

        for (const row of dataRows) {
            try {
                // Map row to event object based on columns
                // Expected columns for Empenho: numero, data, valor, credor, processo, descricao, subEmpenho
                // Expected columns for Liquidacao: numero, data, valor, descricao
                // Expected columns for Pagamento: data, valor, banco, agencia, documento, ordemBancaria, descricao
                
                // If the CSV has an 'amendmentId' column, use it. Otherwise use the one from params.
                let targetAmendmentId = amendmentIdFromParams;
                const ammendIdx = headers.indexOf("amendmentid");
                if (ammendIdx !== -1 && row[ammendIdx]) {
                    targetAmendmentId = row[ammendIdx];
                }

                if (!targetAmendmentId) {
                    errors++;
                    continue;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const event: any = {};
                headers.forEach((header, idx) => {
                    if (header !== "amendmentid") {
                        event[header] = row[idx] || "";
                    }
                });

                await addFinancialEvent(targetAmendmentId, tipo, event);
                added++;
            } catch (err) {
                console.error("Error adding row from CSV:", err);
                errors++;
            }
        }

        return NextResponse.json({
            success: true,
            added,
            errors,
            totalRows: dataRows.length
        });
    } catch (error) {
        console.error("Error importing events CSV:", error);
        return NextResponse.json({ error: "Falha ao importar CSV de eventos" }, { status: 500 });
    }
}
