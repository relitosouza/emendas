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
├── layout.tsx                        # Root layout — providers, fontes, metadata global
├── page.tsx                          # Home — dashboard público
├── sitemap.ts                        # Sitemap dinâmico (gerado automaticamente)
├── robots.ts                         # Robots.txt
├── projetos/
│   ├── layout.tsx                    # Metadata SEO da listagem
│   ├── page.tsx                      # Listagem de emendas (com filtros e paginação)
│   └── [id]/
│       ├── page.tsx                  # Detalhe da emenda (metadata dinâmica + JSON-LD)
│       └── relatorio/page.tsx        # Relatório imprimível (noindex)
├── admin/
│   ├── page.tsx                      # Login admin
│   ├── dashboard/page.tsx            # Painel de gestão (CRUD de emendas)
│   ├── wizard/page.tsx               # Assistente de criação de emenda
│   ├── cards/page.tsx                # Edição dos cards do dashboard
│   └── amendments/[id]/edit/page.tsx # Edição de emenda individual
└── api/
    ├── amendments/route.ts           # CRUD REST de emendas
    ├── amendments/import/route.ts    # Importação de CSV (limite 5 MB)
    ├── auth/route.ts                 # Login com proteção brute-force
    ├── financial/route.ts            # Dados financeiros
    ├── financial/import/route.ts     # Importação de execução financeira
    ├── financial/events/route.ts     # Eventos financeiros (empenhos, liquidações, pagamentos)
    ├── dashboard-cards/route.ts      # Cards configuráveis
    ├── sync-financeiro/route.ts      # Sincronização com portal de transparência de Osasco
    └── proxy-image/route.ts          # Proxy de imagens externas

data/                                 # Armazenamento JSON local (somente em desenvolvimento)
├── amendments.json
├── emendas-externas.json
├── financial.json
└── cards.json

lib/
├── db.ts                             # Pool de conexão PostgreSQL
├── json-storage.ts                   # Camada de storage (PostgreSQL em prod, JSON em dev)
├── sync-logic.ts                     # Lógica de sincronização financeira com Osasco
├── auth.ts / auth-edge.ts            # Autenticação e sessão (Node.js e Edge Runtime)
├── store.ts                          # Tipos TypeScript (Amendment)
├── amendments-utils.ts               # Helpers de parsing e formatação
├── status-mapper.ts                  # Normalização de status
├── sector-colors.ts                  # Cores por setor/categoria
└── utils.ts                          # Utilitário cn() para Tailwind

scripts/
├── db-migrate.ts                     # Migração do banco de dados PostgreSQL
├── cron-scheduler.ts                 # Agendador de sincronização (substitui cron da Vercel)
├── sync-financial-osasco.ts          # Execução manual de sincronização financeira
├── csv-to-json.ts                    # Utilitário de conversão CSV → JSON
└── csv-financial-to-json.ts          # Utilitário de conversão CSV financeiro → JSON
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
| Banco de dados | PostgreSQL (produção) · JSON local (desenvolvimento) |
| Agendamento | node-cron (substitui cron da Vercel) |
| Auth | Cookie HTTP-only + HMAC SHA-256 (sem JWT externo) |
| Deploy | Servidor próprio (Linux + Node.js) |

## Pré-requisitos

- Node.js 20+
- npm
- PostgreSQL 14+ (em produção)

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

# Rode em modo de desenvolvimento (usa arquivos JSON locais, sem banco)
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

```ini
# =====================================================
# Autenticação do admin (obrigatório)
# =====================================================
ADMIN_EMAIL="admin@osasco.sp.gov.br"
ADMIN_PASSWORD="sua-senha-segura"
ADMIN_SESSION_SECRET="string-aleatoria-longa-para-assinar-tokens"

# =====================================================
# Banco de dados PostgreSQL (obrigatório em produção)
# =====================================================
DATABASE_URL="postgresql://usuario:senha@host:5432/emendas"

# Habilitar SSL na conexão com o banco (opcional)
# DATABASE_SSL="true"
# Desativar verificação do certificado SSL (não recomendado)
# DATABASE_SSL_REJECT_UNAUTHORIZED="false"

# =====================================================
# URL pública do site (obrigatório para SEO e sitemap)
# =====================================================
NEXT_PUBLIC_SITE_URL="https://emendas.osasco.sp.gov.br"

# =====================================================
# Sincronização financeira (opcional)
# =====================================================
SYNC_SECRET="chave-secreta-para-sync-interno"
# SYNC_ALLOW_SELF_SIGNED="true"  # somente se o portal de Osasco usar cert autoassinado

# =====================================================
# Google Sheets (opcional — sistema funciona sem isso)
# =====================================================
GOOGLE_SERVICE_ACCOUNT_EMAIL="conta@projeto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="id-da-planilha"
```

