export interface Amendment {
    id: string;
    createdAt: string;

    // Identificação
    municipio: string;
    cnpj: string;
    responsavelNome: string;
    responsavelCargo: string;
    loa2026Check: string;

    // Dados da Emenda
    ambito: string;
    tipoEmenda: string;
    tipoEmendaOutro?: string;
    categoria: string; // Nova categorização: Saúde, Educação, etc.
    fundamentoLegal: string;
    autor: string; // Parlamentar
    numeroEmenda: string;
    objeto: string; // Used as title in some views
    finalidade: string;

    // Detalhamento
    funcao: string;
    subfuncao: string;
    destinacao: string;
    orgaoBeneficiario: string;
    localidadeBeneficiada: string;
    instrumentoJuridico: string;
    possuiCronograma: string;
    fornecedor?: string;
    numeroLicitacao?: string;

    // Financeiro
    prazoAplicacao: string;
    valor: string;
    valorAutorizado: string;
    percentualRcl: string;
    contaEspecifica: string;
    numeroConta?: string;
    reservado?: string;
    empenhado?: string;
    liquidado?: string;
    pago?: string;
    codigoAplicacao?: string;
    codigoAplicacaoVariavel?: string;
    // Event history (populated from financial.json)
    empenhos?: import("@/lib/json-storage").EmpenhoEvent[];
    liquidacoes?: import("@/lib/json-storage").LiquidacaoEvent[];
    pagamentos?: import("@/lib/json-storage").PagamentoEvent[];

    // Transparência
    portalTransparenciaCheck: string;
    divulgacaoTempoReal: string;
    linkPortal: string;
    monitoramentoCheck: string;

    // Legacy/Compat fields (kept for UI compatibility where needed, or mapped)
    latitude?: number;
    longitude?: number;
    status: string;
    priority: string;

    // Optional compatibility fields if we want to display old records without errors
    title?: string;
    address?: string;
    year?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    responsible?: string;
    value?: string;
    author?: string;
    neighborhood?: string;
}

const STORAGE_KEY = "portal_emendas_data";

export const getAmendments = (): Amendment[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const addAmendment = (amendment: Omit<Amendment, "id" | "createdAt">) => {
    const amendments = getAmendments();
    const newAmendment: Amendment = {
        ...amendment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newAmendment, ...amendments]));
    return newAmendment;
};

export const clearAmendments = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const deleteAmendment = (id: string) => {
    if (typeof window === "undefined") return;
    const amendments = getAmendments();
    const updated = amendments.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
