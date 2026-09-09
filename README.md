# E-Commerce Monorepo

Monorepo de un e-commerce con **API REST** (Express + Mongoose), **SPA** (React + Redux Toolkit) y un **paquete de contratos compartidos** (TypeScript estricto). Incluye un motor de descuentos en cascada con tope del **35%** (Historia de Usuario 4).

## Estructura

```
e-commerce/
├── apps/
│   ├── backend/    # Express + Mongoose — API REST (productos y checkout) + seeder
│   └── frontend/   # React + Vite + Redux Toolkit + Tailwind — catálogo, carrito, checkout
├── packages/
│   └── shared/     # Contratos compartidos (DTOs, enums) tipados
└── docs/           # Documentación técnica (arquitectura, desarrollo asistido por IA)
```

## Requisitos previos

- **Node.js ≥ 20** (verificado en `engines`)
- **npm ≥ 10**
- **MongoDB** local en el puerto por defecto (`mongodb://localhost:27017`) — o apuntar `MONGODB_URI` a otra instancia

## Instalación

Desde la raíz del repositorio, instala todos los workspaces (una sola vez):

```bash
npm install
```

> El monorepo usa npm workspaces (`apps/*`, `packages/*`); las dependencias se hoistean a un único `node_modules` raíz. El `package-lock.json` está ignorado por git.

## Configuración de entorno

Copia el archivo de ejemplo del backend (los valores por defecto funcionan para MongoDB local):

```bash
cp apps/backend/.env.example apps/backend/.env
```

Variables disponibles: `SERVER_PORT`, `MONGODB_URI`, `DISCOUNT_*` (tasas/código de descuento). El frontend usa `VITE_API_URL` (default `http://localhost:3000/api`).


Copia el archivo de ejemplo del frontend:

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Variables disponibles: `VITE_API_URL`.

## Seeder de base de datos

Con MongoDB levantado, crea/limpia los productos de ejemplo:

```bash
npm run seed
```

Al finalizar, `GET http://localhost:3000/api/products` devuelve los 6 productos semilla (Laptop Pro 2024, Smartphone X100, Noise Cancelling Headphones, Wireless Mouse, Cotton T-Shirt, Ceramic Coffee Mug).

## Desarrollo (ambas apps a la vez)

En dos terminales:

```bash
# Terminal 1 — Backend (Express, puerto 3000, auto-reload con tsx)
npm run dev:backend

# Terminal 2 — Frontend (Vite, http://localhost:5173, HMR)
npm run dev:frontend
```

Endpoints principales del backend: `GET /api/products`, `POST /api/checkout/preview` (calcula el desglose **sin** persistir ni descontar stock — el frontend lo usa al presionar "Aplicar"), `POST /api/checkout` (persiste la orden y decrementa stock; con `couponCode` opcional, p. ej. `WELCOME2026`).

## Pruebas

Ejecuta la suite de **todas** las aplicaciones (Jest en backend, Vitest + React Testing Library en frontend):

```bash
npm run test
```

Con **reporte de cobertura** en ambas apps (política: **>80%** en statements/branches/functions/lines):

```bash
npm run test:coverage
```

También puedes correr cada app por separado:

```bash
npm run test --workspace=apps/backend       # Jest
npm run test --workspace=apps/frontend      # Vitest
npm run test:coverage --workspace=apps/backend
npm run test:coverage --workspace=apps/frontend
```

## Build de producción

```bash
npm run build --workspace=apps/backend   # tsc → dist/
npm run build --workspace=apps/frontend  # tsc + vite build
```

## Documentación técnica

- **[docs/arquitectura.md](docs/arquitectura.md)** — pila tecnológica, arquitectura, cascada de descuentos y patrones de diseño.
- **[docs/ia.md](docs/ia.md)** — flujos automatizados de Git/pruebas y agentes de auditoría.