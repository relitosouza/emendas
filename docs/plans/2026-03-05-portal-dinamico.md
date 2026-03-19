# Portal Dinâmico — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Remover hardcode do valor total, animar contadores financeiros e mostrar indicador de última atualização no Hero card.

**Architecture:** Hook `useCountUp` reutilizável em `hooks/useCountUp.ts`; todas as mudanças visuais concentradas em `app/page.tsx`. Sem novas dependências.

**Tech Stack:** React 19, Next.js, TypeScript, `requestAnimationFrame` nativo.

---

### Task 1: Criar `hooks/useCountUp.ts`

**Files:**
- Create: `hooks/useCountUp.ts`

**Step 1: Criar o arquivo do hook**

```ts
// hooks/useCountUp.ts
"use client";

import { useState, useEffect, useRef } from "react";

export function useCountUp(target: number, duration: number = 2000): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = current;
    startRef.current = null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quadratic
      const eased = 1 - (1 - progress) * (1 - progress);
      const value = startValueRef.current + (target - startValueRef.current) * eased;

      setCurrent(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}
```

**Step 2: Verificar que o arquivo foi criado corretamente**

Abrir `hooks/useCountUp.ts` e confirmar que o conteúdo está correto.

**Step 3: Commit**

```bash
git add hooks/useCountUp.ts
git commit -m "feat: add useCountUp hook for animated number counters"
```

---

### Task 2: Remover hardcode e calcular total dinamicamente em `app/page.tsx`

**Files:**
- Modify: `app/page.tsx:14` (remover `VALOR_DESTINADO`)
- Modify: `app/page.tsx:28-40` (recalcular porcentagens com `totalValor`)
- Modify: `app/page.tsx:187` (substituir H2 hardcoded)

**Step 1: Remover a constante `VALOR_DESTINADO` (linha 14)**

Substituir:
```ts
const VALOR_DESTINADO = 27_081_713.01;
```
Por:
```ts
const totalValor = amendments.reduce((acc: number, e: any) => acc + parseValor(e.valor), 0);
```

**Step 2: Atualizar as porcentagens (linhas 33–40) para usar `totalValor`**

Substituir:
```ts
const porcentagemEmpenhada = VALOR_DESTINADO > 0 ? (totalEmpenhado / VALOR_DESTINADO) * 100 : 0;
const porcentagemFormatada = porcentagemEmpenhada.toFixed(1);
const porcentagemReservada = VALOR_DESTINADO > 0 ? (totalReservado / VALOR_DESTINADO) * 100 : 0;
const porcentagemReservadaFormatada = porcentagemReservada.toFixed(1);
const porcentagemLiquidada = VALOR_DESTINADO > 0 ? (totalLiquidado / VALOR_DESTINADO) * 100 : 0;
const porcentagemLiquidadaFormatada = porcentagemLiquidada.toFixed(1);
const porcentagemPaga = VALOR_DESTINADO > 0 ? (totalPago / VALOR_DESTINADO) * 100 : 0;
const porcentagemPagaFormatada = porcentagemPaga.toFixed(1);
```
Por:
```ts
const porcentagemEmpenhada = totalValor > 0 ? (totalEmpenhado / totalValor) * 100 : 0;
const porcentagemFormatada = porcentagemEmpenhada.toFixed(1);
const porcentagemReservada = totalValor > 0 ? (totalReservado / totalValor) * 100 : 0;
const porcentagemReservadaFormatada = porcentagemReservada.toFixed(1);
const porcentagemLiquidada = totalValor > 0 ? (totalLiquidado / totalValor) * 100 : 0;
const porcentagemLiquidadaFormatada = porcentagemLiquidada.toFixed(1);
const porcentagemPaga = totalValor > 0 ? (totalPago / totalValor) * 100 : 0;
const porcentagemPagaFormatada = porcentagemPaga.toFixed(1);
```

**Step 3: Substituir H2 hardcoded (linha 187)**

