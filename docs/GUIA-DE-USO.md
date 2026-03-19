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
