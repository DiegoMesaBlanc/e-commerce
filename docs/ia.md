# Desarrollo Asistido por IA — Bitácora y Gobierno

> Documento de auditoría del proceso de co-creación `humano + IA` del monorepo. v1.0.

---

## 1. Skills / Prompts automatizados

El flujo de trabajo se apoya en una serie de **instrucciones automatizadas** (prompts/skills) que el asistente de IA aplica de forma consistente a lo largo de la sesión:

### 1.1 Automatización de Git

| Instrucción | Comportamiento promovido |
|---|---|
| **Commits atómicos** | Un commit por unidad de trabajo, solo con los archivos del alcance (p. ej. `feat/frontend: ...` en `apps/frontend`), inspeccionando `git status`/`git diff` antes de `commit` de acuerdo al mensaje exacto solicitado. |
| **Ramas por feature** | Crear la rama desde `main` limpio (`feature/discount-engine`, `feature/backend-api`, `feature/frontend-state`, `feature/frontend-ui`, `feature/documentation`) y permanecer en ella sin merges no solicitados. |
| **Nunca commitear por iniciativa propia** | Se pregunta al humano antes de cualquier commit/push; la integridad del historial es decisión del propietario. |
| **Secrets & gitignore** | `.env*` quedan fuera del control de versiones (solo `.env.example`); `node_modules`, `dist`, `coverage` y lockfiles ignorados por `.gitignore` raíz. |

### 1.2 Automatización de pruebas

| Instrucción | Comportamiento promovido |
|---|---|
| **Verificación obligatoria al terminar** | Ejecutar la suite correspondiente (`npm run test -w apps/backend`, `npm run test -w apps/frontend`) y, si existe, la cobertura. |
| **Umbral de cobertura >80%** | El pipeline de frontend exige `statements/branches/functions/lines ≥ 80%` (Vitest `coverage.thresholds`); en backend el criterio acordado es el mismo (>80% global). |
| **Typecheck + build** | `tsc` estricto y `vite build` corren antes de dar una tarea por cerrada, para que ningún `any`/error de tipos pase desapercibido. |
| **Preferir testing-library** | UI se prueba por rol/texto visible y comportamiento del usuario, nunca por `className` ni estructura interna. |
| **Basura de tests** | Los ajustes globales (mock de `window.matchMedia`, limpieza de `toast.dismiss()`) viven en `src/test/setup.ts` para no repetirse en cada spec. |

### 1.3 Criterios de "definición de completado" aplicado al agente

1. El código atraviesa `tsc` estricto sin `any` explícitos nuevos ni deprecaciones.
2. Suite y cobertura >80% en verde.
3. Commit atómico con mensaje de convención (`feat/…`), solo archivos del alcance.

---

## 2. Agentes / sub-agentes

La construcción del monorepo se distribuyó entre **roles de agente** con responsabilidades de auditoría explícitas:

| Rol (sub-agente) | Responsabilidad | Cómo audita |
|---|---|---|
| **Software Architect** | Decide pila, capas, patrones y trade-offs; revisa la coherencia entre `shared` → backend → frontend. | Exige que el dominio no importe infra, que los contratos viajen por `packages/shared` y que cada decisión quede documentada en `docs/`. |
| **Backend engineering agent** | Valida con Jest (motor en memoria + API con Supertest/Mongoose) y coverage report.  |
| **UI/UX Senior Engineer agent** | Valida con Vitest + RTL por comportamiento visible y mantiene cobertura >80%. |
| **AI Auditor** *(este documento)* | Audita el **proceso**: qué generó la IA, qué corrigió/validó el humano, y si los umbrales se cumplieron. | Revisa diff, historial de commits, cobertura, y registra las sugerencias que **fueron rechazadas o corregidas** (ver §4). |

**Reglas de auditoría del proceso:**

- El agente IA **genera el código sugerido**, pero el humano **decide** la aceptación: nada se combina sin revisar el `diff`.
- Los umbrales de cobertura y el typecheck estricto funcionan como **jueces objetivos**: una sugerencia puede "funcionar" en la prueba aislada pero ser rechazada si rompe tipado o hunde la cobertura.
- Los motores de decisión críticos (aritmética de descuentos) se codifican una sola vez y se revisan doblemente (tests de motor + tests de integración del servicio).

---

## 3. Bitácora de co-creación

### 3.1 Metodología de supervisión

1. **Revisión por ejecutable:** cada sugerencia se acepta solo si `tsc` estricto, suites y umbrales >80% quedan verdes (sin deprecaciones).
2. **Revisión por diseño:** el humano audita que la sugerencia respete la arquitectura, buenas practicas de código y los patrones de diseño; no solo que "compile".
3. **Revisión de UX/UI:** los textos obligatorios de la HU (banner del 35%) y el comportamiento persistente del toast son validación humana.
4. **Registro de divergencias:** cada rechazo/corrección notable se documenta (sección 4) para que futuros ciclos no repitan la propuesta.

---

## 4. Ejemplos concretos de sugerencias de IA rechazadas o corregidas

### 4.a Corrección de tipados `any` implícitos al mapear respuestas de Mongoose

- **Sugerencia inicial de la IA:** mapear documentos de Mongoose a `Product` con `any`/`Record<string, unknown>` y conversiones laxas en la frontera del repositorio.
- **Por qué se corrigió:** `tsconfig` está en modo estricto; los `any` implícitos erosionan el contrato y esconden errores de campos (típico en adaptadores ORM/ODM).
- **Corrección aplicada:**
  - El contrato `Product` (`packages/shared/src/index.ts`) se declara con `readonly id` y campos tipados; `CartItem`, `CheckoutRequestDTO`/`CheckoutResponseDTO` y `DiscountBreakdown` se expresan con tipos explícitos (sin `any`).
  - El adaptador `MongooseProductRepository.toProduct()` casta a la forma tipada del contrato en un punto único y acotado (frontera del adaptador), documentándose como deuda técnica en `docs/arquitectura.md §11`.
  - Se añadió `noUnusedLocals`/`noUnusedParameters` y la suite de frontend verifica que ningún `any` de tipos nuevo entre (typecheck estricto en `build`).
