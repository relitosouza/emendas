# Melhorias Funcionais: Filtro Dinâmico e Detalhes Técnicos

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corrigir o filtro de setores na página de listagem de emendas para usar dados reais, e adicionar um acordeão de detalhes técnicos na página de detalhes de cada emenda.

**Architecture:** (1) O filtro dinâmico usa `useMemo` derivado do estado `projects` já carregado — sem chamadas extras à API. (2) O acordeão é extraído como um Client Component separado (`TechnicalDetailsAccordion`) para não quebrar o Server Component existente em `/projetos/[id]/page.tsx`.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS

---

## Task 1: Filtro Dinâmico de Setores em `/projetos`

**Files:**
- Modify: `app/projetos/page.tsx`

### Step 1: Localizar o useMemo import e o select de setores

Abra `app/projetos/page.tsx`. Confirme que `useMemo` NÃO está importado ainda (o arquivo usa `useState`, `useEffect`, `Suspense`). O select hardcoded está por volta da linha 419:

```tsx
<select
    className="..."
    value={selectedSector || ""}
    onChange={(e) => setSelectedSector(e.target.value || null)}
>
    <option value="">Todos os Setores</option>
    <option value="Saúde">🏥 Saúde</option>
    <option value="Educação">📚 Educação</option>
    <option value="Infraestrutura">🚧 Infraestrutura</option>
    <option value="Segurança">🚓 Segurança</option>
    <option value="Cultura">🎭 Cultura</option>
</select>
```

### Step 2: Adicionar `useMemo` ao import do React

Linha 4 do arquivo:
```tsx
// Antes:
import { useState, Suspense, useEffect } from "react";

// Depois:
import { useState, Suspense, useEffect, useMemo } from "react";
```

### Step 3: Adicionar `availableSectors` derivado de `projects`

Logo após as declarações de estado (após `const [currentPage, setCurrentPage] = useState(1);`), adicionar:

```tsx
const availableSectors = useMemo(() => {
    const sectors = new Set(projects.map(p => p.sector).filter(Boolean));
    return Array.from(sectors).sort((a, b) => a.localeCompare(b, "pt-BR"));
}, [projects]);
```

### Step 4: Substituir as `<option>` hardcoded

Substituir o bloco inteiro do select de setores por:

```tsx
<select
    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] cursor-pointer"
    value={selectedSector || ""}
    onChange={(e) => setSelectedSector(e.target.value || null)}
>
    <option value="">Todos os Setores</option>
    {availableSectors.map(sector => (
        <option key={sector} value={sector}>{sector}</option>
    ))}
</select>
```

### Step 5: Verificar manualmente no browser

- Iniciar o servidor: `npm run dev` (na pasta `portal-de-emendas`)
- Abrir `http://localhost:3000/projetos`
- O dropdown de setores deve listar apenas os setores que existem nos dados
- Selecionar um setor e confirmar que o filtro funciona

### Step 6: Commit

```bash
cd C:/projects/PortalEmendas/portal-de-emendas
git add app/projetos/page.tsx
git commit -m "feat: filtro de setores dinâmico baseado nos dados reais"
```

---

## Task 2: Componente Client `TechnicalDetailsAccordion`

**Files:**
- Create: `components/projects/technical-details-accordion.tsx`

### Contexto importante

`app/projetos/[id]/page.tsx` é um **Server Component** (sem `"use client"` no topo, usa `async/await` diretamente, `export const revalidate = 60`). Para adicionar interatividade com `useState`, é obrigatório criar um componente separado com `"use client"`.

### Step 1: Criar o arquivo do componente

Criar `components/projects/technical-details-accordion.tsx`:

