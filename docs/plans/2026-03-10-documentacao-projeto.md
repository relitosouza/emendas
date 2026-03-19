# Documentação do Portal de Emendas — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Criar documentação completa do Portal de Emendas da Prefeitura de Osasco, explicando o que é o projeto, sua arquitetura e como usar o sistema.

**Architecture:** A documentação será escrita em Markdown e organizada em dois arquivos: um `README.md` completo na raiz do projeto (substituindo o boilerplate do Next.js) e um guia de uso detalhado em `docs/GUIA-DE-USO.md`. Não haverá código novo — apenas arquivos `.md` criados/substituídos.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Zod, React Hook Form, JSON local como storage principal (com fallback para Google Sheets), deploy via Vercel.

---

## Task 1: Reescrever o README.md raiz com visão geral do projeto

**Files:**
- Modify: `README.md` (substituição completa do boilerplate Next.js)

**Step 1: Substituir o conteúdo do README.md**

Reescrever `/e/projetos/portal-de-emendas/README.md` com o seguinte conteúdo:

```markdown
# Portal de Emendas — Prefeitura Municipal de Osasco

Portal público de transparência e gestão de emendas parlamentares da Câmara Municipal de Osasco (SP). Permite que cidadãos acompanhem em tempo real a destinação de recursos públicos, o status de execução de cada emenda e os indicadores financeiros consolidados.

## O que é este projeto?

O **Portal de Emendas** é uma aplicação web desenvolvida em Next.js que serve como interface de transparência entre a Câmara Municipal de Osasco e a população. Ele exibe:

- **Dashboard público** com indicadores financeiros (reservado, empenhado, liquidado e pago)
- **Listagem paginada** de todas as emendas com filtros por setor, status e busca textual
- **Detalhe de cada emenda** com timeline de status, dados financeiros e informações técnicas
- **Relatório imprimível** por emenda (rota `/projetos/[id]/relatorio`)
- **Painel administrativo** protegido por autenticação para cadastro, edição e exclusão de emendas

## Arquitetura

```
app/
├── page.tsx                          # Home — dashboard público
├── projetos/
│   ├── page.tsx                      # Listagem de emendas (com filtros e paginação)
│   └── [id]/
│       ├── page.tsx                  # Detalhe da emenda
│       └── relatorio/page.tsx        # Relatório imprimível
├── admin/
│   ├── page.tsx                      # Login admin
│   ├── dashboard/page.tsx            # Painel de gestão (CRUD de emendas)
│   ├── wizard/page.tsx               # Assistente de criação de emenda
│   ├── cards/page.tsx                # Edição dos cards do dashboard
│   └── amendments/[id]/edit/page.tsx # Edição de emenda individual
└── api/
    ├── amendments/route.ts           # CRUD REST de emendas
    ├── amendments/import/route.ts    # Importação de CSV
    ├── auth/route.ts                 # Login com proteção brute-force
    ├── financial/route.ts            # Dados financeiros
    ├── financial/import/route.ts     # Importação de execução financeira
    ├── dashboard-cards/route.ts      # Cards configuráveis
    └── proxy-image/route.ts          # Proxy de imagens externas

data/                                 # Armazenamento JSON local
├── amendments.json                   # Emendas cadastradas via admin
├── emendas-externas.json             # Emendas importadas de CSV
├── financial.json                    # Execução financeira separada
└── cards.json                        # Cards do dashboard

lib/                                  # Utilitários e camada de dados
├── json-storage.ts                   # CRUD em arquivos JSON (storage principal)
├── google-sheets.ts                  # Integração opcional com Google Sheets
├── auth.ts / auth-edge.ts            # Autenticação e sessão
├── store.ts                          # Tipos TypeScript (Amendment)
├── amendments-utils.ts               # Helpers de parsing e formatação
├── status-mapper.ts                  # Normalização de status
└── sector-colors.ts                  # Cores por setor/categoria
```

## Stack de tecnologia

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Formulários | React Hook Form + Zod 4 |
| Ícones | Material Symbols (Google Fonts) + Lucide React |
| Gráficos | Recharts |
| Mapas | React Leaflet |
| Storage | JSON local (`data/`) em dev; `/tmp/data` na Vercel |
| Auth | Cookie HTTP-only + HMAC SHA-256 (sem JWT externo) |
| Deploy | Vercel |

## Pré-requisitos

- Node.js 18+
- npm (ou yarn/pnpm/bun)

## Instalação e execução local

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd portal-de-emendas

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais (veja seção "Variáveis de Ambiente")

# Rode em modo de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```ini
# Autenticação do admin (obrigatório)
ADMIN_EMAIL="admin@osasco.sp.gov.br"
ADMIN_PASSWORD="sua-senha-segura"
ADMIN_SESSION_SECRET="string-aleatoria-longa-para-assinar-tokens"

