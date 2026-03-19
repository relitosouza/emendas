/**
 * Converte CSV de ExecucaoFinanceira para financial.json (com merge)
 *
 * Uso:
 *   npx tsx scripts/csv-financial-to-json.ts <arquivo.csv>
 *   npx tsx scripts/csv-financial-to-json.ts <arquivo.csv> --overwrite
 *
 * Por padrão faz MERGE: atualiza registros existentes e adiciona novos.
 * Use --overwrite para substituir tudo.
 */

import fs from "fs";
import path from "path";

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
            } else if (char === ",") {
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

interface FinancialRecord {
    amendmentId: string;
    empenhado: string;
    liquidado: string;
    pago: string;
    reservado: string;
    updatedAt: string;
}

function main() {
    const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
    const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
    const overwrite = flags.includes("--overwrite");

    if (args.length === 0) {
        console.log("Uso: npx tsx scripts/csv-financial-to-json.ts <arquivo.csv> [--overwrite]");
        console.log("");
        console.log("  Padrão: merge (atualiza existentes, adiciona novos)");
        console.log("  --overwrite: substitui todo o financial.json");
        process.exit(1);
    }

    const csvPath = path.resolve(args[0]);
    const outputPath = path.join(process.cwd(), "data", "financial.json");

    if (!fs.existsSync(csvPath)) {
        console.error(`Erro: Arquivo não encontrado: ${csvPath}`);
        process.exit(1);
    }

    console.log(`Lendo CSV: ${csvPath}`);
    const content = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(content);

    if (rows.length < 2) {
        console.error("Erro: CSV vazio.");
        process.exit(1);
    }

    const dataRows = rows.slice(1); // skip header
    console.log(`Linhas de dados no CSV: ${dataRows.length}`);

    // Colunas: ID Emenda, Empenhado, Liquidado, Pago, Reservado, Data da Ultima atualização
    const now = new Date().toISOString();
    const csvRecords: FinancialRecord[] = dataRows.map((row) => ({
        amendmentId: row[0] || "",
        empenhado: row[1] || "0",
        liquidado: row[2] || "0",
        pago: row[3] || "0",
        reservado: row[4] || "0",
        updatedAt: row[5] || now,
    }));

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    if (overwrite) {
        fs.writeFileSync(outputPath, JSON.stringify(csvRecords, null, 2), "utf-8");
        console.log(`\n✓ ${csvRecords.length} registros salvos (overwrite) em: ${outputPath}`);
    } else {
        // Merge: carregar existente e atualizar/adicionar
        let existing: FinancialRecord[] = [];
        try {
            existing = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
        } catch { /* arquivo não existe ainda */ }

        const existingMap = new Map<string, FinancialRecord>();
        for (const rec of existing) {
            existingMap.set(rec.amendmentId, rec);
        }

        let updated = 0;
        let added = 0;

        for (const rec of csvRecords) {
            if (existingMap.has(rec.amendmentId)) {
                existingMap.set(rec.amendmentId, rec);
                updated++;
            } else {
                existingMap.set(rec.amendmentId, rec);
                added++;
            }
        }

        const merged = Array.from(existingMap.values());
        fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), "utf-8");

        console.log(`\nMerge concluído:`);
        console.log(`  Existentes antes: ${existing.length}`);
        console.log(`  Atualizados: ${updated}`);
        console.log(`  Novos: ${added}`);
        console.log(`  Total final: ${merged.length}`);
        console.log(`\n✓ Salvo em: ${outputPath}`);
    }
}

main();
