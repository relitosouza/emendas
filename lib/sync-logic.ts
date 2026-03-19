import { readJsonFile, writeJsonFile, FINANCIAL_FILE, AMENDMENTS_FILE, FinancialRecord } from "./json-storage";
import { parseCurrency } from "./amendments-utils";

const OSASCO_API_URL = 'https://transparencia.osasco.sp.gov.br/paiportalserver/modulovisao/filter';
const CURRENT_EXERCISE = 2026;
const CURRENT_PERIOD = 'MARCO';

interface PortalRecord {
    ID: number;
    Exercicio: number;
    DescVinculo: string;
    AutorEmenda: string;
    Objeto: string;
    SaldoAtual: string;
    Reservado: string;
    Empenhado: string;
    Liquidado: string;
    ValorPago: string;
}

function parsePortalCurrency(val: string): string {
    const num = parseCurrency(val);
    if (!num) return "0,00";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function extractBaseNumber(str: string): string | null {
    if (!str) return null;
    const match = str.match(/(\d+)/);
    return match ? match[1].padStart(3, '0') : null;
}

export async function runFinancialSync() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const payload = {
        "ChaveModulo": "66",
        "NomeVisao": "EmendasParlamentares",
        "Filtros": [],
        "Periodicidade": "MENSAL",
        "Periodo": CURRENT_PERIOD,
        "Exercicio": CURRENT_EXERCISE,
        "Pagina": 1,
        "QuantidadeRegistros": "300", 
        "Ordenacao": [{ "ColunaOrdem": "ID", "TipoOrdem": "ascend", "Ordem": 1 }]
    };

    const response = await fetch(OSASCO_API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://transparencia.osasco.sp.gov.br',
            'Referer': 'https://transparencia.osasco.sp.gov.br/'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const portalData = await response.json();
    const portalRecords = portalData.Valores as PortalRecord[];

    const localAmendments = await readJsonFile<any>(AMENDMENTS_FILE);
    const existingFinancial = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

    const financialMap = new Map<string, FinancialRecord>();
    existingFinancial.forEach(r => financialMap.set(r.amendmentId, r));

    let matchedCount = 0;
    for (const local of localAmendments) {
        const localBase = extractBaseNumber(local.numeroEmenda);
        
        const portalMatch = portalRecords.find(p => {
            const portalBase = extractBaseNumber(p.DescVinculo);
            const numberMatch = localBase && portalBase && localBase === portalBase;
            const objectMatch = local.objeto && p.Objeto && 
                               (local.objeto.substring(0, 30).toLowerCase() === p.Objeto.substring(0, 30).toLowerCase());
            const authorMatch = local.autor && p.AutorEmenda && 
                               p.AutorEmenda.toLowerCase().includes(local.autor.split(' ')[0].toLowerCase());

            return numberMatch && (objectMatch || authorMatch);
        });

        if (portalMatch) {
            financialMap.set(local.id, {
                amendmentId: local.id,
                reservado: parsePortalCurrency(portalMatch.Reservado),
                empenhado: parsePortalCurrency(portalMatch.Empenhado),
                liquidado: parsePortalCurrency(portalMatch.Liquidado),
                pago: parsePortalCurrency(portalMatch.ValorPago),
                updatedAt: new Date().toISOString()
            });
            matchedCount++;
        }
    }

    await writeJsonFile(FINANCIAL_FILE, Array.from(financialMap.values()));
    
    // Salvar meta-informação da última sincronização
    await writeJsonFile("sync_info.json", [{ lastSync: new Date().toISOString() }]);
    
    return matchedCount;
}
