export function getNormalizedStatus(rawStatus: string | null | undefined): string {
    const s = String(rawStatus || "").toLowerCase().trim();

    if (s.includes("prestação de contas") || s.includes("prestacao de contas") || s.includes("prestação") || s.includes("prestacao")) return "Prestação de Contas";
    if (s.includes("executada") || s.includes("concluido") || s.includes("pago")) return "Executada";
    if (s.includes("execução") || s.includes("execucao") || s.includes("andamento")) return "Execução";
    if (s.includes("contratação") || s.includes("contratacao") || s.includes("aprovado")) return "Contratação";
    if (s.includes("viabilização") || s.includes("viabilizacao")) return "Viabilização";
    if (s.includes("elaboração") || s.includes("elaboracao")) return "Elaboração";
    if (s.includes("análise") || s.includes("analise") || s.includes("pendente")) return "Em Análise";
    if (s.includes("cancelada") || s.includes("cancelado") || s.includes("suspenso")) return "Cancelada";

    // Default fallback
    return "Não Iniciada";
}

export function getStatusStep(status: string): number {
    switch (status) {
        case "Não Iniciada": return 0;
        case "Em Análise": return 1;
        case "Elaboração": return 2;
        case "Viabilização": return 3;
        case "Contratação": return 4;
        case "Execução": return 5;
        case "Executada": return 6;
        case "Prestação de Contas": return 7;
        case "Cancelada": return 8;
        default: return 0;
    }
}
