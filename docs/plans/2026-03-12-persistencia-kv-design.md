# Design: Persistência Durável com Vercel KV

**Data:** 2026-03-12
**Problema:** Dados financeiros e de emendas armazenados em `/tmp` do Vercel se perdem quando a função serverless fica inativa (cold start), revertendo status de `Empenhado` para `Reservado`.
**Solução:** Substituir `/tmp` por Vercel KV (Redis gerenciado) como camada de escrita durável.

---

## Escopo

Arquivos com persistência durável necessária:
- `financial.json` — dados de execução financeira (empenhado, liquidado, pago, reservado)
- `amendments.json` — emendas editáveis via UI admin

Fora do escopo:
- `emendas-externas.json` — dados estáticos, não editados via UI
- `cards.json` — dashboard cards, raramente alterados

---

## Arquitetura

### Fluxo de Leitura

```
GET /api/amendments ou /api/financial
  1. kv.get("financial") e kv.get("amendments")
  2. Se KV vazio → lê data/financial.json e data/amendments.json (bundle bundled)
  3. Retorna dados merged
```

### Fluxo de Escrita

```
POST /api/financial/import (CSV upload) ou POST /api/amendments (edição UI)
  1. Lê estado atual do KV (ou bundle se KV vazio)
  2. Aplica merge/update
  3. kv.set("financial" | "amendments", dadosAtualizados)
  4. Retorna sucesso
```

### Camadas de Storage

| Camada | Onde | Quando usado |
|--------|------|--------------|
| Vercel KV | Redis gerenciado Vercel | Produção — leitura e escrita |
| Bundle `data/*.json` | Compilado no deploy | Fallback somente-leitura (KV vazio) |
| Disco local `data/*.json` | Sistema de arquivos local | Desenvolvimento local |

---

## Implementação

### Dependência

```bash
npm install @vercel/kv
```

### Arquivo alterado: `lib/json-storage.ts`

Substituir a lógica de `/tmp` por Vercel KV:

```typescript
import { kv } from "@vercel/kv";

const IS_VERCEL = !!process.env.VERCEL;

function filenameToKey(filename: string): string {
  return filename.replace(".json", ""); // "financial.json" → "financial"
}

async function readJsonFile<T>(filename: string): Promise<T[]> {
  if (IS_VERCEL) {
    const data = await kv.get<T[]>(filenameToKey(filename));
    if (data) return data;
    // Fallback: bundle (primeira vez após deploy)
  }
  // Dev local: lê do disco
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

### Chaves no KV

| Chave | Tipo | Conteúdo |
|-------|------|----------|
| `financial` | `FinancialRecord[]` | Dados de execução financeira |
| `amendments` | `Amendment[]` | Emendas editadas via UI |

### Sem alterações necessárias em:
- `app/api/financial/route.ts`
- `app/api/financial/import/route.ts`
- `app/api/amendments/route.ts`
- Componentes de UI

---

## Configuração no Vercel

1. Dashboard → Storage → **Create KV Store** → vincular ao projeto
2. Env vars injetadas automaticamente: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`
3. Para dev local: copiar as env vars para `.env.local`

---

## Migração de Dados (Zero Downtime)

```
1. Deploy com KV configurado
   → KV vazio, sistema usa bundle como fallback (correto)

2. Admin faz upload do CSV financeiro mais recente via /admin
   → kv.set("financial", dadosAtualizados) — KV populado

3. Operação normal
   → Toda escrita persiste no KV entre cold starts
```

**Não é necessário script de migração.** O bundle serve como estado inicial válido.

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| KV vazio + bundle desatualizado | Atualizar `data/financial.json` no bundle antes de cada deploy via `npx tsx scripts/csv-financial-to-json.ts` |
| Limite free tier (3.000 req/dia) | Uso admin restrito — bem abaixo do limite |
| Falha do KV em produção | Fallback para bundle garante leitura (escrita falha com erro explícito) |

---

## Critérios de Aceitação

- [ ] Upload de CSV financeiro persiste após cold start do Vercel
- [ ] Edição de emenda via UI persiste após cold start
- [ ] Desenvolvimento local continua funcionando sem KV (usa disco)
- [ ] Fallback para bundle quando KV está vazio funciona corretamente
- [ ] Nenhuma mudança visível na UI ou nas APIs públicas
