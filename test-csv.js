const fs = require('fs');
const content = fs.readFileSync('Emendas - Pagina1.csv', 'utf8');

function parseCSV(content) {
    const rows = [];
    let current = "";
    let inQuotes = false;
    let row = [];

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

const rows = parseCSV(content);

if (rows.length > 0) {
    console.log("Headers:");
    console.dir(rows[0], { maxArrayLength: null });

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

    function detectFormat(headers) {
        if (headers.length === MAIN_COLUMNS.length) return "indexed";
        const knownHeaders = ["id", "objeto", "autor", "valor", "status", "municipio", "ambito"];
        const normalized = headers.map((h) => h.toLowerCase().trim().replace(/\s+/g, ""));
        const matches = knownHeaders.filter((k) => normalized.some((h) => h.includes(k)));
        return matches.length >= 2 ? "named" : "indexed";
    }

    const format = detectFormat(rows[0]);
    console.log("Format detected:", format);

    const map = {
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
    };

    function normalizeHeaderName(header) {
        const key = header
            .toLowerCase().trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

        return map[key] || header.trim();
    }

    const columns = rows[0].map(normalizeHeaderName);
    console.log("Columns mapped:");
    console.dir(columns, { maxArrayLength: null });

    const obj = {};
    columns.forEach((col, idx) => {
        const val = rows[10][idx];
        obj[col] = val ?? "";
    });
    console.log("Row 10 final array:");
    console.dir(rows[10]);
    console.log("Row 10 final mapped object finalidade property:");
    console.log(obj.finalidade);
}