> **Desenvolvimento local:** sem `DATABASE_URL`, o sistema usa arquivos JSON em `data/`. Ideal para desenvolvimento sem banco configurado.

> **Produção:** `DATABASE_URL` é obrigatório. Execute `npm run db:migrate` antes de iniciar pela primeira vez.

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o ESLint |
| `npm run db:migrate` | Cria as tabelas no PostgreSQL (executar uma vez na primeira instalação) |
| `npm run sync-financeiro` | Executa a sincronização financeira manualmente |
| `npm run cron` | Inicia o agendador de sincronização automática (diário às 09h BRT) |

## Configuração do banco de dados (produção)

Após configurar `DATABASE_URL` no `.env.local`, execute a migração para criar as tabelas:

```bash
npm run db:migrate
```

Tabelas criadas:
- `amendments` — emendas principais
- `external_amendments` — emendas importadas de CSV
- `financial_records` — execução financeira com histórico de eventos
- `dashboard_cards` — cards configuráveis do dashboard
- `sync_info` — controle da última sincronização

## Sincronização financeira automática

O sistema sincroniza automaticamente os dados financeiros com o [Portal de Transparência de Osasco](https://transparencia.osasco.sp.gov.br) diariamente às 09h (BRT).

### Opção 1 — Agendador interno (node-cron)

Indicado para execução via PM2 ou systemd:

```bash
# Com PM2
pm2 start "npm run cron" --name emendas-cron
pm2 save

# Direto
npm run cron
```

### Opção 2 — Crontab do sistema operacional

Adicione ao crontab (`crontab -e`):

```cron
0 9 * * * cd /caminho/para/o/projeto && npm run sync-financeiro
```

### Opção 3 — Endpoint HTTP (manual ou agendamento externo)

```bash
curl -X POST https://emendas.osasco.sp.gov.br/api/sync-financeiro \
  -H "Authorization: Bearer $SYNC_SECRET"
```

## Deploy em servidor próprio (Linux)

```bash
# Build da aplicação
npm run build

# Migrar banco (primeira vez)
npm run db:migrate

# Iniciar com PM2
pm2 start "npm run start" --name emendas-portal
pm2 start "npm run cron"  --name emendas-cron
pm2 save
pm2 startup
```

O servidor escuta na porta `3000` por padrão. Configure um proxy reverso (Nginx ou Apache) para expor na porta 80/443.

### Exemplo de configuração Nginx

```nginx
server {
    listen 80;
    server_name emendas.osasco.sp.gov.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name emendas.osasco.sp.gov.br;

    # Certificado SSL (Let's Encrypt ou certificado interno)
    ssl_certificate     /etc/ssl/certs/emendas.crt;
    ssl_certificate_key /etc/ssl/private/emendas.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SEO

O portal possui configuração completa de SEO:

- **Metadata dinâmica** por página (título e descrição gerados a partir dos dados reais)
- **Open Graph** e **Twitter Card** para compartilhamento em redes sociais
- **JSON-LD** (dados estruturados) — `GovernmentOrganization` global e `GovernmentService` por emenda
- **Sitemap dinâmico** acessível em `/sitemap.xml`
- **Robots.txt** configurado em `/robots.txt` (bloqueia `/admin/` e `/api/`)

> Configure `NEXT_PUBLIC_SITE_URL` com o domínio de produção para que o sitemap e as URLs canônicas sejam gerados corretamente.

## Licença

Projeto desenvolvido para a Prefeitura Municipal de Osasco. Uso interno e transparência pública.
