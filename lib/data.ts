export interface Project {
    id: string;
    title: string;
    status: "Em andamento" | "Concluído" | "Parado" | "Planejamento" | "Atenção" | "Licitação";
    sector: "Saúde" | "Educação" | "Infraestrutura" | "Cultura" | "Segurança";
    budget: string;
    location: string;
    progress: number;
    description: string;
    startDate: string;
    endDate: string;
    updates: { date: string; title: string; description: string }[];
    responsible?: string;
}

export const projects: Project[] = [
    {
        id: "2026.04.12",
        title: "Pavimentação e Drenagem: Jd. Europa",
        status: "Parado",
        sector: "Infraestrutura",
        budget: "R$ 1.250.000",
        location: "Jardim Europa",
        progress: 12,
        description: "Recapeamento asfáltico completo e instalação de galeria pluvial em 4.5km de via urbana.",
        startDate: "01/01/2026",
        endDate: "30/06/2026",
        responsible: "Ver. Carlos Silva",
        updates: [
            { date: "15/02/2026", title: "Paralisação", description: "Obra paralisada por chuvas intensas e revisão de projeto." }
        ]
    },
    {
        id: "2026.05.88",
        title: "Reforma e Ampliação UBS Central",
        status: "Em andamento",
        sector: "Saúde",
        budget: "R$ 840.000",
        location: "Centro",
        progress: 65,
        description: "Ampliação da ala de pediatria e modernização do centro de triagem epidemiológica.",
        startDate: "01/11/2025",
        endDate: "01/11/2026",
        responsible: "Dep. Ana Souza",
        updates: [
            { date: "20/01/2026", title: "Medição #4", description: "Concretagem da laje do segundo pavimento concluída." }
        ]
    },
    {
        id: "2026.01.03",
        title: "Iluminação LED Parques e Praças",
        status: "Licitação",
        sector: "Infraestrutura",
        budget: "R$ 415.000",
        location: "Diversos",
        progress: 0,
        description: "Substituição de 1.200 pontos de iluminação por tecnologia LED em áreas de lazer.",
        startDate: "01/03/2026",
        endDate: "01/03/2027",
        responsible: "Sec. de Serviços Urbanos",
        updates: []
    },
    {
        id: "2025.12.44",
        title: "Aquisição de Ônibus Escolares",
        status: "Atenção",
        sector: "Educação",
        budget: "R$ 2.450.000",
        location: "Municipal",
        progress: 30,
        description: "Compra de 05 novos veículos adaptados para transporte escolar rural.",
        startDate: "01/01/2025",
        endDate: "20/12/2025",
        responsible: "Sec. de Educação",
        updates: [
            { date: "20/12/2025", title: "Atraso na Entrega", description: "Fornecedor solicitou aditivo de prazo por falta de peças." }
        ]
    },
    {
        id: "2025.10.99",
        title: "Complexo Esportivo Morada Sul",
        status: "Concluído",
        sector: "Cultura",
        budget: "R$ 560.000",
        location: "Morada Sul",
        progress: 100,
        description: "Construção de quadra poliesportiva, vestiários e iluminação noturna.",
        startDate: "10/01/2026",
        endDate: "10/04/2026",
        responsible: "Prefeitura Municipal",
        updates: []
    },
    {
        id: "2026.06.15",
        title: "Reforma do Teatro Municipal",
        status: "Em andamento",
        sector: "Cultura",
        budget: "R$ 1.100.000",
        location: "Centro",
        progress: 42,
        description: "Restauração de fachada histórica e modernização dos sistemas de som e luz.",
        startDate: "01/12/2025",
        endDate: "15/01/2026",
        responsible: "Dep. Marcos Paulo",
        updates: []
    },
];