# Google Sheets (opcional — sistema funciona sem isso)
GOOGLE_SERVICE_ACCOUNT_EMAIL="conta@projeto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="id-da-planilha"
```

> Sem `ADMIN_EMAIL` e `ADMIN_PASSWORD` o login admin não funciona. O sistema de armazenamento JSON local funciona sem Google Sheets.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o ESLint |

## Deploy na Vercel

Consulte [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) para instruções detalhadas sobre deploy e configuração da `GOOGLE_PRIVATE_KEY` na Vercel.

## Documentação adicional

- [`docs/GUIA-DE-USO.md`](./docs/GUIA-DE-USO.md) — Guia completo de uso do sistema (público e admin)
- [`GOOGLE_SHEETS_SETUP.md`](./GOOGLE_SHEETS_SETUP.md) — Configuração da integração com Google Sheets
- [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) — Troubleshooting de deploy na Vercel

## Licença

Projeto desenvolvido para a Prefeitura Municipal de Osasco. Uso interno e transparência pública.
```

**Step 2: Verificar que o arquivo foi criado corretamente**

```bash
head -5 README.md
```
Esperado: linha 1 começa com `# Portal de Emendas`

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with full project overview and architecture"
```

---

## Task 2: Criar guia de uso detalhado em `docs/GUIA-DE-USO.md`

**Files:**
- Create: `docs/GUIA-DE-USO.md`

**Step 1: Criar o arquivo do guia**

Criar `/e/projetos/portal-de-emendas/docs/GUIA-DE-USO.md` com o seguinte conteúdo:

```markdown
# Guia de Uso — Portal de Emendas

Este guia cobre todas as funcionalidades do Portal de Emendas da Prefeitura Municipal de Osasco, tanto para o usuário público quanto para o administrador.

---

## Sumário

