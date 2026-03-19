# Persistência Durável com Vercel KV — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Substituir o armazenamento efêmero em `/tmp` do Vercel por Vercel KV (Redis), garantindo que dados financeiros e de emendas persistam entre cold starts.

**Architecture:** `lib/json-storage.ts` é a única camada de storage — todas as leituras e escritas passam por ele. A refatoração troca `fs.readFile`/`fs.writeFile` em `/tmp` por `kv.get`/`kv.set` quando `IS_VERCEL=true`. Em dev local, o comportamento com disco permanece inalterado. `app/api/financial/import/route.ts` tem lógica de storage duplicada que será consolidada em `json-storage.ts`.

**Tech Stack:** Next.js 16, `@vercel/kv` (Redis), TypeScript

---

### Task 1: Instalar `@vercel/kv` e atualizar `.env.example`

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.example`

**Step 1: Instalar a dependência**

```bash
npm install @vercel/kv
```

Expected: `@vercel/kv` aparece em `dependencies` no `package.json`.

**Step 2: Adicionar variáveis ao `.env.example`**

Adicionar ao final de `.env.example`:

```
# Vercel KV (obrigatório em produção)
# Obtidas no dashboard: Vercel → Storage → seu KV store → .env.local
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

**Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: add @vercel/kv dependency"
```

---

### Task 2: Refatorar `lib/json-storage.ts` para usar Vercel KV

**Files:**
- Modify: `lib/json-storage.ts`

**Contexto:** O arquivo atual usa `IS_VERCEL ? "/tmp/data" : BUNDLED_DATA_DIR` para decidir onde ler/escrever. A refatoração substitui o branch `/tmp` por KV. O branch local (disco) permanece para desenvolvimento.

**Step 1: Substituir o conteúdo de `lib/json-storage.ts`**

Substituir as primeiras 49 linhas (seção File Paths + Helpers) pelo novo código:

```typescript
import fs from "fs/promises";
import path from "path";
import { kv } from "@vercel/kv";
import { Amendment } from "@/lib/store";

// =====================================================
// Storage Strategy
// =====================================================

const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");

function bundledPath(filename: string) {
    return path.join(BUNDLED_DATA_DIR, filename);
}

function filenameToKey(filename: string): string {
    return filename.replace(".json", "");
}

// =====================================================
// Helpers
// =====================================================

async function readJsonFile<T>(filename: string): Promise<T[]> {
    if (IS_VERCEL) {
        const data = await kv.get<T[]>(filenameToKey(filename));
        if (data) return data;
        // Fallback: bundle bundled no deploy (primeira vez após deploy)
    }
    try {
        const content = await fs.readFile(bundledPath(filename), "utf-8");
        return JSON.parse(content);
    } catch {
        return [];
    }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
    if (IS_VERCEL) {
        await kv.set(filenameToKey(filename), data);
        return;
    }
    // Dev local: escreve no disco
    await fs.mkdir(BUNDLED_DATA_DIR, { recursive: true });
    await fs.writeFile(bundledPath(filename), JSON.stringify(data, null, 2), "utf-8");
}
```

**O que remover:**
- `const WRITABLE_DATA_DIR = IS_VERCEL ? "/tmp/data" : BUNDLED_DATA_DIR;`
- `function writablePath(filename: string) { ... }`
- A lógica de `try writablePath → catch bundledPath` em `readJsonFile`
- A lógica de `fs.mkdir(WRITABLE_DATA_DIR)` em `writeJsonFile`

**O restante do arquivo** (funções `upsertFinancialData`, `appendAmendmentToSheet`, `deleteAmendmentFromSheet`, `updateAmendmentInSheet`, `getAmendmentsFromSheet`, `getDashboardCards`, `saveDashboardCards`, `getAuthClient`) permanece **sem alterações**.

**Step 2: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Expected: 0 erros.

**Step 3: Commit**

```bash
git add lib/json-storage.ts
git commit -m "feat: use Vercel KV for durable storage instead of /tmp"
```

---

### Task 3: Consolidar `app/api/financial/import/route.ts`

**Files:**
- Modify: `app/api/financial/import/route.ts`

**Contexto:** Este arquivo tem sua própria cópia das funções `readExistingFinancial`, `parseCSV` e lógica de escrita em `/tmp` — completamente duplicadas de `json-storage.ts`. Isso significa que mesmo após a Task 2, o import de CSV ainda escreveria em `/tmp`. A correção é fazer este handler usar as funções de `json-storage.ts`.

**Step 1: Substituir `app/api/financial/import/route.ts`**

O novo arquivo fica assim (a lógica de negócio — merge de CSV — permanece, apenas o storage muda):

```typescript
import { NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { readJsonFile, writeJsonFile, FINANCIAL_FILE } from "@/lib/json-storage";

interface FinancialRecord {
    amendmentId: string;
    empenhado: string;
    liquidado: string;
    pago: string;
    reservado: string;
    updatedAt: string;
}

function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const next = content[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === "," || char === ";") {
                row.push(current.trim());
                current = "";
            } else if (char === "\n" || (char === "\r" && next === "\n")) {
                row.push(current.trim());
                current = "";
                if (row.some((cell) => cell !== "")) {
                    rows.push(row);
                }
                row = [];
                if (char === "\r") i++;
            } else {
                current += char;
            }
        }
    }

    if (current || row.length > 0) {
        row.push(current.trim());
        if (row.some((cell) => cell !== "")) {
            rows.push(row);
        }
    }

    return rows;
}

