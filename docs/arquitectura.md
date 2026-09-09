# Arquitectura — Monorepo E-Commerce

> Documento técnico de referencia (v1.0). Reglas de descuento: Historia de Usuario 1–4.

---

## 1. Resumen ejecutivo

El sistema es un **monorepo** gestionado con **npm workspaces** que contiene tres Ámbitos:

| Ámbito | Tecnología | Responsabilidad |
|---|---|---|
| `apps/backend` | Node.js + Express + Mongoose (TypeScript estricto) | API REST y motor de descuentos |
| `apps/frontend` | React + Redux Toolkit + Vite (TypeScript estricto) | SPA de catálogo, carrito y checkout |
| `packages/shared` | TypeScript puro | **Contratos compartidos** (DTOs, enums) |

Los contratos (`Product`, `CartItem`, `CheckoutRequestDTO`, `CheckoutResponseDTO`, `DiscountBreakdown`, `OrderStatus`, `Category`) viven en `packages/shared` y son la **única fuente de verdad** tipada que comparten ambas aplicaciones.

La regla de negocio central — cálculo de descuentos en cascada con tope del **35%** — está **completamente aislada** en la capa de Dominio del backend (arquitectura hexagonal), sin dependencias de Express, Mongoose ni del framework web.

---

## 2. Pila tecnológica y justificación

| Capa | Elección | Justificación |
|---|---|---|
| Repositorio | Monorepo con **npm workspaces** | Un solo `lockfile`/`node_modules`, publicación de versiones coordinada entre `shared` → `backend`/`frontend`, atomicidad de ramas y CI simple. El monorepo es la opción acertada para un sistema con `1 backend + 1 frontend + 1 paquete de contratos`. |
| Lenguaje | **TypeScript estricto** (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) | Los contratos `shared` transportan tipos entre la API y la UI; el tipado estricto transforma errores de integración en errores de compilación. |
| Frontend | **React 18 + Redux Toolkit + react-redux + Vite** | RTK ofrece `createSlice`/`createAsyncThunk` con inmutabilidad bajo el capó (Immer), reduciendo código de acciones/reducers; Vite da DX y HMR inmediatos. |
| Estilos | **Tailwind CSS v4** | Utilidades *utility-first* para UI responsiva rápida sin CSS global escrito a mano ni fricción de preprocesado (plugin de Vite). |
| Pruebas frontend | **Vitest + React Testing Library + jsdom** | Vitest usa el transformador de Vite (sin compilación separada); RTL fuerza pruebas centradas en el comportamiento visible, no en implementación. |
| Backend | **Express 4** | Framework minimalista y de curva entendible; el patrón middleware (`async-handler`, `error-handler`, `not-found`) cubre el ciclo de request/response sin abstracciones pesadas. |
| Persistencia | **Mongoose 8** | Modelado sobre MongoDB con validación de esquema y actualizaciones atómicas por documento (`$inc` de stock). **Trade-off clave**, ver §5. |
| Pruebas backend | **Jest + Supertest** | Suites de integración HTTP reales (superagent contra la app Express) sin levantar el puerto. |
| Ejecución en dev | **tsx** | TS ejecutado sin paso de compilación previo (`tsx watch`), ideal para el feedback loop del backend. |

---

## 3. Estructura del monorepo

```
e-commerce/
├── apps/
│   ├── backend/            # Express + Mongoose (API REST + motor de descuentos)
│   └── frontend/           # React SPA (Vite + Redux Toolkit + Tailwind)
├── packages/
│   └── shared/src/index.ts # Contratos compartidos (DTOs, enums)
├── docs/                   # Documentación técnica
├── package.json            # workspaces + scripts orquestadores
└── tsconfig.base.json
```

Los **scripts raíz** delegan en los workspaces:

```bash
npm run dev:backend     # → npm run dev -w apps/backend        (tsx watch)
npm run dev:frontend    # → npm run dev -w apps/frontend        (vite)
npm run seed            # → npm run seed -w apps/backend        (tsx seed.ts)
npm run test            # → npm run test --workspaces          (jest + vitest)
npm run test:coverage   # → cobertura en ambas apps
```

---

## 4. Arquitectura Hexagonal del backend

El backend se organiza en capas concéntricas según el puerto/adaptador:

