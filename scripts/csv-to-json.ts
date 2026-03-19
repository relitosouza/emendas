/**
 * Converte CSV exportado do Google Sheets para JSON.
 *
 * Uso:
 *   npx tsx scripts/csv-to-json.ts <arquivo.csv> [destino.json]
 *
 * Exemplos:
 *   npx tsx scripts/csv-to-json.ts emendas.csv data/amendments.json
 *   npx tsx scripts/csv-to-json.ts emendas.csv                       # salva em data/amendments.json
 */

import fs from "fs";
import path from "path";

// =====================================================
// CSV Parser (sem dependências externas)
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
                i++; // skip escaped quote
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
                if (char === "\r") i++; // skip \r\n
            } else {
                current += char;
            }
        }
    }

    // última linha
    if (current || row.length > 0) {
        row.push(current.trim());
        if (row.some((cell) => cell !== "")) {
            rows.push(row);
        }
    }

    return rows;
}

// =====================================================
// Mapeamento de colunas do Google Sheets
// =====================================================

// Colunas na ordem da planilha principal (Página1)
const MAIN_COLUMNS = [
    "id",                      // 0
    "createdAt",               // 1
    "municipio",               // 2
    "cnpj",                    // 3
    "responsavelNome",         // 4
    "responsavelCargo",        // 5
    "loa2026Check",            // 6
    "ambito",                  // 7
    "tipoEmenda",              // 8
    "tipoEmendaOutro",         // 9
    "fundamentoLegal",         // 10
    "autor",                   // 11
    "numeroEmenda",            // 12
    "objeto",                  // 13
    "finalidade",              // 14
    "funcao",                  // 15
    "destinacao",              // 16
    "orgaoBeneficiario",       // 17
    "localidadeBeneficiada",   // 18
    "instrumentoJuridico",     // 19
    "possuiCronograma",        // 20
    "prazoAplicacao",          // 21
    "valor",                   // 22
    "valorAutorizado",         // 23
    "percentualRcl",           // 24
    "contaEspecifica",         // 25
    "numeroConta",             // 26
    "portalTransparenciaCheck",// 27
    "divulgacaoTempoReal",     // 28
    "linkPortal",              // 29
    "monitoramentoCheck",      // 30
    "status",                  // 31
    "priority",                // 32
    "latitude",                // 33
    "longitude",               // 34
    "categoria",               // 35
    "fornecedor",              // 36
    "numeroLicitacao",         // 37
    "codigoAplicacao",         // 38
    "codigoAplicacaoVariavel", // 39
    "subfuncao",               // 40
];

// =====================================================
// Detecção automática de formato
// =====================================================

function detectFormat(headers: string[]): "indexed" | "named" {
    // Se tem 41 colunas, é o formato exato do Google Sheets — usar indexado
    // (evita problemas com headers duplicados como "Número Emenda" nas colunas 0 e 12)
    if (headers.length === MAIN_COLUMNS.length) {
        return "indexed";
    }

    // Caso contrário, tentar detectar pelo nome dos headers
    const knownHeaders = ["id", "objeto", "autor", "valor", "status", "municipio", "ambito"];
    const normalized = headers.map((h) => h.toLowerCase().trim().replace(/\s+/g, ""));
    const matches = knownHeaders.filter((k) => normalized.some((h) => h.includes(k)));
    return matches.length >= 2 ? "named" : "indexed";
}

function normalizeHeaderName(header: string): string {
    // Mapa de nomes comuns em português para nomes do sistema
    const map: Record<string, string> = {
        "id": "id",
        "criadoem": "createdAt",
        "createdat": "createdAt",
        "datacriacao": "createdAt",
        "municipio": "municipio",
        "município": "municipio",
        "cnpj": "cnpj",
        "responsavel": "responsavelNome",
        "responsavelnome": "responsavelNome",
        "nomeresponsavel": "responsavelNome",
        "cargo": "responsavelCargo",
        "responsavelcargo": "responsavelCargo",
        "loa2026": "loa2026Check",
        "loa2026check": "loa2026Check",
        "ambito": "ambito",
        "âmbito": "ambito",
        "tipoemenda": "tipoEmenda",
        "tipodeemenda": "tipoEmenda",
        "tipo": "tipoEmenda",
        "tipoemendaoutro": "tipoEmendaOutro",
        "fundamentolegal": "fundamentoLegal",
        "fundamento": "fundamentoLegal",
        "autor": "autor",
        "parlamentar": "autor",
        "numeroemenda": "numeroEmenda",
        "numero": "numeroEmenda",
        "número": "numeroEmenda",
        "objeto": "objeto",
        "titulo": "objeto",
        "title": "objeto",
        "finalidade": "finalidade",
        "funcao": "funcao",
        "função": "funcao",
        "subfuncao": "subfuncao",
        "subfunção": "subfuncao",
        "destinacao": "destinacao",
        "destinação": "destinacao",
        "orgaobeneficiario": "orgaoBeneficiario",
        "órgão": "orgaoBeneficiario",
        "orgao": "orgaoBeneficiario",
        "localidade": "localidadeBeneficiada",
        "localidadebeneficiada": "localidadeBeneficiada",
        "local": "localidadeBeneficiada",
        "endereco": "localidadeBeneficiada",
        "endereço": "localidadeBeneficiada",
        "instrumentojuridico": "instrumentoJuridico",
        "instrumento": "instrumentoJuridico",
        "possuicronograma": "possuiCronograma",
        "cronograma": "possuiCronograma",
        "prazoaplicacao": "prazoAplicacao",
        "prazo": "prazoAplicacao",
        "valor": "valor",
        "valorautorizado": "valorAutorizado",
        "percentualrcl": "percentualRcl",
        "contaespecifica": "contaEspecifica",
        "conta": "contaEspecifica",
        "numeroconta": "numeroConta",
        "portaltransparencia": "portalTransparenciaCheck",
        "portaltransparenciacheck": "portalTransparenciaCheck",
        "divulgacaotemporeal": "divulgacaoTempoReal",
        "linkportal": "linkPortal",
        "monitoramento": "monitoramentoCheck",
        "monitoramentocheck": "monitoramentoCheck",
        "status": "status",
        "prioridade": "priority",
        "priority": "priority",
        "latitude": "latitude",
        "longitude": "longitude",
        "categoria": "categoria",
        "setor": "categoria",
        "fornecedor": "fornecedor",
        "numerolicitacao": "numeroLicitacao",
        "licitacao": "numeroLicitacao",
        "licitação": "numeroLicitacao",
        "codigoaplicacao": "codigoAplicacao",
        "codigoaplicacaovariavel": "codigoAplicacaoVariavel",
        "reservado": "reservado",
        "empenhado": "empenhado",
        "liquidado": "liquidado",
        "pago": "pago",
    };

    const key = header
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/[^a-z0-9]/g, "");      // remove espaços/pontuação

    return map[key] || header.trim();
}

