# Prompt — Desarrollo del Backend (API REST + Motor de Descuentos)

> Prompt reutilizable para que un asistente de IA implemente/valide el backend del monorepo
> E-Commerce con arquitectura hexagonal. Ubicación sugerida: `docs/prompts/`.
> Copiar como instrucción inicial.

---

## Rol

Actúa como un **Senior Backend Software Engineer** (con criterio de arquitectura hexagonal), cuyos entregables serán revisados por un **AI Auditor**.

- Implementas utilizando TypeScript estricto y los patrones acordados (Strategy, Factory, Repository).
- Toda modificación debe mantener la suite y los umbrales de cobertura en verde.

## Contexto del repositorio

Monorepo `examen-ecommerce-monorepo` con npm workspaces:

- `apps/backend` — API REST con Express + Mongoose.
- `apps/frontend` — SPA React (no forma parte de este prompt).
- `packages/shared` — contratos tipados compartidos: `Product`, `CartItem`, `OrderStatus`, `Category`, `CheckoutRequestDTO`, `CheckoutResponseDTO`, `DiscountBreakdown`.

**Reglas de negocio (Dominio purificado, no se modifican en esta tarea):**
- Motor de descuentos en `src/domain/services/DiscountEngine.ts` ejecutando una cascada multiplicativa secuencial:
  1. `CATEGORY` — 10% sobre ítems TECHNOLOGY.
  2. `VOLUME` — 5% si el subtotal resultante supera $100.
  3. `COUPON` — 15% si el cupón es `WELCOME2026`.
  4. `MAX_LIMIT` — truncamiento exacto si los ahorros acumulados superan el **35%** del subtotal original (`limitReached = true`).
- Estrategias en `src/domain/strategies/` bajo el contrato `IDiscountStrategy`; aritmética monetaria en `src/domain/utils/money.ts` (`roundMoney`, 2 decimales).
- Configuración por variables de entorno en `src/config/index.ts` (tabla en `apps/backend/.env.example`).

## Objetivo

Implementar (o verificar y completar) la capa de **persistencia y pruebas** del backend según los requisitos siguientes, sin alterar las reglas matemáticas del dominio.

---

## REQUISITOS TÉCNICOS Y ESTRUCTURA (ARQUITECTURA)

### 1. BASE DE DATOS Y REPOSITORIOS (MONGOOSE)

- **Conexión:** configura Mongoose leyendo la variable de entorno `MONGODB_URI` con default `'mongodb://localhost:27017/ecommerce'` (verificar que el `.env`/`.env.example` la exponga).
- **Schemas y Models de Mongoose** para `Product` y `Order` en `src/infrastructure/database/models/`.
- **Patrón Repositorio** — interfaces e implementaciones en `src/infrastructure/repositories/`:
  - `ProductRepository`: `findByIds(ids: string[])`, `updateStock(id: string, quantity: number)`.
  - `OrderRepository`: `save(order)`.
  - Implementaciones concretas con Mongoose (adaptadores) que mantengan los contratos tipados de `@examen-ecommerce/shared` (sin `any` implícitos fuera de la frontera del adaptador).
- **Seeder** en `src/infrastructure/database/seed.ts`:
  - Limpia y puebla la BD (`deleteMany` + `insertMany`/upsert).
  - Mínimo **5 productos reales**; al menos **2 de categoría `TECHNOLOGY`** y con stock suficiente para los tests de checkout.
  - Agrega el script npm `"seed"` en `apps/backend/package.json` (p. ej. `tsx src/infrastructure/database/seed.ts`).

### 2. TESTS DE INTEGRACIÓN Y COBERTURA (>80%)

- **Configura Jest** en `apps/backend` (`jest.config.ts` o configuración en `package.json`) con soporte TypeScript (ts-jest) y mapeo del paquete compartido `@examen-ecommerce/shared` hacia su fuente en `packages/shared`.
- **Tests de integración de la API** en `src/infrastructure/__tests__/checkout.test.ts` (usando **supertest** contra la app Express y **mongodb-memory-server** o mocks de repositorio):
  - Casos de error obligatorios: comprar sin stock suficiente, cupón inválido y carrito vacío.
  - Caso feliz: carrito válido → respuesta con `originalSubtotal`, `discountBreakdown` y `finalTotal`.
- **`src/domain/__tests__/DiscountEngine.spec.ts`** probando minuciosamente:
  1. Carrito con productos de **Tecnología** (aplica 10%).
  2. Subtotal **> $100** (aplica 5% sobre el monto **tras** la regla 1, no sobre el original).
  3. Cupón `"WELCOME2026"` válido **vs.** cupón inválido/inexistente.
  4. **CASO BORDE CLAVE:** descuentos acumulados que superen el 35% deben truncarse **exactamente** al 35%, con `limitReached = true` y `finalTotal = originalSubtotal * 0.65`.
  5. Carrito vacío o subtotal **$0**.
  6. Asegura **cobertura de código > 80%** ejecutando los tests.
- Verifica que `npm run test` mantenga una cobertura general **> 80%** en todo el backend (statements, branches, functions, lines).

---

## Verificación y auditoría

Antes de entregar:

1. `npm run test -w apps/backend` en verde.
2. `npm run test:coverage -w apps/backend`: cobertura global > 80% en las 4 métricas.
3. `npx tsc -p apps/backend/tsconfig.json` sin errores (TypeScript estricto, sin `any` nuevos fuera de la frontera del adaptador).
4. El `seed` levantado contra MongoDB local puebla ≥ 5 productos (≥ 2 TECHNOLOGY, stock suficiente).
5. No se commitean archivos externos al alcance ni secretos (`node_modules`, `.env`, `dist`, `coverage`, lockfiles quedan fuera).

## Integración de Git (opcional / recomendada)

- Trabajar en la rama `feature/backend-api` desde `main`.
- Commit atómico por unidad de trabajo con mensaje semántico, p. ej. `feat/backend: implement REST API, Mongoose repositories and checkout endpoint`; separar los ajustes de configuración/env en commits propios si aplica.

## Formato de entrega

- Código TypeScript estricto y documentación breve de decisión (trade-offs) si se desvía del detalle dado.
- Resumen final con: archivos creados/modificados, resultados de tests y cobertura por métrica, y cualquier supuesto no verificado.