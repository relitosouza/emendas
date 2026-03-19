# Design: Portal Dinâmico

**Data:** 2026-03-05
**Arquivo principal afetado:** `app/page.tsx`
**Novo arquivo:** `hooks/useCountUp.ts`

---

## Objetivo

Tornar o portal visualmente dinâmico removendo hardcodes, adicionando feedback de atualização e animando os valores financeiros.

---

## A — Total calculado dinamicamente

### Problema
`VALOR_DESTINADO = 27_081_713.01` está hardcoded em `app/page.tsx:14` e o H2 repete o mesmo valor em `app/page.tsx:187`. Se os dados mudarem no Google Sheets, o total exibido nunca atualiza.

### Solução
- Remover a constante `VALOR_DESTINADO`
- Adicionar cálculo: `const totalValor = amendments.reduce((acc, e) => acc + parseValor(e.valor), 0)`
- Substituir o H2 hardcoded pelo valor dinâmico formatado
- Recalcular porcentagens usando `totalValor` como base

---

## B — Indicador de última atualização no Hero card

### Problema
O auto-refresh acontece a cada 2 minutos mas não há nenhum feedback visual — a página parece estática.

### Solução
Dois novos estados em `app/page.tsx`:
- `lastUpdated: Date | null` — hora da última busca bem-sucedida
- `isRefreshing: boolean` — ativo durante o fetch (exceto carga inicial)

**Comportamento:**
- Na carga inicial: sem spinner (só `loading`)
- Nos refreshes automáticos: `isRefreshing = true` → ícone gira → após fetch, `isRefreshing = false` e `lastUpdated = new Date()`

**UI dentro do Hero card** (abaixo dos badges existentes):
```
[↻ girando] Atualizando...   OU   [✓] Atualizado às 14:32
```

---

## C — Animação de contador (2s, ease-out)

### Hook: `hooks/useCountUp.ts`

```ts
useCountUp(target: number, duration: number): number
```

- Usa `requestAnimationFrame` para animação suave
- Easing quadrático (ease-out): começa rápido, desacelera no final
- Reinicia a animação sempre que `target` muda
- Retorna valor numérico atual (o componente formata como moeda)

### Aplicação em `app/page.tsx`
| Elemento | Target |
|---|---|
| H2 — total aprovado | `totalValor` |
| Card Reservado | `totalReservado` |
| Card Empenhado | `totalEmpenhado` |
| Card Liquidado | `totalLiquidado` |
| Card Pago | `totalPago` |
| Badge "X emendas" | `amendments.length` |

---

## Arquivos modificados

| Arquivo | Operação |
|---|---|
| `hooks/useCountUp.ts` | Criar |
| `app/page.tsx` | Modificar |

---

## Critérios de aceitação

- [ ] Total no H2 reflete soma real do campo `valor` das emendas
- [ ] Porcentagens calculadas sobre o total dinâmico
- [ ] Badge "Atualizado às HH:MM" aparece dentro do Hero card após primeira carga
- [ ] Ícone de refresh gira durante atualizações automáticas
- [ ] Todos os 6 valores numéricos animam em 2s com ease-out ao carregar/atualizar
- [ ] Sem quebra de layout em mobile