```
                     ┌─────────────────────────────────────────┐
                     │            INFRAESTRUCTURA              │
                     │  Express (http/app, server, routers,    │
                     │  controllers) · Mongoose (models,       │
                     │  connection) · Adaptadores repository   │
                     └──────────────┬──────────────────────────┘
                                    │ (inyección de dependencias)
                     ┌──────────────▼──────────────────────────┐
                     │              APLICACIÓN                 │
                     │  CheckoutService (orquestación,         │
                     │  validaciones de negocio).              │
                     └──────────────┬──────────────────────────┘
                                    │
                     ┌──────────────▼──────────────────────────┐
                     │               DOMINIO                   │
                     │  DiscountEngine · IDiscountStrategy     │
                     │  Estrategias (5) · Factory · Entidades  │
                     │  utils/money (aritmética pura)          │
                     └─────────────────────────────────────────┘
```

### 4.1 Regla de dependencia

- **`domain/`** no importa Express, Mongoose ni configuración (`config`). Su única dependencia externa son los **tipos del paquete compartido** (`@examen-ecommerce/shared`).
- **`application/`** orquesta: valida el DTO, consulta productos a través de la interfaz de repositorio, ejecuta el motor y persiste el pedido.
- **`infrastructure/`** implementa los adaptadores (HTTP y persistencia) y **construye** el grafo de dependencias.

```text
domain/                        
├── entities/order.ts          # Entidad Orden (no atada a Mongoose)
├── factory/DiscountEngineFactory.ts
├── services/DiscountEngine.ts # Motor: cascada secuencial
├── strategies/                # IDiscountStrategy + 4 implementaciones
└── utils/money.ts             # roundMoney / percentageFromRatio

application/
└── services/checkout.service.ts

infrastructure/
├── controllers/  http/app.ts  server.ts  middleware/  routes/
├── database/     connection.ts  models/{product,order}.model.ts  seed.ts
├── repositories/ product.repository.ts  order.repository.ts   # interfaz + Mongoose
└── index.ts                   # bootstrap (connect → seed → server)
```

**Consecuencia verificable:** el motor de descuentos se prueba directamente con Jest **sin** levantar MongoDB ni Express (solo `Product`/`CartItem` en memoria), y la API se prueba contra la app Express con repositorios reales de Mongoose in-memory. Ambos niveles de test coexisten sin acoplarse.

---

## 5. Aislamiento de las reglas matemáticas: cascada multiplicativa (HU 1–4)

### 5.1 La regla de negocio

Los descuentos NO se suman de forma aditiva (+10% +5% +15% = 30%). Se aplican **en cascada multiplicativa secuencial estricta**, cada uno sobre el subtotal resultante del anterior:

```
originalSubtotal (todos los ítems)

CATEGORY   → 10% sobre ítems TECHNOLOGY
VOLUME     → 5%  si runningSubtotal > 100
COUPON     → 15% si couponCode == WELCOME2026
MAX_LIMIT  → corrige si el ahorro global supera 35% del original
```

Ejemplo real (del spec de pruebas): carrito por **$2 000**

| Paso | Base | Descuento | Resultante |
|---|---|---|---|
| Subtotal original | — | — | $2 000.00 |
| Categoría (10%, TECH) | $2 000 | $200.00 | $1 800.00 |
| Volumen (5%) | $1 800 | $90.00 | $1 710.00 |
| Cupón (15%) | $1 710 | $256.50 | $1 453.50 |
| Límite 35% | — | — | **$1 453.50** |

(35% de $2 000 = $700 > $546.50 ahorrados → no se activa el tope.)

### 5.2 El tope del 35% (`MaxLimitDiscountStrategy`)

````ts
const maxAllowedDiscount = roundMoney(context.originalSubtotal * this.maxRate);
const cumulativeSavings = roundMoney(context.originalSubtotal - context.runningSubtotal);

if (cumulativeSavings <= maxAllowedDiscount) {
  return { discountAmount: 0, applied: false, limitReached: false };
}
const excess = roundMoney(cumulativeSavings - maxAllowedDiscount);
return { discountAmount: -excess, applied: true, limitReached: true }; // "devuelve" el exceso
````

Como la cascada ya aplicó los descuentos, la estrategia **devuelve el excedente** (`discountAmount` negativo) y marca `limitReached: true`. El frontend consume ese flag (o `effectivePercentage >= 35`) para mostrar la **alerta HU 4** (`LimitReachedAlert`).

### 5.3 Aritmética monetaria del dominio

