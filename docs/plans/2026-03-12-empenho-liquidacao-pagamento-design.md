# Design: Histórico Detalhado de Empenho, Liquidação e Pagamento

**Data:** 2026-03-12
**Status:** Aprovado

## Contexto

O `FinancialRecord` atual armazena apenas 4 valores monetários simples (`empenhado`, `liquidado`, `pago`, `reservado`) por emenda. Este design expande o modelo para suportar histórico completo de eventos financeiros com identificação e múltiplas ocorrências por emenda.

## Estrutura de Dados

### Novos tipos de eventos

```ts
interface EmpenhoEvent {
  id: string;           // uuid gerado no create
  numero: string;       // ex: "2026NE000123"
  data: string;         // "DD/MM/AAAA"
  valor: string;        // "R$ 271.000,00"
  credor: string;       // nome do fornecedor/credor
  processo: string;     // número do processo administrativo
  descricao: string;    // histórico/objeto do empenho
  subEmpenho?: string;  // número de sub-empenho, se houver
  createdAt: string;    // ISO timestamp
}

interface LiquidacaoEvent {
  id: string;
  numero: string;       // ex: "2026NL000045"
  data: string;
  valor: string;
  descricao: string;
  createdAt: string;
}

interface PagamentoEvent {
  id: string;
  data: string;
  valor: string;
  banco: string;         // ex: "Banco do Brasil"
  agencia: string;
  documento: string;     // número do documento de pagamento
  ordemBancaria: string; // número da OB
  descricao: string;
  createdAt: string;
}
```

### `FinancialRecord` expandido (lib/json-storage.ts)

```ts
interface FinancialRecord {
  amendmentId: string;
  // campos existentes — mantidos para retrocompatibilidade
  empenhado: string;
  liquidado: string;
  pago: string;
  reservado: string;
  updatedAt: string;
  // novos arrays de histórico (undefined em registros antigos)
  empenhos?: EmpenhoEvent[];
  liquidacoes?: LiquidacaoEvent[];
  pagamentos?: PagamentoEvent[];
}
```

Os campos simples (`empenhado`/`liquidado`/`pago`) continuam como **totais acumulados**, recalculados automaticamente pela soma dos eventos ao salvar.

## API

### Endpoints existentes (sem alteração)

- `POST /api/financial` — atualiza campos simples (retrocompatível)
- `GET /api/amendments` — retorna emendas com merge financeiro (passará a incluir os arrays de eventos)

### Novos endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/financial/events` | Adiciona evento |
| `PUT` | `/api/financial/events` | Edita evento existente |
| `DELETE` | `/api/financial/events` | Remove evento |
| `GET` | `/api/financial/[amendmentId]` | Retorna FinancialRecord completo |

**Payload POST/PUT:**
```json
{
  "amendmentId": "112.17.15.2026",
  "tipo": "empenho",
  "event": {
    "numero": "2026NE000123",
    "data": "15/03/2026",
    "valor": "271.000,00",
    "credor": "Empresa XYZ Ltda",
    "processo": "123/2026",
    "descricao": "Aquisição de materiais",
    "subEmpenho": ""
  }
}
```

Ao adicionar/editar/remover um evento, o backend recalcula e persiste os totais acumulados.

## Interface Admin

Localização: **página de detalhes da emenda no admin** (`/admin/emendas/[id]`) — não no wizard de criação.

### Componente `FinancialHistory`
- Três abas: **Empenhos | Liquidações | Pagamentos**
- Cada aba: tabela com eventos + botão "Adicionar"
- Ações por linha: editar (modal) e excluir (confirmação)
- Resumo no topo: cards Reservado / Empenhado / Liquidado / Pago

## Interface Pública

Localização: **página de detalhes pública** da emenda.

### Seção "Execução Financeira"
- Cards de resumo com barra de progresso (% do valor autorizado)
- Timeline/accordion expansível por tipo (Empenhos, Liquidações, Pagamentos)
- Mensagem discreta quando não há eventos cadastrados

## Compatibilidade Retroativa

- Registros existentes em `financial.json` e Redis continuam funcionando sem migração
- Arrays `empenhos`, `liquidacoes`, `pagamentos` são `undefined` / `[]` em registros antigos
- A lógica de merge em `getAmendmentsFromSheet` passa a incluir os arrays no objeto retornado