1. [Área Pública](#área-pública)
   - [Home — Dashboard](#home--dashboard)
   - [Explorar Emendas](#explorar-emendas)
   - [Detalhe de uma Emenda](#detalhe-de-uma-emenda)
   - [Relatório Imprimível](#relatório-imprimível)
2. [Área Administrativa](#área-administrativa)
   - [Login](#login)
   - [Painel de Gestão (Dashboard Admin)](#painel-de-gestão-dashboard-admin)
   - [Cadastrar Nova Emenda (Wizard)](#cadastrar-nova-emenda-wizard)
   - [Editar uma Emenda](#editar-uma-emenda)
   - [Gerenciar Cards do Dashboard](#gerenciar-cards-do-dashboard)
   - [Importar CSV de Emendas](#importar-csv-de-emendas)
   - [Importar Execução Financeira](#importar-execução-financeira)
3. [Dados e Storage](#dados-e-storage)
4. [Status das Emendas](#status-das-emendas)
5. [Categorias / Setores](#categorias--setores)

---

## Área Pública

### Home — Dashboard

**URL:** `/`

A página inicial exibe o panorama geral de todas as emendas cadastradas:

- **Barra de busca**: Digite e pressione Enter (ou clique na seta) para buscar por autor, título ou valor e ser redirecionado para a listagem filtrada.
- **Card "Emendas aprovadas"**: Mostra o valor total aprovado, quantidade de emendas, percentual empenhado e um círculo animado indicando o percentual pago. Atualiza automaticamente a cada 2 minutos.
- **Cards financeiros** (Reservado / Empenhado / Liquidado / Pago): Clicáveis — ao clicar, redireciona para `/projetos` filtrado por aquele estágio financeiro.
- **Atividades recentes**: As 6 emendas cadastradas mais recentemente, ordenadas por data de criação.
- **Ranking de autores**: Top 5 vereadores/responsáveis com mais emendas. Clique no nome para ver as emendas daquele autor.
- **Investimento por setor**: Barras comparativas de valor por setor/categoria. Clique no setor para filtrar as emendas.

---

### Explorar Emendas

**URL:** `/projetos`

Lista todas as emendas com filtros combinados:

| Filtro | Como usar |
|--------|-----------|
| **Busca textual** | Digita no campo "Buscar por número, título ou autor..." — filtra em tempo real |
| **Setor** | Dropdown com todos os setores/categorias presentes nos dados |
| **Status** | Dropdown com todos os estágios possíveis (ver seção Status) |
| **Filtro financeiro** | Vem da home ao clicar nos cards (ex: `?filtro=pago`). Aparece como badge azul. |
| **Limpar filtros** | Botão com ícone de filtro riscado |
| **Exportar Excel** | Gera um arquivo `.csv` (com BOM UTF-8) com todas as emendas visíveis no momento |

A listagem é **paginada** (9 itens por página). A paginação aparece apenas quando há mais de 9 resultados.

Cada card de emenda mostra: título, status, setor, autor (com foto se for vereador reconhecido), valor alocado e barra de progresso de execução.

---

### Detalhe de uma Emenda

**URL:** `/projetos/[id]`

Página com todas as informações da emenda:

- **Timeline de status**: Mostra os 9 estágios possíveis e qual o atual, com ícone de check nos estágios completados.
- **Dados financeiros**: Tabela com Valor Autorizado, Reservado, Empenhado, Liquidado e Pago, cada um com barra de progresso relativa ao valor total.
- **Dados de identificação**: Número da emenda, tipo, fundamento legal, âmbito, autor, vereador responsável.
- **Detalhes técnicos** (accordion): Município, CNPJ, função, subfunção, órgão beneficiário, localidade beneficiada, instrumento jurídico, fornecedor, licitação, prazo de aplicação, etc.
- **Botão "Relatório"**: Leva para `/projetos/[id]/relatorio`.
- **Botão "Compartilhar"**: Gera um card visual da emenda (via `html2canvas`) para compartilhar como imagem.

---

### Relatório Imprimível

**URL:** `/projetos/[id]/relatorio`

Versão otimizada para impressão com todos os dados da emenda organizados em seções:
- Identificação
- Responsável
- Localização e Destino
- Execução Financeira
- Acompanhamento (status e datas)

Contém um botão "Imprimir" que aciona `window.print()`.

---

## Área Administrativa

> **Acesso restrito** — protegido por autenticação via cookie HTTP-only.
> Middleware em `middleware.ts` bloqueia `/admin/dashboard/*`, `/admin/wizard/*`, `/admin/amendments/*` e `/admin/cards/*` sem sessão válida.

### Login

**URL:** `/admin`

Formulário com validação Zod + React Hook Form:
- E-mail e senha configurados nas variáveis de ambiente (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- **Proteção brute-force**: após 5 tentativas erradas, o IP/cookie é bloqueado por 15 minutos
- Sessão dura 8 horas (cookie `admin-session` HTTP-only)

---

### Painel de Gestão (Dashboard Admin)

**URL:** `/admin/dashboard`

Lista todas as emendas com ações administrativas:

- **Busca**: filtra por título, autor, número, setor ou status
- **Editar**: botão de lápis leva para `/admin/amendments/[id]/edit`
- **Excluir**: botão de lixeira abre confirmação modal e deleta via `DELETE /api/amendments?id=[id]`
- **Atualizar dados financeiros**: botão de dinheiro abre modal para inserir manualmente empenhado, liquidado e pago de uma emenda específica
- **Importar CSV**: botão no topo abre modal de importação (ver seção específica)
- **Logout**: link para encerrar a sessão

---

### Cadastrar Nova Emenda (Wizard)

**URL:** `/admin/wizard`

Formulário multi-etapa para criar uma emenda completa. Campos incluídos:

| Seção | Campos principais |
|-------|------------------|
| Identificação | Município, CNPJ, Responsável, Cargo |
| Emenda | Tipo, Fundamento Legal, Âmbito, Autor, Número |
| Objeto | Objeto, Finalidade, Função, Subfunção, Destinação |
| Beneficiário | Órgão Beneficiário, Localidade, Instrumento Jurídico |
| Execução | Fornecedor, Licitação, Prazo, Categoria |
| Financeiro | Valor, Valor Autorizado, % RCL, Conta, Reservado, Empenhado, Liquidado, Pago |
| Controle | Status, Prioridade, Portal Transparência, Divulgação, Link, Monitoramento |

Ao salvar, a emenda é enviada para `POST /api/amendments` e armazenada em `data/amendments.json`.

---

### Editar uma Emenda

**URL:** `/admin/amendments/[id]/edit`

Mesmos campos do Wizard, mas pré-preenchidos com os dados existentes. Salva via `PUT /api/amendments` com o ID da emenda.

---

### Gerenciar Cards do Dashboard

**URL:** `/admin/cards`

Interface drag-and-drop para reordenar e editar os cards exibidos em destaque no dashboard público. Cada card tem: label, valor, ícone, cor e descrição. Salvo via `POST /api/dashboard-cards`.

---

### Importar CSV de Emendas

Acessível via botão "Importar" no Dashboard Admin.

**Formato esperado** (CSV com ponto-e-vírgula como separador, cabeçalhos na 1ª linha):

```
ID;Data Criação;Município;CNPJ;Nome Responsável;Cargo Responsável;...;Objeto;Finalidade;...;Valor;Status
```

> A lista completa de colunas está em [`GOOGLE_SHEETS_SETUP.md`](../GOOGLE_SHEETS_SETUP.md).

Ao importar:
1. Seleciona o arquivo `.csv`
2. Uma prévia das primeiras linhas é exibida
3. Confirma a importação — os dados são enviados para `POST /api/amendments/import`
4. As emendas são adicionadas ao `data/amendments.json`

---

### Importar Execução Financeira

**Endpoint:** `POST /api/financial/import`

CSV com colunas: `ID Emenda;Empenhado;Liquidado;Pago;Data Ultima Atualizacao`

Os valores importados são armazenados em `data/financial.json` e mesclados automaticamente nas emendas ao ler via `GET /api/amendments`.

---

## Dados e Storage

O sistema usa **arquivos JSON locais** como storage principal:

| Arquivo | Conteúdo |
|---------|---------|
| `data/amendments.json` | Emendas criadas/editadas pelo admin |
| `data/emendas-externas.json` | Emendas importadas via CSV |
| `data/financial.json` | Dados de execução financeira (empenhado, liquidado, pago, reservado) |
| `data/cards.json` | Cards configuráveis do dashboard |

**Na Vercel:** como o filesystem é read-only, os arquivos são escritos em `/tmp/data/` (efêmero entre deploys). Os dados em `data/` são commitados no repositório e servem como estado inicial.

**Integração Google Sheets (opcional):** O arquivo `lib/google-sheets.ts` contém o código para ler/escrever na planilha, mas `lib/json-storage.ts` é o storage ativo. Para ativar o Google Sheets, configure as variáveis de ambiente conforme `GOOGLE_SHEETS_SETUP.md`.

---

## Status das Emendas

| Status | Progresso | Cor |
|--------|-----------|-----|
| Não Iniciada | 0% | Cinza |
| Em Análise | 12% | Âmbar |
| Elaboração | 25% | Índigo |
| Viabilização | 37% | Roxo |
| Contratação | 50% | Azul |
| Execução | 75% | Verde |
| Executada | 100% | Azul |
| Prestação de Contas | 100% | Teal |
| Cancelada | 0% | Vermelho |

O mapeamento de status é feito em `lib/status-mapper.ts`. Valores brutos do CSV (ex: `"Não iniciada"`, `"NAO_INICIADA"`) são normalizados para os valores canônicos acima.

---

## Categorias / Setores

As categorias seguem a classificação funcional do orçamento público federal (SIAFI):

| Código | Nome |
|--------|------|
| 8 | ASSISTÊNCIA SOCIAL |
| 10 | SAÚDE |
| 12 | EDUCAÇÃO |
| 13 | CULTURA |
| 15 | URBANISMO |
| 16 | HABITAÇÃO |
| 27 | DESPORTO E LAZER |
| ... | (lista completa em `lib/amendments-utils.ts` → `CATEGORY_MAP`) |

Cada setor tem uma paleta de cores própria definida em `lib/sector-colors.ts`, usada nos badges e ícones de toda a interface.
```

**Step 2: Verificar que o arquivo foi criado**

```bash
head -5 docs/GUIA-DE-USO.md
```
Esperado: linha 1 começa com `# Guia de Uso`

**Step 3: Commit**

```bash
git add docs/GUIA-DE-USO.md
git commit -m "docs: add comprehensive usage guide for public and admin areas"
```

---

## Task 3: Atualizar referências no README existente e verificação final

**Files:**
- Modify: `README.md` (verificação de links internos)

**Step 1: Verificar que os links internos do README apontam para arquivos existentes**

```bash
ls docs/GUIA-DE-USO.md GOOGLE_SHEETS_SETUP.md VERCEL_DEPLOY.md
```
Esperado: todos os 3 arquivos existem.

**Step 2: Verificar build não quebra**

```bash
npm run lint
```
Esperado: zero erros de lint (os arquivos `.md` não são processados pelo ESLint Next.js).

**Step 3: Commit final de verificação (se lint passou sem problemas)**

```bash
git add README.md
git commit -m "docs: verify internal links and finalize documentation"
```

> Se não houver alterações no README nesta etapa (Task 1 já o deixou correto), pule o `git add` e o commit.
