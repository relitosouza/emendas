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
├── layout.tsx                        # Root layout — providers, fontes, metadata
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
├── sector-colors.ts                  # Cores por setor/categoria
├── utils.ts                          # Utilitário cn() para Tailwind (class merging)
└── data.ts                           # Interface Project (tipo alternativo)
```

## Stack de tecnologia

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Componentes | shadcn/UI (Radix UI primitives) |
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