// =====================================================
// Conversão
// =====================================================

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

    // Garantir campos obrigatórios
    if (!obj.id) {
        obj.id = crypto.randomUUID();
    }
    if (!obj.createdAt) {
        obj.createdAt = new Date().toISOString();
    }
    if (!obj.status) {
        obj.status = "pendente";
    }
    if (!obj.priority) {
        obj.priority = "normal";
    }

    // Campos de compatibilidade
    obj.title = obj.objeto || obj.title || "";
    obj.address = obj.localidadeBeneficiada || obj.address || "";
    obj.year = obj.year || "2026";

    return obj;
}

// =====================================================
// Main
// =====================================================

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("Uso: npx tsx scripts/csv-to-json.ts <arquivo.csv> [destino.json]");
        console.log("");
        console.log("Exemplos:");
        console.log("  npx tsx scripts/csv-to-json.ts emendas.csv");
        console.log("  npx tsx scripts/csv-to-json.ts emendas.csv data/amendments.json");
        process.exit(1);
    }

    const csvPath = path.resolve(args[0]);
    const outputPath = args[1]
        ? path.resolve(args[1])
        : path.join(process.cwd(), "data", "amendments.json");

    if (!fs.existsSync(csvPath)) {
        console.error(`Erro: Arquivo não encontrado: ${csvPath}`);
        process.exit(1);
    }

    console.log(`Lendo CSV: ${csvPath}`);
    const content = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(content);

    if (rows.length < 2) {
        console.error("Erro: CSV vazio ou sem dados (precisa de header + pelo menos 1 linha).");
        process.exit(1);
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const format = detectFormat(headers);

    console.log(`Formato detectado: ${format === "named" ? "colunas nomeadas" : "colunas por índice"}`);
    console.log(`Colunas encontradas: ${headers.length}`);
    console.log(`Linhas de dados: ${dataRows.length}`);

    let columns: string[];

    if (format === "named") {
        columns = headers.map(normalizeHeaderName);
        console.log(`Colunas mapeadas: ${columns.join(", ")}`);
    } else {
        // Usa mapeamento por índice (mesma ordem do Google Sheets)
        columns = MAIN_COLUMNS.slice(0, headers.length);
        console.log(`Usando mapeamento por índice (${columns.length} colunas)`);
    }

    const amendments = dataRows.map((row) => rowToAmendment(row, columns));

    // Separar dados financeiros se presentes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const financialData: any[] = [];
    for (const a of amendments) {
        if (a.empenhado || a.liquidado || a.pago || a.reservado) {
            financialData.push({
                amendmentId: a.id,
                empenhado: a.empenhado || "",
                liquidado: a.liquidado || "",
                pago: a.pago || "",
                reservado: a.reservado || "",
                updatedAt: new Date().toISOString(),
            });
            // Remover do objeto principal (ficam no financial.json)
            delete a.empenhado;
            delete a.liquidado;
            delete a.pago;
            delete a.reservado;
        }
    }

    // Salvar amendments
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(amendments, null, 2), "utf-8");
    console.log(`\n✓ ${amendments.length} emendas salvas em: ${outputPath}`);

    // Salvar dados financeiros se existirem
    if (financialData.length > 0) {
        const financialPath = path.join(path.dirname(outputPath), "financial.json");
        // Merge com existente
        let existing: any[] = [];
        try {
            existing = JSON.parse(fs.readFileSync(financialPath, "utf-8"));
        } catch { /* empty */ }

        for (const record of financialData) {
            const idx = existing.findIndex((r: any) => r.amendmentId === record.amendmentId);
            if (idx >= 0) {
                existing[idx] = record;
            } else {
                existing.push(record);
            }
        }

        fs.writeFileSync(financialPath, JSON.stringify(existing, null, 2), "utf-8");
        console.log(`✓ ${financialData.length} registros financeiros salvos em: ${financialPath}`);
    }

    console.log("\nConversão concluída!");
}

main();
