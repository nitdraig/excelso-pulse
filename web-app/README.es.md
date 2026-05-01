# Excelso Pulse

<img src="https://github.com/nitdraig/excelso-pulse/npm/public/web-app-manifest-512x512.png" alt="Logo Excelso Pulse" width="128" height="128">

**Excelso Pulse** es una aplicación web tipo centro de mando para el ecosistema Excelso. Agrega señales de salud y negocio desde varios backends de producto, guarda metadatos de proyectos y secretos cifrados en MongoDB, y muestra un panel unificado por usuario autenticado.

[README en inglés (raíz)](../README.md) · [README en español (raíz)](../README.es.md)

## Estructura del monorepo

Este directorio (**`web-app/`**) contiene la aplicación **Next.js** (panel, Auth.js, registro en MongoDB, agregador pulse). El paquete publicable para backends está en **[`../npm/`](../npm/)** (`excelso-pulse-express`): router Express y `collectPulse()` para exponer `GET /internal/pulse`.

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

- Node.js 22+ (recomendado; revisa `engines` en `package.json` si existe)
- Una instancia MongoDB (cadena de conexión)
- `AUTH_SECRET` y `PULSE_SECRETS_MASTER_KEY` para un entorno similar a producción (ver abajo)

## Puesta en marcha (esta app)

Desde la raíz del repositorio clonado:

1. **Instalar**

   ```bash
   cd excelso-pulse/web-app
   npm install
   ```

2. **Variables de entorno**

   Copia `.env.example` a `.env` en esta carpeta (`web-app/`) y completa al menos:

   | Variable | Uso |
   |----------|-----|
   | `MONGODB_URI` | Cadena de conexión a MongoDB (usuarios y proyectos). |
   | `AUTH_SECRET` | Secreto de Auth.js (`npx auth secret`). |
   | `PULSE_SECRETS_MASTER_KEY` | 64 caracteres hexadecimales (32 bytes); necesario para guardar tokens Bearer en base de datos. Ejemplo: `openssl rand -hex 32`. |

   Opciones del agregador: `PULSE_FETCH_TIMEOUT_MS`, `PULSE_ROUND_TIMEOUT_MS`, `PULSE_CACHE_TTL_MS`, `PULSE_RATE_LIMIT_*`, `PULSE_SOURCES`, `PULSE_MERGE_ENV_SOURCES`. Detalle en [`docs/pulse-aggregator.md`](docs/pulse-aggregator.md).