- Todo pasa por `roundMoney` (`Math.round((x + EPSILON) * 100) / 100`) para 2 decimales deterministas.
- `percentageFromRatio` expresa el ahorro efectivo con 2 decimales.
- `DiscountEngine` es una clase pura sin estado persistente; `execute(cartItems, couponCode)` devuelve `{ originalSubtotal, discountBreakdown, finalTotal }`.

**Por qué está aislado en dominio:** el cálculo es la ventaja competitiva y el punto con más casos límite (tope de 35%, volúmenes, cupones). Aislarlo permite (1) probarlo sin infraestructura, (2) impedir que Express/Mongoose lo "contaminen", y (3) reutilizarlo si mañana cambia el transporte.

---

## 6. Patrones de diseño implementados explícitamente

### 6.1 Strategy — reglas de descuento secuenciales

`IDiscountStrategy` define el contrato (`name`, `apply(context) → DiscountResult`); cada regla es una clase con su tasa inyectada por constructor:

| Clase | Regla | Parámetros |
|---|---|---|
| `CategoryDiscountStrategy` | 10% sobre subtotal de ítems TECHNOLOGY | `rate` |
| `VolumeDiscountStrategy` | 5% si `runningSubtotal > threshold` | `rate`, `threshold` |
| `CouponDiscountStrategy` | 15% si el cupón coincide | `rate`, `couponCode` |
| `MaxLimitDiscountStrategy` | Tope de ahorro 35% | `maxRate` |

`DiscountEngine` itera en orden fijo CATEGORY → VOLUME → COUPON → MAX_LIMIT pasando el `runningSubtotal` de cada resultado al siguiente (cascada).

### 6.2 Factory — creación de la cadena de cálculo

`DiscountEngineFactory.create(options: DiscountEngineOptions)` construye el motor encadenando las estrategias con las tasas provenientes de `config.discounts` (env). Centraliza el wiring para que `CheckoutService` y los tests construyan motores idénticos con un solo punto de configuración.

### 6.3 Repository — desacoplamiento de la persistencia Mongoose

`ProductRepository` y `OrderRepository` son **interfaces** (puertos) que `CheckoutService` recibe por constructor (`Dependency Injection`). Sus implementaciones concretas `MongooseProductRepository` / `MongooseOrderRepository` son los **adaptadores** Mongoose. La capa de aplicación manipula únicamente el contrato `Product`/`Order` del dominio; el cambio de persistencia no toca el motor ni el servicio.

### 6.4 Otros patrones

- **Dependency Injection manual** en `createApp(dependencies)` (`src/infrastructure/http/app.ts`): el bootstrap construye las dependencias reales y las inyecta a controllers/servicio → alta testabilidad con Supertest.
- **Middleware chain HTTP**: `async-handler` (captura promesas rechazadas), `error-handler` centralizado (mapeo `AppError` → HTTP status), `notFoundHandler`.
- **Error types de dominio**: `EmptyCartError`, `InsufficientStockError`, `InvalidCartItemError`, `InvalidCouponError`, `ProductNotFoundError` (aplicación).

---

## 7. Trade-offs asumidos

| Decisión | Qué ganamos | Qué asumimos / aceptamos |
|---|---|---|
| **Mongoose + MongoDB** en lugar de BD relacional/ORM | Velocidad de desarrollo, esquema flexible, stock actualizado con un `$inc` atómico por documento, sin migraciones dolorosas para un prototipo académico. | Sin transacciones ACID multi-documento ni *constraints* referenciales; la consistencia entre pedido y stock no es transaccional (aceptable al nivel de complejidad actual, ver deuda técnica). |
| **Arquitectura hexagonal** en todo el backend | Motor de precios testeable sin infraestructura y reutilizable. | Más indirección (interfaces, DI) de la que un CRUD trivial necesitaría; sobre-ingeniería justificada porque el descuento es el núcleo de negocio. |
| **Express** en vez de Nest/Fastify | Control total, sin magia de decoradores; mínimo conocimiento previo. | Menos estructura impuesta; la disciplina de capas se mantiene por convención documentada + tests. |
| **Redux Toolkit** en vez de React Query/SWR | Estado global síncrono para carrito y envelope de checkout con un solo fuente de verdad; thunks para la API. | Más boilerplate que SWR para fetching simple; mitigado porque la mayor parte del estado es mutación local (carrito), no caché de servidor. |
| **SPA con Vite** (sin SSR) | Deploy estático simple, HMR instantáneo. | SEO limitado y primer render en cliente (irrelevante para el caso de uso). |
| **Monorepo workspaces** en vez de multi-repo/microservicios | Contratos tipados compartidos y versionado coordinado. | Un solo punto de mejora estructural; npm hoistea dependencias (un único `node_modules`). |
| **Números como `number` (IEEE-754) + `roundMoney`** | Simplicidad, sin libs de decimales. | Riesgo de errores de representación; mitigado redondeando en cada paso de persistencia/cálculo (2 decimales). |

