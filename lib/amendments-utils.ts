// Shared utilities for amendment data — centralizes duplicated logic across pages

// ─── Foto dos Vereadores ───────────────────────────────────────────────────────

export const VEREADORES_PHOTOS: Record<string, string> = {
    "alexandre capriotti": "https://www.osasco.sp.leg.br/images/vereadores/400x533/45388db9259060c2f847a9acf050a525.jpg",
    "batista comunidade": "https://www.osasco.sp.leg.br/images/vereadores/400x533/a616933d8c8620c941db8c6389743b26.jpg",
    "cantor goleiro": "https://www.osasco.sp.leg.br/images/vereadores/400x533/0767c1963d740186c59c2e830c10e16b.jpg",
    "gilmeiron medeiros": "https://www.osasco.sp.leg.br/images/vereadores/400x533/0767c1963d740186c59c2e830c10e16b.jpg",
    "gilmeiron": "https://www.osasco.sp.leg.br/images/vereadores/400x533/0767c1963d740186c59c2e830c10e16b.jpg",
    "carmônio bastos": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9ed34e28b9efdc33b9a383d18abc6946.jpg",
    "carmonio bastos": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9ed34e28b9efdc33b9a383d18abc6946.jpg",
    "délbio teruel": "https://www.osasco.sp.leg.br/images/vereadores/400x533/e535033db602c5581a7ac0b1d0315046.jpg",
    "delbio teruel": "https://www.osasco.sp.leg.br/images/vereadores/400x533/e535033db602c5581a7ac0b1d0315046.jpg",
    "elania silva": "https://www.osasco.sp.leg.br/images/vereadores/400x533/2d5fce8da59d004aaf94a048306c88c2.jpg",
    "elsa oliveira": "https://www.osasco.sp.leg.br/images/vereadores/400x533/3ee2bfdd86e0fe13ff2eba5087f754af.JPEG",
    "emerson osasco": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9df54556d1ce3e52f5f92b34e0e902b7.jpg",
    "fábio chirinhan": "https://www.osasco.sp.leg.br/images/vereadores/400x533/7637eecf3bafafa18bf946866c3d7ebb.jpg",
    "fabio chirinhan": "https://www.osasco.sp.leg.br/images/vereadores/400x533/7637eecf3bafafa18bf946866c3d7ebb.jpg",
    "gabriel saúde": "https://www.osasco.sp.leg.br/images/vereadores/400x533/64d036a8536d88813efe862c01f17196.jpg",
    "gabriel saude": "https://www.osasco.sp.leg.br/images/vereadores/400x533/64d036a8536d88813efe862c01f17196.jpg",
    "guilherme prado": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9a0b3136fdaadd2c3eafa95bc9ac8a67.jpg",
    "heber do juntoz": "https://www.osasco.sp.leg.br/images/vereadores/400x533/451dca9078df3a7b78ba7dbcae04f519.jpg",
    "heber": "https://www.osasco.sp.leg.br/images/vereadores/400x533/451dca9078df3a7b78ba7dbcae04f519.jpg",
    "josias da juco": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9af83e98e89d0d11384218be586f9c15.jpg",
    "josias": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9af83e98e89d0d11384218be586f9c15.jpg",
    "laércio mendonça": "https://www.osasco.sp.leg.br/images/vereadores/400x533/24d2dd1f169220dd29a534cab813846f.jpg",
    "laercio mendonca": "https://www.osasco.sp.leg.br/images/vereadores/400x533/24d2dd1f169220dd29a534cab813846f.jpg",
    "lúcia da saúde": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "lucia da saude": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "francisca jenilúcia": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "francisca jenilucia": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "jenilúcia": "https://www.osasco.sp.leg.br/images/vereadores/400x533/8eda3967aa4a294208d7d14ccf96f63a.jpg",
    "paulo junior": "https://www.osasco.sp.leg.br/images/vereadores/400x533/1dae1fb1d07087c4955141b0c4a187ae.jpg",
    "pedrinho cantagessi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/1f3f10d6b03bf5dc76cab37061b8bf0a.jpg",
    "ralfi silva": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "ralfi rafael": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "ralfi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/aad42d63bda566e06fc169d1e1bf70e7.jpg",
    "rodrigo gansinho": "https://www.osasco.sp.leg.br/images/vereadores/400x533/9b61b998c846d6a0bf42416efcf1ea12.jpg",
    "sergio fontellas": "https://www.osasco.sp.leg.br/images/vereadores/400x533/ed4f5329b802c35ca71bfe51a0547a4a.jpg",
    "sérgio fontellas": "https://www.osasco.sp.leg.br/images/vereadores/400x533/ed4f5329b802c35ca71bfe51a0547a4a.jpg",
    "stephane rossi": "https://www.osasco.sp.leg.br/images/vereadores/400x533/c019dab55864b3d4a328aeb49686e753.jpg",
};