3. **Desarrollo local**

   ```bash
   npm run dev
   ```

   Abre [https://pulse.excelso.xyz](https://pulse.excelso.xyz).

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

### API de voz (sin sesión; token en Cuenta)

Rutas bajo **`/api/v1/voice/`** — autenticación con Bearer (token por usuario recomendado; opción legacy documentada). No uses el token en query string.

| Ruta | `pulse_contract` (respuesta) | `pulse_version` |
|------|-------------------------------|----------------|
| `POST …/voice/fulfillment` | `voice-fulfillment-v1` | `1` |
| `POST …/voice/report` | `voice-report-v1` | `1` |

Detalle, `curl`, TTS y rate limit: [`docs/voice-fulfillment.md`](docs/voice-fulfillment.md) · despliegue: [`docs/deploy-voice-vercel.md`](docs/deploy-voice-vercel.md) · estrategia: [`../docs/estrategia-voz-hub.md`](../docs/estrategia-voz-hub.md).

## Paquete npm: `excelso-pulse-express`

El código fuente está en [`../npm/`](../npm/). Implementa el JSON **Health & Business Pulse** (`pulse_version: "1"`) que esta app agrega, con comprobaciones opcionales de **MongoDB** en infraestructura y protección **Bearer** en el helper de Express.

Más detalle: [`../npm/README.es.md`](../npm/README.es.md) (español) y [`../npm/README.md`](../npm/README.md) (inglés).

### Paso a paso — backend Express

1. **Instalar dependencias**

   ```bash
   npm install excelso-pulse-express express mongoose
   ```

   `mongoose` solo hace falta si usas los **probes por defecto** (ping a Mongo). Puedes omitirlo si pasas tus propios `probes` / `getProbes`.

2. **Definir un token de servicio largo y aleatorio**

   Es el secreto compartido entre tu API de producto y Excelso Pulse (el mismo valor que guardas cifrado en el registro del proyecto). Por ejemplo en entorno: `PULSE_BEARER_TOKEN`.

3. **Montar el router**

   Si `bearerToken` falta o está vacío, **`createPulseExpressRouter` devuelve `null`** y no se registra ninguna ruta.

   ```ts
   import express from "express";
   import { createPulseExpressRouter } from "excelso-pulse-express";

   const app = express();

   const pulse = createPulseExpressRouter({
     bearerToken: process.env.PULSE_BEARER_TOKEN,
     productName: process.env.PULSE_PRODUCT_NAME ?? "mi-app",
     environment: process.env.NODE_ENV,
     aiContext: process.env.PULSE_AI_CONTEXT ?? "",
     businessMetricsJson: process.env.PULSE_BUSINESS_METRICS_JSON,
     relativePath: "pulse", // con el mount de abajo → GET /internal/pulse
   });

   if (pulse) {
     app.use("/internal", pulse);
   }
   ```

4. **Ajustes opcionales**

   - `rateLimit`: por defecto ~60 peticiones/minuto por IP; pasa `false` para desactivarlo.
   - `probeTimeoutMs` / `collectionTimeoutMs`: timeouts de los probes y de toda la recolección (por defecto 150 ms / 300 ms en `collectPulse`).
   - `probes` / `getProbes`: sustituye el probe Mongo por tus propias comprobaciones.

5. **Probar el endpoint**

   ```bash
   curl -sS -H "Authorization: Bearer TU_TOKEN" http://localhost:PUERTO/internal/pulse
   ```

   Deberías recibir JSON con `pulse_version`, `status`, `context`, `metrics` e `infrastructure`.

### Paso a paso — `collectPulse` sin Express (Next.js, workers, pruebas)

1. **Instala** el mismo paquete (`excelso-pulse-express`); en este flujo **no** necesitas Express.
2. **Llama** a `collectPulse({ productName, environment, aiContext, businessMetricsJson, probes, … })` y devuelve o registra el `PulsePayload`.
3. **Protege la ruta tú mismo** en producción (el ejemplo en [`../npm/README.es.md`](../npm/README.es.md) no añade Bearer a un Route Handler público).

### Desarrollar o enlazar el paquete desde este repo

```bash
cd npm
npm install
npm run build
```

Desde otra app, apunta a la carpeta con `npm install /ruta/a/excelso-pulse/npm` (o dependencia `file:`) mientras iteras.

## Documentación

- [`../docs/estrategia-y-enfoque.md`](../docs/estrategia-y-enfoque.md) — Estrategia del monorepo, fases y checklist.
- [`docs/pulse-aggregator.md`](docs/pulse-aggregator.md) — Comportamiento del agregador, variables y endpoints.
- [`docs/health-business-pulse.md`](docs/health-business-pulse.md) — Contrato de referencia del backend `GET /internal/pulse`.
- [`docs/voice-fulfillment.md`](docs/voice-fulfillment.md) — Webhook Dialogflow ES, reporte JSON y contratos de voz.
- [`docs/deploy-voice-vercel.md`](docs/deploy-voice-vercel.md) — Despliegue de voz y secretos (Vercel/VPS).

## Seguridad

- No subas `.env` ni secretos reales al repositorio.
- Los valores Bearer se cifran antes de persistir; la resolución del token ocurre solo en servidor al llamar a las APIs de producto.

## Licencia

MIT — ver [`package.json`](package.json). La librería en `npm/` usa ISC — ver [`../npm/LICENSE`](../npm/LICENSE).
