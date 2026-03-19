"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAmendment } from "@/lib/store";
import dynamic from "next/dynamic";

// Step definitions with icons
const steps = [
    { label: "Identificação", icon: "fingerprint" },
    { label: "Classificação", icon: "category" },
    { label: "Detalhamento", icon: "location_on" },
    { label: "Financeiro", icon: "payments" },
    { label: "Monitoramento", icon: "query_stats" },
];

interface WizardFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function WizardForm({ initialData, isEditing = false }: WizardFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Identificação
        municipio: initialData?.municipio || "",
        cnpj: initialData?.cnpj || "",
        responsavelNome: initialData?.responsavelNome || "",
        responsavelCargo: initialData?.responsavelCargo || "",
        loa2026Check: initialData?.loa2026Check || "",

        // Classificação
        ambito: initialData?.ambito || "",
        tipoEmenda: initialData?.tipoEmenda || "",
        tipoEmendaOutro: initialData?.tipoEmendaOutro || "",
        categoria: initialData?.categoria || "",
        fundamentoLegal: initialData?.fundamentoLegal || "",
        autor: initialData?.autor || "",
        numeroEmenda: initialData?.numeroEmenda || "",
        objeto: initialData?.objeto || "",
        finalidade: initialData?.finalidade || "",

        // Detalhamento
        funcao: initialData?.funcao || "",
        subfuncao: initialData?.subfuncao || "",
        codigoAplicacao: initialData?.codigoAplicacao || "",
        codigoAplicacaoVariavel: initialData?.codigoAplicacaoVariavel || "",
        destinacao: initialData?.destinacao || "",
        orgaoBeneficiario: initialData?.orgaoBeneficiario || "",
        localidadeBeneficiada: initialData?.localidadeBeneficiada || "",
        instrumentoJuridico: initialData?.instrumentoJuridico || "",
        possuiCronograma: initialData?.possuiCronograma || "",
        fornecedor: initialData?.fornecedor || "",
        numeroLicitacao: initialData?.numeroLicitacao || "",

        // Financeiro
        prazoAplicacao: initialData?.prazoAplicacao || "",
        valor: initialData?.valor || "",
        valorAutorizado: initialData?.valorAutorizado || "",
        percentualRcl: initialData?.percentualRcl || "",
        contaEspecifica: initialData?.contaEspecifica || "",
        numeroConta: initialData?.numeroConta || "",
        empenhado: initialData?.empenhado || "",
        liquidado: initialData?.liquidado || "",
        pago: initialData?.pago || "",
        reservado: initialData?.reservado || "",

        // Transparência
        portalTransparenciaCheck: initialData?.portalTransparenciaCheck || "",
        divulgacaoTempoReal: initialData?.divulgacaoTempoReal || "",
        linkPortal: initialData?.linkPortal || "",
        monitoramentoCheck: initialData?.monitoramentoCheck || "",

        // Legacy
        latitude: initialData?.latitude || -23.5329,
        longitude: initialData?.longitude || -46.7915,
        status: initialData?.status || "Não Iniciada",
        priority: initialData?.priority || "media",
    });

    const MapPicker = dynamic(
        () => import("@/components/ui/map-picker").then((mod) => mod.MapPicker),
        { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse" /> }
    );

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleLocationChange = (lat: number, lng: number) => {
        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const handleNext = async () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            setLoading(true);
            try {
                const url = "/api/amendments";
                const method = isEditing ? "PUT" : "POST";
                const body = isEditing ? { ...formData, id: initialData.id } : formData;

                const response = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                const result = await response.json();

                if (response.ok) {
                    if (!isEditing) addAmendment(formData);
                    if (result.warning) {
                        alert(`Emenda ${isEditing ? "atualizada" : "salva"} localmente! (Aviso: ${result.warning})`);
                    } else {
                        alert(`Emenda ${isEditing ? "atualizada" : "cadastrada"} com sucesso!`);
                    }
                    router.push("/admin/dashboard");
                } else {
                    throw new Error(result.error || "Erro na API");
                }
            } catch (error: any) {
                console.error("Erro ao salvar:", error);
                alert("Erro ao salvar emenda: " + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    };

    // Step descriptions
    const stepDescriptions = [
        "Identificação dos responsáveis e conformidade legal inicial exigida pelo TCESP 2026.",
        "Classificação e tipologia da emenda conforme normativas vigentes.",
        "Detalhamento técnico, localização e instrumento jurídico vinculado.",
        "Dados financeiros, prazos e controle orçamentário.",
        "Transparência ativa, monitoramento e publicidade dos dados.",
    ];

    // Common input classes
    const inputClass =
        "w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-[#1A1A1A] transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
    const selectClass =
        "w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm text-[#1A1A1A] appearance-none transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
    const textareaClass =
        "w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-[#1A1A1A] resize-none transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
    const labelClass = "text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1";

    return (
        <>
            <div className="flex gap-8 items-start">
                {/* Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white rounded-2xl border border-slate-100 overflow-hidden sticky top-24" style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)" }}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/60">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Etapas do Cadastro</p>
                        <p className="text-xs text-slate-500 mt-0.5">{currentStep + 1} de {steps.length} etapas</p>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-slate-100">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                    <nav className="p-3 space-y-1">
                        {steps.map((step, index) => {
                            const isCompleted = index < currentStep;
                            const isCurrent = index === currentStep;
                            const isDisabled = index > currentStep;
                            return (
                                <button
                                    key={step.label}
                                    onClick={() => !isDisabled && setCurrentStep(index)}
                                    disabled={isDisabled}
                                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${isCurrent
                                        ? "bg-blue-50 text-blue-700"
                                        : isCompleted
                                            ? "text-slate-600 hover:bg-slate-50 cursor-pointer"
                                            : "text-slate-300 cursor-not-allowed"
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isCurrent
                                        ? "bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                                        : isCompleted
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-slate-100 text-slate-300"
                                        }`}>
                                        {isCompleted ? (
                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-xs font-bold leading-tight ${isCurrent ? "text-blue-700" : isCompleted ? "text-slate-700" : "text-slate-300"}`}>
                                            {step.label}
                                        </p>
                                        <p className={`text-[10px] mt-0.5 font-mono ${isCurrent ? "text-blue-500" : isCompleted ? "text-emerald-500" : "text-slate-300"}`}>
                                            {isCompleted ? "Concluído" : isCurrent ? "Em andamento" : "Pendente"}
                                        </p>
                                    </div>
                                    {isCurrent && (
                                        <span className="material-symbols-outlined text-[14px] text-blue-400 ml-auto shrink-0">chevron_right</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                    <div className="p-4 mx-3 mb-3 bg-blue-50/60 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Etapa atual</p>
                        <p className="text-xs text-blue-600 leading-relaxed">{stepDescriptions[currentStep]}</p>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Mobile step indicator */}
                    <div className="lg:hidden flex items-center gap-3 mb-6 bg-white rounded-xl border border-slate-100 p-4">
                        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-[18px]">{steps[currentStep].icon}</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">{steps[currentStep].label}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Etapa {currentStep + 1} de {steps.length}</p>
                        </div>
                        <div className="ml-auto flex gap-1">
                            {steps.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? "w-6 bg-blue-500" : i < currentStep ? "w-2 bg-emerald-400" : "w-2 bg-slate-200"}`} />
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100" style={{ boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)" }}>
                        {/* Card Header */}
                        <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="font-bold text-3xl text-[#1A1A1A] tracking-tight">
                                {isEditing ? "Editar Emenda" : "Cadastro de Emenda"}
                            </h2>
                            <p className="text-gray-500 mt-2 max-w-2xl">
                                {stepDescriptions[currentStep]}
                            </p>
                        </div>

                        {/* Card Body */}
                        <div className="p-10">
                            <form className="space-y-12" onSubmit={(e) => e.preventDefault()}>
                                {/* ===== STEP 1: IDENTIFICAÇÃO ===== */}
                                {currentStep === 0 && (
                                    <>
                                        {/* Section: Responsabilidade */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Responsabilidade</h3>
                                                <p className="text-sm text-gray-500 mt-1">Defina o autor e cargo do responsável pela proposição.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Nome do Responsável</label>
                                                        <input
                                                            className={inputClass}
                                                            type="text"
                                                            placeholder="Nome completo"
                                                            value={formData.responsavelNome}
                                                            onChange={(e) => handleChange("responsavelNome", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Cargo</label>
                                                        <input
                                                            className={inputClass}
                                                            type="text"
                                                            placeholder="Ex: Vereador, Deputado"
                                                            value={formData.responsavelCargo}
                                                            onChange={(e) => handleChange("responsavelCargo", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>Município</label>
                                                    <input
                                                        className={inputClass}
                                                        type="text"
                                                        placeholder="Ex: Osasco"
                                                        value={formData.municipio}
                                                        onChange={(e) => handleChange("municipio", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100" />

                                        {/* Section: Entidade Executora */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Entidade Executora</h3>
                                                <p className="text-sm text-gray-500 mt-1">Dados técnicos para rastreabilidade fiscal e auditoria.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>CNPJ da Entidade</label>
                                                        <input
                                                            className={`${inputClass} font-mono`}
                                                            type="text"
                                                            placeholder="00.000.000/0000-00"
                                                            value={formData.cnpj}
                                                            onChange={(e) => handleChange("cnpj", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Conformidade LOA 2026</label>
                                                        <div className="relative">
                                                            <select
                                                                className={selectClass}
                                                                value={formData.loa2026Check}
                                                                onChange={(e) => handleChange("loa2026Check", e.target.value)}
                                                            >
                                                                <option value="">Selecione</option>
                                                                <option value="Sim">Sim</option>
                                                                <option value="Não">Não</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ===== STEP 2: CLASSIFICAÇÃO ===== */}
                                {currentStep === 1 && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Tipologia</h3>
                                                <p className="text-sm text-gray-500 mt-1">Defina o âmbito, tipo e categoria da emenda parlamentar.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Âmbito</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.ambito} onChange={(e) => handleChange("ambito", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Federal">Federal</option>
                                                                <option value="Estadual">Estadual</option>
                                                                <option value="Municipal">Municipal</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Tipo de Emenda</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.tipoEmenda} onChange={(e) => handleChange("tipoEmenda", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Individual">Individual</option>
                                                                <option value="Bancada">Bancada</option>
                                                                <option value="Comissão">Comissão</option>
                                                                <option value="Relator">Relator</option>
                                                                <option value="Outro">Outro</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Categoria (Setor)</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.categoria} onChange={(e) => handleChange("categoria", e.target.value)}>
                                                                <option value="">Selecione a categoria</option>
                                                                <option value="Saúde">Saúde</option>
                                                                <option value="Infraestrutura">Infraestrutura</option>
                                                                <option value="Educação">Educação</option>
                                                                <option value="Esporte e Lazer">Esporte e Lazer</option>
                                                                <option value="Meio Ambiente">Meio Ambiente</option>
                                                                <option value="Urbanismo">Urbanismo</option>
                                                                <option value="Outro">Outro</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Autor da Emenda</label>
                                                        <input className={inputClass} type="text" placeholder="Parlamentar proponente" value={formData.autor} onChange={(e) => handleChange("autor", e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100" />

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Descrição</h3>
                                                <p className="text-sm text-gray-500 mt-1">Objeto, finalidade e fundamento legal da emenda.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Número da Emenda</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="Ex: EMD-2026/001" value={formData.numeroEmenda} onChange={(e) => handleChange("numeroEmenda", e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Fundamento Legal</label>
                                                        <input className={inputClass} type="text" placeholder="Artigo ou Lei" value={formData.fundamentoLegal} onChange={(e) => handleChange("fundamentoLegal", e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>Objeto do Projeto</label>
                                                    <textarea className={textareaClass} rows={3} placeholder="Ex: Reforma da Unidade Básica de Saúde Central..." value={formData.objeto} onChange={(e) => handleChange("objeto", e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>Finalidade</label>
                                                    <textarea className={textareaClass} rows={2} placeholder="Descreva a finalidade da emenda..." value={formData.finalidade} onChange={(e) => handleChange("finalidade", e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ===== STEP 3: DETALHAMENTO ===== */}
                                {currentStep === 2 && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Vinculação</h3>
                                                <p className="text-sm text-gray-500 mt-1">Programa, destinação e órgão beneficiário vinculados.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Função</label>
                                                        <input className={inputClass} type="text" placeholder="Informe a função" value={formData.funcao} onChange={(e) => handleChange("funcao", e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Subfunção</label>
                                                        <input className={inputClass} type="text" placeholder="Informe a subfunção" value={formData.subfuncao} onChange={(e) => handleChange("subfuncao", e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Código de Aplicação</label>
                                                        <input className={inputClass} type="text" placeholder="Válidos: 800; 801; 802; 803; 804; 900; 901; 902 e 904" value={formData.codigoAplicacao} onChange={(e) => handleChange("codigoAplicacao", e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Cód. Aplicação Variável</label>
                                                        <input className={inputClass} type="text" placeholder="001, 002" value={formData.codigoAplicacaoVariavel} onChange={(e) => handleChange("codigoAplicacaoVariavel", e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Destinação</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.destinacao} onChange={(e) => handleChange("destinacao", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Custeio">Custeio</option>
                                                                <option value="Investimento">Investimento</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Órgão Beneficiário</label>
                                                        <input className={inputClass} type="text" placeholder="Ex: Secretaria de Saúde" value={formData.orgaoBeneficiario} onChange={(e) => handleChange("orgaoBeneficiario", e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>Localidade Beneficiada</label>
                                                    <input className={inputClass} type="text" placeholder="Ex: Bairro Centro, Zona Norte" value={formData.localidadeBeneficiada} onChange={(e) => handleChange("localidadeBeneficiada", e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100" />

                                        {/* Licitação */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Licitação & Fornecedor</h3>
                                                <p className="text-sm text-gray-500 mt-1">Dados do processo licitatório e empresa contratada.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Número de Licitação</label>
                                                        <input
                                                            className={`${inputClass} font-mono`}
                                                            type="text"
                                                            placeholder="Ex: PREGÃO 001/2026"
                                                            value={formData.numeroLicitacao}
                                                            onChange={(e) => handleChange("numeroLicitacao", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Fornecedor / Empresa</label>
                                                        <input
                                                            className={inputClass}
                                                            type="text"
                                                            placeholder="Razão social da contratada"
                                                            value={formData.fornecedor}
                                                            onChange={(e) => handleChange("fornecedor", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100" />

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Instrumento & Localização</h3>
                                                <p className="text-sm text-gray-500 mt-1">Informações jurídicas e geolocalização da obra.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Instrumento Jurídico</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.instrumentoJuridico} onChange={(e) => handleChange("instrumentoJuridico", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Convênio">Convênio</option>
                                                                <option value="Contrato de Repasse">Contrato de Repasse</option>
                                                                <option value="Termo de Fomento">Termo de Fomento</option>
                                                                <option value="Transferência Especial">Transferência Especial</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Possui Cronograma</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.possuiCronograma} onChange={(e) => handleChange("possuiCronograma", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Sim">Sim</option>
                                                                <option value="Não">Não</option>
                                                                <option value="N/A">N/A</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>Localização no Mapa</label>
                                                    <div className="rounded-xl overflow-hidden border border-gray-200">
                                                        <MapPicker
                                                            lat={formData.latitude}
                                                            lng={formData.longitude}
                                                            onChange={handleLocationChange}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ===== STEP 4: FINANCEIRO ===== */}
                                {currentStep === 3 && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Valores</h3>
                                                <p className="text-sm text-gray-500 mt-1">Dados orçamentários e financeiros da emenda.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Valor da Emenda (R$)</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0,00" value={formData.valor} onChange={(e) => handleChange("valor", e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Valor Autorizado (R$)</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0,00" value={formData.valorAutorizado} onChange={(e) => handleChange("valorAutorizado", e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Percentual RCL (%)</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0,00%" value={formData.percentualRcl} onChange={(e) => handleChange("percentualRcl", e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Prazo de Aplicação</label>
                                                        <input className={inputClass} type="text" placeholder="Ex: 12 meses" value={formData.prazoAplicacao} onChange={(e) => handleChange("prazoAplicacao", e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100" />

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Execução Financeira</h3>
                                                <p className="text-sm text-gray-500 mt-1">Status atual das reservas e pagamentos.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Reservado (R$)</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0,00" value={formData.reservado} onChange={(e) => handleChange("reservado", e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Empenhado (R$)</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0,00" value={formData.empenhado} onChange={(e) => handleChange("empenhado", e.target.value)} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Liquidado (R$)</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0,00" value={formData.liquidado} onChange={(e) => handleChange("liquidado", e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Pago (R$)</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0,00" value={formData.pago} onChange={(e) => handleChange("pago", e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100" />

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Conta Bancária</h3>
                                                <p className="text-sm text-gray-500 mt-1">Dados da conta específica vinculada ao recurso.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Conta Específica</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.contaEspecifica} onChange={(e) => handleChange("contaEspecifica", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Sim">Sim</option>
                                                                <option value="Não">Não</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Número da Conta</label>
                                                        <input className={`${inputClass} font-mono`} type="text" placeholder="0000-0" value={formData.numeroConta} onChange={(e) => handleChange("numeroConta", e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ===== STEP 5: MONITORAMENTO ===== */}
                                {currentStep === 4 && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Transparência</h3>
                                                <p className="text-sm text-gray-500 mt-1">Informações sobre publicidade ativa e portal de transparência.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Portal de Transparência</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.portalTransparenciaCheck} onChange={(e) => handleChange("portalTransparenciaCheck", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Sim">Sim</option>
                                                                <option value="Não">Não</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Divulgação Tempo Real</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.divulgacaoTempoReal} onChange={(e) => handleChange("divulgacaoTempoReal", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Sim">Sim</option>
                                                                <option value="Não">Não</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>Link do Portal</label>
                                                    <input className={inputClass} type="url" placeholder="https://transparencia.exemplo.gov.br" value={formData.linkPortal} onChange={(e) => handleChange("linkPortal", e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-gray-100" />

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                            <div className="md:col-span-4">
                                                <h3 className="font-bold text-lg text-[#1A1A1A]">Controle</h3>
                                                <p className="text-sm text-gray-500 mt-1">Status, prioridade e monitoramento contínuo da emenda.</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Monitoramento Ativo</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.monitoramentoCheck} onChange={(e) => handleChange("monitoramentoCheck", e.target.value)}>
                                                                <option value="">Selecione</option>
                                                                <option value="Sim">Sim</option>
                                                                <option value="Não">Não</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className={labelClass}>Status</label>
                                                        <div className="relative">
                                                            <select className={selectClass} value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
                                                                <option value="Não Iniciada">Não Iniciada</option>
                                                                <option value="Em Análise">Em Análise</option>
                                                                <option value="Elaboração">Elaboração</option>
                                                                <option value="Viabilização">Viabilização</option>
                                                                <option value="Contratação">Contratação</option>
                                                                <option value="Execução">Execução</option>
                                                                <option value="Executada">Executada</option>
                                                                <option value="Prestação de Contas">Prestação de Contas</option>
                                                                <option value="Cancelada">Cancelada</option>
                                                            </select>
                                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className={labelClass}>Prioridade</label>
                                                    <div className="relative">
                                                        <select className={selectClass} value={formData.priority} onChange={(e) => handleChange("priority", e.target.value)}>
                                                            <option value="alta">Alta</option>
                                                            <option value="media">Média</option>
                                                            <option value="baixa">Baixa</option>
                                                        </select>
                                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl">expand_more</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Divider before footer */}
                                <div className="h-[1px] bg-gray-100" />

                                {/* Footer Buttons */}
                                <div className="flex items-center justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/admin/dashboard")}
                                        className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-[#1A1A1A] transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-xl">close</span>
                                        CANCELAR
                                    </button>
                                    <div className="flex gap-4">
                                        {currentStep > 0 && (
                                            <button
                                                type="button"
                                                onClick={handlePrevious}
                                                className="px-8 py-3 bg-white border border-gray-200 text-[#1A1A1A] rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                                                VOLTAR
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={loading}
                                            className="px-10 py-3 text-white rounded-xl text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-3 transition-all disabled:opacity-50"
                                            style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #333333 100%)" }}
                                        >
                                            {loading ? "SALVANDO..." : currentStep === steps.length - 1 ? "FINALIZAR CADASTRO" : "PRÓXIMO PASSO"}
                                            {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600">
                                <span className="material-symbols-outlined">menu_book</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Diretriz TCESP: Artigo 2</h4>
                                <p className="text-xs text-blue-800/70 mt-1 leading-relaxed">
                                    O CNPJ informado deve corresponder à entidade executora direta do recurso, conforme resolução normativa 2026.
                                </p>
                                <a className="inline-flex items-center text-[11px] font-bold text-blue-600 mt-3 hover:underline" href="#">
                                    VER MANUAL COMPLETO
                                    <span className="material-symbols-outlined text-[14px] ml-1">open_in_new</span>
                                </a>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400 border border-gray-200">
                                <span className="material-symbols-outlined">lightbulb</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-700">Dica de Preenchimento</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Utilize o CNPJ da matriz administrativa. O cargo do responsável deve ser o vigente na data de envio.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>{/* end main content */}
            </div>{/* end flex wrapper */}
        </>
    );
}