```tsx
"use client";

import { useState } from "react";

interface TechnicalDetailsAccordionProps {
    orgaoBeneficiario?: string;
    municipio?: string;
    cnpj?: string;
    fornecedor?: string;
    instrumentoJuridico?: string;
    prazoAplicacao?: string;
    codigoAplicacao?: string;
    numeroLicitacao?: string;
}

interface FieldItem {
    label: string;
    value: string | undefined;
}

export default function TechnicalDetailsAccordion({
    orgaoBeneficiario,
    municipio,
    cnpj,
    fornecedor,
    instrumentoJuridico,
    prazoAplicacao,
    codigoAplicacao,
    numeroLicitacao,
}: TechnicalDetailsAccordionProps) {
    const [open, setOpen] = useState(false);

    const fields: FieldItem[] = [
        { label: "Órgão Beneficiário", value: orgaoBeneficiario },
        { label: "Município", value: municipio },
        { label: "CNPJ", value: cnpj },
        { label: "Fornecedor", value: fornecedor },
        { label: "Instrumento Jurídico", value: instrumentoJuridico },
        { label: "Prazo de Aplicação", value: prazoAplicacao },
        { label: "Código de Aplicação", value: codigoAplicacao },
        { label: "Nº Licitação", value: numeroLicitacao },
    ].filter(f => f.value && f.value.trim() !== "" && f.value !== "-");

    if (fields.length === 0) return null;

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between p-6 lg:p-8 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={open}
            >
                <div>
                    <h2 className="text-xl font-bold">Detalhes Técnicos</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {open ? "Clique para recolher" : `${fields.length} campos disponíveis`}
                    </p>
                </div>
                <span
                    className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                >
                    expand_more
                </span>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="px-6 lg:px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 border-t border-slate-100 pt-6">
                    {fields.map(field => (
                        <div key={field.label}>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {field.label}
                            </p>
                            <p className="text-sm font-medium text-slate-800 break-words">
                                {field.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
```

### Step 2: Commit do novo componente

```bash
git add components/projects/technical-details-accordion.tsx
git commit -m "feat: criar TechnicalDetailsAccordion como client component"
```

---

## Task 3: Usar `TechnicalDetailsAccordion` na página de detalhes

**Files:**
- Modify: `app/projetos/[id]/page.tsx`

### Step 1: Adicionar o import

No topo de `app/projetos/[id]/page.tsx`, após os imports existentes:

```tsx
import TechnicalDetailsAccordion from "@/components/projects/technical-details-accordion";
```

### Step 2: Localizar o ponto de inserção

Na coluna esquerda da view de tela (a partir da linha ~460), a estrutura é:

```tsx
<div className="lg:col-span-7 flex flex-col gap-8">
    {/* Project Info */}
    <section ...> ... </section>

    {/* Financial Flow */}
    <section ...> ... </section>

    {/* ← INSERIR AQUI */}
</div>
```

### Step 3: Inserir o componente após o Financial Flow

Logo após o fechamento da `</section>` do "Fluxo de Execução Orçamentária", adicionar:

```tsx
<TechnicalDetailsAccordion
    orgaoBeneficiario={amendment.orgaoBeneficiario}
    municipio={amendment.municipio}
    cnpj={amendment.cnpj}
    fornecedor={amendment.fornecedor}
    instrumentoJuridico={amendment.instrumentoJuridico}
    prazoAplicacao={amendment.prazoAplicacao}
    codigoAplicacao={amendment.codigoAplicacao}
    numeroLicitacao={amendment.numeroLicitacao}
/>
```

### Step 4: Verificar tipos no modelo `Amendment`

Abrir `lib/store.ts` (ou onde `Amendment` está definido) e confirmar que os campos existem na interface. Se algum campo não estiver na interface mas existir nos dados, adicionar como `?: string`.

Campos a verificar: `orgaoBeneficiario`, `municipio`, `cnpj`, `fornecedor`, `instrumentoJuridico`, `prazoAplicacao`, `codigoAplicacao`, `numeroLicitacao`.

### Step 5: Verificar no browser

- Abrir `http://localhost:3000/projetos`
- Clicar em qualquer emenda
- Na página de detalhes, após o "Fluxo de Execução Orçamentária", deve aparecer a seção "Detalhes Técnicos"
- Clicar no botão — a seção deve expandir suavemente mostrando os campos preenchidos
- Clicar novamente — deve recolher

### Step 6: Commit final

```bash
git add app/projetos/[id]/page.tsx
git commit -m "feat: adicionar acordeão de detalhes técnicos na página de emenda"
```

---

## Checklist Final

- [ ] Dropdown de setores em `/projetos` mostra apenas setores com emendas reais
- [ ] Selecionar um setor filtra corretamente a listagem
- [ ] "Limpar filtros" também limpa o setor selecionado (já funciona — não precisa mudar)
- [ ] Acordeão aparece na página de detalhes quando há campos técnicos preenchidos
- [ ] Acordeão NÃO aparece quando todos os campos técnicos estão vazios
- [ ] Acordeão expande/recolhe com animação suave
- [ ] Página de detalhes continua sendo Server Component (revalidate = 60 mantido)
- [ ] Nenhuma regressão: paginação, export Excel, filtros de status continuam funcionando