---

## 8. Flujo de datos de punta a punta

```
[ProductList]                       [CartView]             [CheckoutPanel]
 GET /api/products          addToCart/updateQuantity/     setCoupon / previewCheckout(efecto) / processCheckout
        │                    removeFromCart (slice)            │
        ▼                        ▼                            ▼
 [axiosClient → :3000/api]  [RTK store: cart + checkout]   thunk POST /api/checkout/preview  (desglose en "Aplicar")
                                  │                            │
                                  │                    [DiscountEngine (domain)]
                                  │                    subtotal → cascada → breakdown
                                  ▼                            │
                         [CartView subtotal               thunk POST /api/checkout (final)
                          reactivo en tiempo real]              │
                                                                ├──→ order repository → OrderModel (persiste)
                                                                ▼
                        [LimitReachedAlert]  ◄── limitReached || effectivePercentage ≥ 35
```

El **preview** (`POST /api/checkout/preview`) reutiliza la misma cadena de validación y el mismo motor (`CheckoutService.preview` → `buildCart`), **sin** persistir ni decrementar stock; devuelve `CheckoutPreviewResponseDTO` (mismos totales, sin `orderId`). Así el frontend cumple la HU 2 mostrando el desglose al presionar "Aplicar" y en tiempo real al cambiar el carrito.

---

## 9. Configuración (entorno)

Todo lo sensible es configurable por variables de entorno con defaults (ver `apps/backend/.env.example`):

| Variable | Default | Uso |
|---|---|---|
| `SERVER_PORT` | `3000` | Puerto del backend |
| `MONGODB_URI` | `mongodb://localhost:27017/ecommerce` | Conexión |
| `DISCOUNT_CATEGORY_RATE` | `0.1` | Estrategia categoria |
| `DISCOUNT_VOLUME_RATE` | `0.05` | Estrategia volumen |
| `DISCOUNT_VOLUME_THRESHOLD` | `100` | Umbral de volumen |
| `DISCOUNT_COUPON_RATE` | `0.15` | Estrategia cupón |
| `DISCOUNT_COUPON_CODE` | `WELCOME2026` | Cupón promocional |
| `DISCOUNT_MAX_RATE` | `0.35` | Límite HU 4 |

Frontend: `VITE_API_URL` (default `http://localhost:3000/api`).

---

## 10. Calidad y verificación

- **Backend:** Jest + Supertest. Cobertura exigida **>80%** global (actual: 98.8% statements / 80% branches / 96.82% functions / 99.16% lines; umbrales por archivo verificados en CI). Tests del motor en memoria + tests de API con repositorios Mongoose reales.
- **Frontend:** Vitest + RTL. Cobertura exigida **>80%** (actual: 100% statements/functions/lines; 92.03% branches). Casos clave: cascada de reducers del carrito, thunk `processCheckout` (éxito/error/loading), preview `previewCheckout` en tiempo real (desglose + error de cupón), desglose de 7 filas, alerta del 35% (banner + toast persistente `duration: Infinity`).
- Comandos: `npm run test`, `npm run test:coverage` (raíz → ambas apps).

---

## 11. Deuda técnica y evolución

- **Puertos de repositorio en `infrastructure/`:** `ProductRepository`/`OrderRepository` viven junto a sus adaptadores; candidatos a moverse a `domain/ports/` para cumplir la regla de dependencia al 100%.
- **`toProduct(document: any)`** (frontera del adaptador): cast pragmático para el mapping de Mongoose; idealmente validar con un guard de tipos.
- **Sin transacciones multi-documento:** un fallo entre `updateStock` y `OrderModel.create` dejaría stock descontado sin pedido; mitigado por diseño simple; evolución natural → patrón Outbox/transacciones/compensación.
- **`number` como dinero:** si el producto pasa a mayor escala, migrar a `Decimal` (BigNumber).
- **Extraer `DiscountEngine`** a `packages/shared` (o paquete propio `@examen-ecommerce/pricing`) si el contrato lo requiere en frontend para *preview* de precios.