export async function POST(request: Request) {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Arquivo CSV obrigatório" }, { status: 400 });
        }

        const content = await file.text();
        const rows = parseCSV(content);

        if (rows.length < 2) {
            return NextResponse.json({ error: "CSV vazio ou sem dados" }, { status: 400 });
        }

        const dataRows = rows.slice(1);
        const now = new Date().toISOString();

        const csvRecords: FinancialRecord[] = dataRows.map((row) => ({
            amendmentId: row[0] || "",
            empenhado: row[1] || "0",
            liquidado: row[2] || "0",
            pago: row[3] || "0",
            reservado: row[4] || "0",
            updatedAt: row[5] || now,
        }));

        // Merge with existing — agora usa json-storage (KV em prod, disco em dev)
        const existing = await readJsonFile<FinancialRecord>(FINANCIAL_FILE);

        const existingMap = new Map<string, FinancialRecord>();
        for (const rec of existing) {
            existingMap.set(rec.amendmentId, rec);
        }

        let updated = 0;
        let added = 0;

        for (const rec of csvRecords) {
            if (existingMap.has(rec.amendmentId)) {
                updated++;
            } else {
                added++;
            }
            existingMap.set(rec.amendmentId, rec);
        }

        const merged = Array.from(existingMap.values());
        await writeJsonFile(FINANCIAL_FILE, merged);

        return NextResponse.json({
            success: true,
            updated,
            added,
            total: merged.length,
        });
    } catch (error) {
        console.error("Error importing financial CSV:", error);
        const message = error instanceof Error ? error.message : "Falha ao importar CSV financeiro";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
```

**Atenção:** Para isso funcionar, `readJsonFile` e `writeJsonFile` precisam ser **exportadas** de `lib/json-storage.ts`. Verificar se estão exportadas — se não, adicionar `export` antes de `async function readJsonFile` e `async function writeJsonFile`.

**Step 2: Verificar que o TypeScript compila**

```bash
npx tsc --noEmit
```

Expected: 0 erros.

**Step 3: Commit**

```bash
git add app/api/financial/import/route.ts lib/json-storage.ts
git commit -m "refactor: consolidate financial import to use json-storage KV layer"
```

---

### Task 4: Verificação local (dev sem KV)

**Files:** Nenhum — apenas testes manuais.

**Contexto:** Em dev local, `IS_VERCEL` é `false`, então o código usa disco. Verificar que nada quebrou.

**Step 1: Subir o servidor de dev**

```bash
npm run dev
```

Expected: servidor sobe sem erros em `http://localhost:3000`.

**Step 2: Verificar leitura das emendas**

Abrir `http://localhost:3000` — a lista de emendas deve aparecer normalmente (lendo de `data/amendments.json`).

**Step 3: Verificar import de CSV financeiro**

1. Fazer login em `http://localhost:3000/admin`
2. Ir para a seção de importação financeira
3. Fazer upload de `Emendas - ExecucaoFinanceira.csv` (arquivo na raiz do projeto)
4. Expected: resposta `{ success: true, updated: N, added: N, total: N }`
5. Verificar que `data/financial.json` foi atualizado no disco

**Step 4: Verificar edição de emenda**

1. Editar uma emenda via UI admin
2. Recarregar a página
3. Expected: edição persiste (lida do disco em dev)

---

### Task 5: Configurar Vercel KV no dashboard e fazer deploy

**Files:** Nenhum.

**Contexto:** Esta task é operacional — não envolve código. Executar no dashboard do Vercel e via CLI.

**Step 1: Criar KV Store no Vercel**

1. Acessar vercel.com → projeto `portal-de-emendas`
2. Aba **Storage** → **Create Database** → **KV**
3. Nome sugerido: `portal-emendas-kv`
4. Clicar **Connect** para vincular ao projeto
5. As env vars são injetadas automaticamente em todos os environments (Production, Preview, Development)

**Step 2: Copiar env vars para dev local**

No dashboard do KV store → aba **.env.local** → copiar e colar em `.env.local` do projeto:

```
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

**Não commitar `.env.local`** (já está no `.gitignore`).

**Step 3: Fazer deploy**

```bash
git push origin master
```

Aguardar o deploy completar no dashboard do Vercel.

**Step 4: Verificar em produção**

1. Acessar o portal em produção → emendas aparecem (bundle como fallback)
2. Login admin → fazer upload do CSV financeiro
3. Expected: `{ success: true, ... }`
4. Aguardar 5 minutos (simular cold start re-acessando)
5. Verificar que os dados financeiros ainda estão corretos (não reverteram para Reservado)

---

## Critérios de Aceitação

- [ ] Upload de CSV financeiro persiste após cold start (dados não revertem)
- [ ] Edição de emenda via UI admin persiste após cold start
- [ ] Dev local continua funcionando sem KV (usa disco)
- [ ] Fallback para bundle quando KV está vazio funciona
- [ ] TypeScript compila sem erros (`npx tsc --noEmit`)
- [ ] Nenhuma mudança visível na UI pública
