# Design: Melhorias Funcionais — Filtro Dinâmico e Detalhes Técnicos

**Data:** 2026-03-08
**Páginas afetadas:** `/projetos` e `/projetos/[id]`
**Prioridade:** Funcional

---

## Contexto

O Portal de Emendas da Prefeitura de Osasco exibe emendas parlamentares com dados financeiros e de execução. Foram identificados dois problemas funcionais prioritários:

1. O filtro de setores na página de listagem tem apenas 5 opções hardcoded, mas o sistema suporta 20+ categorias.
2. A página de detalhes não exibe campos técnicos relevantes que existem no banco de dados.

---

## Mudança 1: Filtro Dinâmico de Setores (`app/projetos/page.tsx`)

### Problema
O `<select>` de setores tem opções fixas: Saúde, Educação, Infraestrutura, Segurança, Cultura. Se as emendas carregadas pertencem a outros setores (ex: Urbanismo, Transporte), esses setores não aparecem no filtro.

### Solução
Gerar a lista de setores dinamicamente a partir dos dados carregados via API:

1. Após o fetch das emendas, derivar os setores únicos presentes usando o `CATEGORY_MAP` já existente no arquivo.
2. Ordenar alfabeticamente.
3. Popular o `<select>` apenas com setores que têm ao menos 1 emenda.
4. O filtro continua funcionando da mesma forma — apenas a fonte dos dados muda.

### Implementação
- Adicionar `useMemo` ou cálculo derivado após `setProjects`:
  ```ts
  const availableSectors = useMemo(() => {
    const sectors = new Set(projects.map(p => p.sector).filter(Boolean));
    return Array.from(sectors).sort();
  }, [projects]);
  ```
- Substituir as `<option>` hardcoded por `availableSectors.map(...)`.

---

## Mudança 2: Acordeão de Detalhes Técnicos (`app/projetos/[id]/page.tsx`)

### Problema
Campos técnicos relevantes presentes no modelo de dados não são exibidos na tela de detalhes:
- `orgaoBeneficiario`, `municipio`, `cnpj`, `fornecedor`
- `instrumentoJuridico`, `prazoAplicacao`, `codigoAplicacao`, `numeroLicitacao`

### Solução
Adicionar uma nova `<section>` colapsável (acordeão) após a seção "Fluxo de Execução Orçamentária", na coluna esquerda:

- Botão toggle com ícone de seta (expand/collapse).
- Ao expandir: grade 2 colunas com os campos técnicos.
- Campos vazios/nulos são omitidos automaticamente.
- Estado controlado por `useState<boolean>` local.
- Transição CSS suave (`transition-all`, `overflow-hidden`).

### Campos exibidos (se preenchidos)
| Campo | Fonte |
|-------|-------|
| Órgão Beneficiário | `amendment.orgaoBeneficiario` |
| Município | `amendment.municipio` |
| CNPJ | `amendment.cnpj` |
| Fornecedor | `amendment.fornecedor` |
| Instrumento Jurídico | `amendment.instrumentoJuridico` |
| Prazo de Aplicação | `amendment.prazoAplicacao` |
| Código de Aplicação | `amendment.codigoAplicacao` |
| Nº Licitação | `amendment.numeroLicitacao` |

### Implementação
```tsx
const [showDetails, setShowDetails] = useState(false);

// Após a seção de Fluxo Financeiro:
<section className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
  <button onClick={() => setShowDetails(v => !v)} className="...">
    Detalhes Técnicos
    <span className={`material-symbols-outlined transition-transform ${showDetails ? 'rotate-180' : ''}`}>
      expand_more
    </span>
  </button>
  {showDetails && (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {/* campos renderizados condicionalmente */}
    </div>
  )}
</section>
```

---

## Não está no escopo

- Refatoração de `CATEGORY_MAP` duplicado (será tratado separadamente).
- Refatoração de `VEREADORES_PHOTOS` duplicado (será tratado separadamente).
- Nenhuma alteração na API ou no modelo de dados.

---

## Critérios de Sucesso

1. Dropdown de setores em `/projetos` mostra exatamente os setores presentes nos dados carregados.
2. Selecionando um setor que antes não aparecia, o filtro funciona corretamente.
3. Na página de detalhes, o acordeão expande/colapsa ao clicar.
4. Campos vazios não aparecem no acordeão.
5. Nenhuma regressão nas funcionalidades existentes (filtros, paginação, export).
