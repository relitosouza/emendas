import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { readJsonFile, writeJsonFile, FINANCIAL_FILE, FinancialRecord } from "@/lib/json-storage";

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

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Arquivo CSV obrigatório" }, { status: 400 });
        }

        // Limite de 5 MB para evitar DoS por arquivo grande
        const MAX_CSV_BYTES = 5 * 1024 * 1024;
        if (file.size > MAX_CSV_BYTES) {
            return NextResponse.json({ error: "Arquivo CSV muito grande (máximo 5 MB)" }, { status: 413 });
        }

        const content = await file.text();
        const rows = parseCSV(content);

        if (rows.length < 2) {
            return NextResponse.json({ error: "CSV vazio ou sem dados" }, { status: 400 });
        }

        const dataRows = rows.slice(1);
        const now = new Date().toISOString();

        const csvRecords: FinancialRecord[] = dataRows.map((row) => ({
            amendmentId: row[0] || "",
            empenhado: row[1] || "0",
            liquidado: row[2] || "0",
            pago: row[3] || "0",
            reservado: row[4] || "0",
            updatedAt: row[5] || now,
        }));

        // Merge with existing — usa json-storage (Redis em prod, disco em dev)
        const existing = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

        const existingMap = new Map<string, FinancialRecord>();
        for (const rec of existing) {
            existingMap.set(rec.amendmentId, rec);
        }

        let updated = 0;
        let added = 0;

        for (const rec of csvRecords) {
            if (existingMap.has(rec.amendmentId)) {
                updated++;
            } else {
                added++;
            }
            existingMap.set(rec.amendmentId, rec);
        }

        const merged = Array.from(existingMap.values());
        await writeJsonFile(FINANCIAL_FILE, merged);

        return NextResponse.json({
            success: true,
            updated,
            added,
            total: merged.length,
        });
    } catch (error) {
        console.error("Error importing financial CSV:", error);
        return NextResponse.json({ error: "Falha ao importar CSV financeiro" }, { status: 500 });
    }
}
