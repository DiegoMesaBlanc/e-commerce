# Prompt — Desarrollo del Frontend (UX/UI + Estado Redux + Tests)

> Prompt reutilizable para implementar/validar el frontend del monorepo E-Commerce, incluyendo
> **UX/UI, estado global y tests**. Sigue la misma estructura que `docs/prompts/desarrollo-backend.md`.
> Copiar como instrucción inicial. Al terminar, debe pasar la auditoría de `docs/prompts/ai-auditor.md`.

---

## Rol

Actúa como un **Senior Frontend Software Engineer** (con criterio de **UX/UI**), cuyos entregables serán revisados por un **AI Auditor**.

- Implementas con React 18 + TypeScript estricto + Redux Toolkit + Vite + Tailwind v4, siguiendo los patrones ya acordados (slices RTK, hooks tipados, componentes por comportamiento accesible).
- Toda modificación debe mantener la suite y los umbrales de cobertura en verde.

## Contexto del repositorio

Monorepo `examen-ecommerce-monorepo` con npm workspaces:

- `apps/frontend` — SPA React (objeto de este prompt).
- `apps/backend` — API REST (hecha por `docs/prompts/desarrollo-backend.md`).
- `packages/shared` — contratos tipados compartidos: `Product`, `CartItem`, `OrderStatus`, `Category`, `CheckoutRequestDTO`, `CheckoutResponseDTO`, `DiscountBreakdown`.

**Reglas de negocio (las define el backend; el frontend las respeta, NO las recalcula):**
- Cascada multiplicativa: `CATEGORY` 10% (TECHNOLOGY) → `VOLUME` 5% (subtotal > $100) → `COUPON` 15% (`WELCOME2026`) → `MAX_LIMIT` truncamiento exacto al **35%** (`limitReached = true`).
- El checkout es una petición HTTP al API; la respuesta trae `originalSubtotal`, `discountBreakdown` y `finalTotal`, que la UI presenta textualmente.
- HU 2: no se puede agregar al carrito más unidades de las que hay en stock por producto.
- HU 4: al alcanzar el tope del 35%, se muestra un banner y un toast persistente con el mensaje exacto `¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)`.

## Objetivo

Implementar (o verificar y completar) el frontend: **configuración de herramientas**, **estado global Redux**, **UI/UX orientada a accesibilidad** y **tests con cobertura >80%**, sin alterar las reglas de negocio.

---

## REQUISITOS TÉCNICOS Y ESTRUCTURA (ARQUITECTURA)

### 1. TESTS DE COMPONENTES CON VITEST Y RTL (>80% COBERTURA)

- **`src/features/checkout/components/__tests__/LimitReachedAlert.spec.tsx`** — la alerta y el toast se renderizan correctamente cuando `limitReached` es `true` vs `false` (banner según el mensaje exacto; toast disparado y limpiado — usar fake timers si aplica para `duration: Infinity`).
- **`src/features/cart/components/__tests__/CartView.spec.tsx`** — verificación de **adición/eliminación de productos**: `+`/`−` actualizan cantidad y subtotal de la UI; **Eliminar** retira el ítem del DOM; subtotal recalcula (acciones de `cartSlice` despachadas vía RTL `userEvent`).
- **Cobertura:** asegura que la global de `apps/frontend` se mantenga **> 80%** (statements, branches, functions, lines), sin excluir archivos.
- Suite con `render`/`screen`/`within`/`userEvent`, queries accesibles (roles, textos) antes que `data-testid` (restringido a números/estados no visibles como cantidades y totales), Providers reales o de test, y axios mockeado (jamás fetch real a producción).

---

## Verificación y auditoría

Antes de entregar:

1. `npm run test -w apps/frontend` en verde.
2. `npm run test:coverage -w apps/frontend`: cobertura global **> 80%** en las 4 métricas.
3. `npm run build -w apps/frontend` y `npx tsc -p apps/frontend/tsconfig.json` sin errores (TS estricto, sin `any` nuevos).
4. `npm run lint -w apps/frontend` si el workspace lo define.
5. Paridad con el API: el desglose mostrado coincide con la respuesta tipada de `CheckoutResponseDTO`; errores de red se reflejan en la UI.
6. No se commitean archivos fuera del alcance ni secretos (`node_modules`, `.env`, `dist`, `coverage`, lockfiles fuera); no se reduce el umbral de coverage para "pasar".

## Integración de Git (opcional / recomendada)

- Trabajar en la rama `feature/frontend-state` desde `main`.
- Commit atómico por unidad de trabajo con mensaje semántico del historial, p. ej.:
  - `feat/frontend: setup redux toolkit store and cart state management`
  - `feat/frontend: implement cart UI, checkout breakdown and 35% discount limit alert`
  - `test/frontend: add RTL specs for cart view and discount limit alert`

## Formato de entrega

- Código TypeScript estricto; documentación breve de decisión (trade-offs de UX/UI) si se desvía del detalle dado.
- Resumen final con: archivos creados/modificados, resultados de tests y **cobertura por métrica**, y cualquier supuesto no verificado.