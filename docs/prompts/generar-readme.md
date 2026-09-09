# Prompt — Generar el README del Monorepo

> Prompt reutilizable para que un asistente de IA redacte/actualice el **`README.md` raíz** del monorepo
> E-Commerce. Ubicación sugerida: `docs/prompts/`.
> Copiar como instrucción inicial. Complementa a `docs/prompts/generar-documentacion.md`
> (que cubre además `docs/arquitectura.md` y la integración de Git).

---

## Rol

Actúa como un **Technical Writer** (trabajando con un **AI Auditor** para verificar fidelidad): escribo un `README.md` claro, escaneable y **100% fiel al repositorio**, sin inventar comandos ni afirmaciones.

## Contexto del repositorio

- **Nombre/workspaces:** monorepo npm `examen-ecommerce-monorepo` (`apps/backend`, `apps/frontend`, `packages/shared`).
- **Scripts raíz** (fuente de verdad: `package.json` de la raíz):
  - `npm run dev:backend`, `npm run dev:frontend` — dev servers.
  - `npm run seed` — seeder del backend (recientemente añadido).
  - `npm run test` y `npm run test:coverage` — suites de los workspaces (Jest backend, Vitest frontend) con política de cobertura **>80%** en statements/branches/functions/lines.
- **Scopes por workspace** (según cada `package.json`): backend desarrolla/build/calcula
  cobertura con Jest/Supertest; frontend con Vite/Vitest/React Testing Library.
- **Entorno:** `apps/backend/.env.example` (SERVER_PORT, MONGODB_URI, `DISCOUNT_*` incl. cupón `WELCOME2026`); `apps/frontend/.env.example` (`VITE_API_URL`).
- **Datos de ejemplo:** seeder con 6 productos (Laptop Pro 2024, Smartphone X100, Noise Cancelling Headphones, Wireless Mouse, Cotton T-Shirt, Ceramic Coffee Mug).
- **Endpoints:** `GET /api/products`, `POST /api/checkout` (`couponCode` opcional p. ej. `WELCOME2026`).
- **Docs a enlazar:** `docs/arquitectura.md`, `docs/ia.md`.

## Objetivo

Redactar el `README.md` raíz con la siguiente estructura, sólo con información verificable en el repo.

---

## REQUISITOS DEL README.md

1. **Encabezado y resumen** — propósito del monorepo (API REST Express+Mongoose, SPA React+Redux Toolkit, contratos compartidos en TypeScript estricto) y mención del motor de descuentos en cascada con tope del **35%**.
2. **Estructura** — árbol de carpetas breve (`apps/`, `packages/`, `docs/`) con una línea de descripción por entrada.
3. **Requisitos previos** — **Node.js ≥ 20** (según `engines`), **npm ≥ 10**, **MongoDB** local (`mongodb://localhost:27017`) o `MONGODB_URI` custom.
4. **Instalación** — `npm install` desde la raíz (workspaces; mencionar que el `package-lock.json` está ignorado por git).
5. **Configuración de entorno** — `cp apps/backend/.env.example apps/backend/.env` y `cp apps/frontend/.env.example apps/frontend/.env`, con el listado real de variables de cada uno.
6. **Seeder** — `npm run seed`: limpia/puebla la BD y qué devuelve `GET /api/products`.
7. **Desarrollo** — `npm run dev:backend` (puerto 3000, tsx) y `npm run dev:frontend` (Vite, 5173, HMR) en dos terminales; listado de endpoints principales.
8. **Pruebas** — `npm run test` y `npm run test:coverage` (reporte en ambas apps, política >80% en las 4 métricas) + cómo correr cada workspace por separado (`--workspace=apps/backend` / `apps/frontend`).
9. **Build de producción** — `npm run build --workspace=apps/backend` y `--workspace=apps/frontend`, indicando que compilan con `tsc`/`vite build`.
10. **Documentación técnica** — enlaces a `docs/arquitectura.md` y `docs/ia.md` con su descripción.

---

## Verificación y auditoría

1. **Cada comando debe ejecutarse de verdad** (o existir literalmente en un `package.json` del árbol). Si no se puede ejecutar, marcarlo como *pendiente de verificación* y eliminarlo del README hasta confirmar.
2. Cruza cada número y puerto (3000/5173), nombre de producto semilla, variable de entorno y endpoint contra el código (`src/config/index.ts`, seeder, `.env.example`, controllers).
3. Sin alucinaciones: si no hay evidencia en el repo, no se escribe.
4. El README queda en la raíz del monorepo, en **español** y con estilo escaneable (tablas/`bash` para comandos).
5. Pasa las reglas de Git de `docs/prompts/hacer-commits.md` (marcar para commit atómico, p. ej. `docs: add project README`, solo si se ordena).

## Formato de entrega

- README.md redactado + resumen con: secciones cubiertas, comandos verificados (con evidencia `ruta:línea`) y cualquier supuesto pendiente de verificación.