Substituir:
```tsx
<h2 className="text-4xl md:text-5xl font-extrabold mb-8">R$ 27.081.713,01</h2>
```
Por:
```tsx
<h2 className="text-4xl md:text-5xl font-extrabold mb-8">
  {loading ? "Carregando..." : totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</h2>
```

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: calculate total value dynamically from amendments data"
```

---

### Task 3: Adicionar estados e lógica de refresh com indicador

**Files:**
- Modify: `app/page.tsx` — estados, fetchData, JSX no Hero card

**Step 1: Adicionar novos estados após os existentes (após linha 12)**

Após `const [searchTerm, setSearchTerm] = useState("");`, adicionar:
```ts
const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
const [isRefreshing, setIsRefreshing] = useState(false);
```

**Step 2: Atualizar a função `fetchData` dentro do `useEffect` (linhas 130–149)**

Substituir a função `fetchData` e o `useEffect` por:
```ts
useEffect(() => {
  async function fetchData(isRefresh = false) {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await fetch("/api/amendments");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAmendments(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  }

  fetchData();
  const interval = setInterval(() => fetchData(true), 120000);
  return () => clearInterval(interval);
}, []);
```

**Step 3: Adicionar indicador dentro do Hero card**

Localizar no Hero card o trecho das badges (após `</div>` que fecha o `flex flex-wrap gap-3`), logo antes do `</div>` que fecha `lg:col-span-7`. Adicionar:

```tsx
{/* Indicador de atualização */}
{!loading && (
  <div className="mt-4 flex items-center gap-2 opacity-70">
    {isRefreshing ? (
      <>
        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
        <span className="text-xs font-semibold">Atualizando...</span>
      </>
    ) : lastUpdated ? (
      <>
        <span className="material-symbols-outlined text-sm">check_circle</span>
        <span className="text-xs font-semibold">
          Atualizado às {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </>
    ) : null}
  </div>
)}
```

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add last-updated indicator and refresh state to hero card"
```

---

### Task 4: Aplicar animação de contador nos valores financeiros

**Files:**
- Modify: `app/page.tsx` — import, hooks e valores animados

**Step 1: Importar o hook no topo de `app/page.tsx`**

Após as importações existentes, adicionar:
```ts
import { useCountUp } from "@/hooks/useCountUp";
```

**Step 2: Declarar os hooks animados**

Após as linhas de cálculo das porcentagens (e `comprometido`/`circumference`/`strokeDashoffset`), adicionar:
```ts
// Animated counters (2s ease-out)
const animatedValor = useCountUp(loading ? 0 : totalValor, 2000);
const animatedReservado = useCountUp(loading ? 0 : totalReservado, 2000);
const animatedEmpenhado = useCountUp(loading ? 0 : totalEmpenhado, 2000);
const animatedLiquidado = useCountUp(loading ? 0 : totalLiquidado, 2000);
const animatedPago = useCountUp(loading ? 0 : totalPago, 2000);
const animatedCount = useCountUp(loading ? 0 : amendments.length, 2000);
```

**Step 3: Substituir o H2 do total para usar `animatedValor`**

Substituir:
```tsx
<h2 className="text-4xl md:text-5xl font-extrabold mb-8">
  {loading ? "Carregando..." : totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</h2>
```
Por:
```tsx
<h2 className="text-4xl md:text-5xl font-extrabold mb-8">
  {loading ? "Carregando..." : animatedValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</h2>
```

**Step 4: Substituir badge de contagem de emendas**

Substituir:
```tsx
<span className="text-sm font-semibold">{loading ? "..." : amendments.length} emendas</span>
```
Por:
```tsx
<span className="text-sm font-semibold">{loading ? "..." : Math.round(animatedCount)} emendas</span>
```

**Step 5: Substituir valor do card Reservado (linha ~240)**

Substituir:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : totalReservadoFormatado}
</h3>
```
Por:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : animatedReservado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</h3>
```

**Step 6: Substituir valor do card Empenhado (linha ~268)**

Substituir:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : totalEmpenhadoFormatado}
</h3>
```
Por:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : animatedEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</h3>
```

**Step 7: Substituir valor do card Liquidado (linha ~295)**

Substituir:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : totalLiquidadoFormatado}
</h3>
```
Por:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : animatedLiquidado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</h3>
```

**Step 8: Substituir valor do card Pago (linha ~323)**

Substituir:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : totalPagoFormatado}
</h3>
```
Por:
```tsx
<h3 className="text-2xl font-extrabold text-slate-800 mb-4">
  {loading ? "Carregando..." : animatedPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
</h3>
```

**Step 9: Remover variáveis de formato que não são mais usadas**

Remover as linhas:
```ts
const totalReservadoFormatado = totalReservado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const totalEmpenhadoFormatado = totalEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const totalLiquidadoFormatado = totalLiquidado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const totalPagoFormatado = totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
```

**Step 10: Commit final**

```bash
git add app/page.tsx
git commit -m "feat: animate financial counters with 2s ease-out count-up effect"
```

---

## Critérios de aceitação

- [ ] `hooks/useCountUp.ts` existe e exporta `useCountUp`
- [ ] H2 do Hero card mostra soma real do campo `valor` das emendas (não hardcoded)
- [ ] Porcentagens calculadas sobre o total dinâmico
- [ ] Badge "Atualizado às HH:MM" aparece dentro do Hero card após primeira carga
- [ ] Ícone `refresh` gira durante atualizações automáticas (2min)
- [ ] Os 5 valores monetários e o contador de emendas animam em 2s ease-out ao carregar
- [ ] Sem erros de TypeScript / build
