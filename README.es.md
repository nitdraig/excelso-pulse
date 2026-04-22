# Excelso Pulse

**Excelso Pulse** es una aplicación web tipo centro de mando para el ecosistema Excelso. Agrega señales de salud y negocio desde varios backends de producto, guarda metadatos de proyectos y secretos cifrados en MongoDB, y muestra un panel unificado por usuario autenticado.

[Read in English](README.md)

## Funcionalidades

- **Autenticación** — Email y contraseña (Auth.js v5), rutas protegidas y registro.
- **Registro de proyectos** — CRUD de “orígenes pulse”: nombre, slug, URL pública de la app (opcional), URL pulse del backend y token Bearer guardado **cifrado en reposo** (AES-256-GCM).
- **Agregador Pulse** — En servidor, peticiones en paralelo a `GET …/internal/pulse` de cada backend con Bearer, timeouts, caché en memoria y límite de frecuencia.
- **Normalización** — Acepta varios formatos de JSON pulse (métricas planas, `metrics.technical` / `context`, `infrastructure` como objeto o lista de componentes).
- **Panel** — Tarjetas con estado, latencia, pistas de infraestructura, KPIs y hojas de detalle.

## Stack tecnológico

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/) con [Mongoose](https://mongoosejs.com/)
- [Auth.js](https://authjs.dev/) (NextAuth v5)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Vitest](https://vitest.dev/) para pruebas unitarias

## Requisitos

- Node.js 22+ (recomendado)
- Una instancia MongoDB (cadena de conexión)
- `AUTH_SECRET` y `PULSE_SECRETS_MASTER_KEY` para un entorno similar a producción (ver abajo)

## Puesta en marcha

1. **Clonar e instalar**

   ```bash
   git clone https://github.com/excelso/excelso-pulse.git
   cd excelso-pulse
   npm install
   ```

2. **Variables de entorno**

   Copia `.env.example` a `.env` y completa al menos:

   | Variable | Uso |
   |----------|-----|
   | `MONGODB_URI` | Cadena de conexión a MongoDB (usuarios y proyectos). |
   | `AUTH_SECRET` | Secreto de Auth.js (`npx auth secret`). |
   | `PULSE_SECRETS_MASTER_KEY` | 64 caracteres hexadecimales (32 bytes); necesario para guardar tokens Bearer en base de datos. Ejemplo: `openssl rand -hex 32`. |

   Opciones del agregador: `PULSE_FETCH_TIMEOUT_MS`, `PULSE_ROUND_TIMEOUT_MS`, `PULSE_CACHE_TTL_MS`, `PULSE_RATE_LIMIT_*`, `PULSE_SOURCES`, `PULSE_MERGE_ENV_SOURCES`. Detalle en `docs/pulse-aggregator.md`.

3. **Desarrollo local**

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

4. **Compilar**

   ```bash
   npm run build
   npm start
   ```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (pruebas unitarias) |

## API (con sesión)

Rutas habituales usadas por la UI u otros BFF:

- `GET /api/portfolio` — Proyectos del usuario fusionados con la última ronda agregada del pulse.
- `GET /api/pulse/summary` — JSON agregado en crudo (`entries[]`).
- `GET|POST /api/projects` — Listar / crear orígenes en el registro.
- `GET|PATCH|DELETE /api/projects/[slug]` — Leer / actualizar / eliminar un origen.

Las respuestas no exponen el Bearer en claro ni detalles del cifrado.

## Documentación

- [`docs/pulse-aggregator.md`](docs/pulse-aggregator.md) — Comportamiento del agregador, variables y endpoints.
- [`docs/health-business-pulse.md`](docs/health-business-pulse.md) — Contrato de referencia del backend `GET /internal/pulse`.

## Seguridad

- No subas `.env` ni secretos reales al repositorio.
- Los valores Bearer se cifran antes de persistir; la resolución del token ocurre solo en servidor al llamar a las APIs de producto.

## Licencia

MIT — ver [`package.json`](package.json).