export function findVereadorPhoto(name: string): string | undefined {
    const normalized = name.toLowerCase().trim();
    if (VEREADORES_PHOTOS[normalized]) return VEREADORES_PHOTOS[normalized];
    for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
        if (normalized.includes(key) || key.includes(normalized)) return url;
    }
    const parts = normalized.split(" ");
    for (const part of parts) {
        if (part.length < 3) continue;
        for (const [key, url] of Object.entries(VEREADORES_PHOTOS)) {
            if (key.split(" ").some(k => k === part)) return url;
        }
    }
    return undefined;
}

// ─── Mapa de Categorias Orçamentárias ─────────────────────────────────────────

export const CATEGORY_MAP: Record<string, string> = {
    "1": "LEGISLATIVA", "2": "JUDICIÁRIA", "3": "ESSENCIAL À JUSTIÇA",
    "4": "ADMINISTRAÇÃO", "5": "DEFESA NACIONAL", "6": "SEGURANÇA PÚBLICA",
    "7": "RELAÇÕES EXTERIORES", "8": "ASSISTÊNCIA SOCIAL", "9": "PREVIDÊNCIA SOCIAL",
    "10": "SAÚDE", "11": "TRABALHO", "12": "EDUCAÇÃO", "13": "CULTURA",
    "14": "DIREITOS DA CIDADANIA", "15": "URBANISMO", "16": "HABITAÇÃO",
    "17": "SANEAMENTO", "18": "GESTÃO AMBIENTAL", "19": "CIÊNCIA E TECNOLOGIA",
    "20": "AGRICULTURA", "21": "ORGANIZAÇÃO AGRÁRIA", "22": "INDÚSTRIA",
    "23": "COMÉRCIO E SERVIÇOS", "24": "COMUNICAÇÕES", "25": "ENERGIA",
    "26": "TRANSPORTE", "27": "DESPORTO E LAZER", "28": "ENCARGOS ESPECIAIS",
    "99": "RESERVA DE CONTIGÊNCIA",
};

export function getCategoryLabel(cat?: string): string | null {
    if (!cat) return null;
    let catNum = cat;
    if (typeof catNum === "string" && catNum.includes(" - ")) catNum = catNum.split(" - ")[0].trim();
    return CATEGORY_MAP[String(catNum)] || cat;
}

// ─── Parsing de Moeda ──────────────────────────────────────────────────────────

export function parseCurrency(val?: string | number): number {
    if (!val) return 0;
    if (typeof val === "number") return val;
    
    let str = String(val).trim();
    
    // Check if it's already a valid number string (like "12345.67")
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str) || 0;
    }

    // If it has a comma, it's likely Brazilian/European (thousands: . , decimal: ,)
    if (str.includes(",")) {
        // If it also has a dot after the comma, it's very weird, but let's assume BR
        // Normal BR: 1.234,56
        const cleaned = str.replace(/[R$\s.]/g, "").replace(",", ".");
        return parseFloat(cleaned) || 0;
    }

    // If it only has a dot (or multiple dots)
    if (str.includes(".")) {
        const parts = str.split(".");
        // If multiple dots, it's thousands: 1.234.567
        if (parts.length > 2) {
            return parseFloat(str.replace(/[R$\s.]/g, "")) || 0;
        }
        // If one dot and exactly 2 or 1 digits at the end: likely decimal 1234.56
        if (parts[1].length === 2 || parts[1].length === 1) {
            return parseFloat(str.replace(/[R$\s]/g, "")) || 0;
        }
        // Default to thousands if 3 digits: 1.234
        if (parts[1].length === 3) {
            return parseFloat(str.replace(/[R$\s.]/g, "")) || 0;
        }
    }

    // fallback cleaning for any other case
    const cleaned = str.replace(/[R$\s,]/g, ""); // Remove R$, spaces and commas
    return parseFloat(cleaned) || 0;
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
