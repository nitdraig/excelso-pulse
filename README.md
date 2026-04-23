# Excelso Pulse

<img src="https://github.com/nitdraig/excelso-pulse/blob/main/npm/public/web-app-manifest-512x512.png" alt="Excelso Pulse logo" width="128" height="128">

**Excelso Pulse** is a command-center web app for the Excelso ecosystem. It aggregates health and business signals from multiple product backends, stores project metadata and encrypted secrets in MongoDB, and presents a unified dashboard per signed-in user.

[Leer en español](README.es.md)

## Monorepo layout

- [`web-app/`](web-app/) — Next.js command center (dashboard, Auth.js, MongoDB registry, pulse aggregator).
- [`npm/`](npm/) — Publishable package **`excelso-pulse-express`**: Express router + `collectPulse()` for product backends that expose `GET /internal/pulse`.

## Features

- **Authentication** — Email and password (Auth.js v5), protected routes, registration.
- **Project registry** — CRUD for “pulse sources”: name, slug, optional public app URL, backend pulse URL, Bearer token stored **encrypted at rest** (AES-256-GCM).
- **Pulse aggregator** — Server-side parallel fetch of each backend’s `GET …/internal/pulse` with Bearer auth, timeouts, in-memory cache, and rate limiting.
- **Normalization** — Accepts several pulse JSON shapes (flat metrics, nested `metrics.technical` / `context`, `infrastructure` as an object or a component list).
- **Dashboard UI** — Cards with status, latency, infrastructure hints, KPIs, and detail sheets.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- [Auth.js](https://authjs.dev/) (NextAuth v5)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Vitest](https://vitest.dev/) for unit tests

## Prerequisites

- Node.js 22+ (recommended; align with `package.json` engines if present)
- A MongoDB deployment (connection string)
- `AUTH_SECRET` and `PULSE_SECRETS_MASTER_KEY` for production-like runs (see below)

## Getting started (web app)

1. **Clone and install**

   ```bash
   git clone https://github.com/excelso/excelso-pulse.git
   cd excelso-pulse/web-app
   npm install
   ```

2. **Environment**

   Copy `web-app/.env.example` to `web-app/.env` and fill in at least:

   | Variable                   | Purpose                                                                                                   |
   | -------------------------- | --------------------------------------------------------------------------------------------------------- |
   | `MONGODB_URI`              | MongoDB connection string (users + projects).                                                             |
   | `AUTH_SECRET`              | Auth.js secret (`npx auth secret`).                                                                       |
   | `PULSE_SECRETS_MASTER_KEY` | 64 hex chars (32 bytes); required to save Bearer tokens in the database. Example: `openssl rand -hex 32`. |

   Optional aggregator tuning: `PULSE_FETCH_TIMEOUT_MS`, `PULSE_ROUND_TIMEOUT_MS`, `PULSE_CACHE_TTL_MS`, `PULSE_RATE_LIMIT_*`, `PULSE_SOURCES`, `PULSE_MERGE_ENV_SOURCES`. See [`web-app/docs/pulse-aggregator.md`](web-app/docs/pulse-aggregator.md).

3. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. **Build**

   ```bash
   npm run build
   npm start
   ```

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Next.js development server |
| `npm run build` | Production build           |
| `npm run start` | Start production server    |
| `npm run lint`  | ESLint                     |
| `npm run test`  | Vitest (unit tests)        |

## API overview (session-authenticated)

Typical routes used by the UI and BFFs:

- `GET /api/portfolio` — User’s projects merged with the latest aggregated pulse round.
- `GET /api/pulse/summary` — Raw aggregated `entries[]`.
- `GET|POST /api/projects` — List / create registry entries.
- `GET|PATCH|DELETE /api/projects/[slug]` — Read / update / delete a source.

Responses do not expose raw Bearer tokens or ciphertext details.

## npm package: `excelso-pulse-express`

Source lives in [`npm/`](npm/). It implements the **Health & Business Pulse** JSON (`pulse_version: "1"`) that the web app aggregates, with optional **MongoDB** infrastructure checks and **Bearer** protection on the Express helper.

More detail: [`npm/README.md`](npm/README.md) (English) and [`npm/README.es.md`](npm/README.es.md) (español).

### Step-by-step — use in an Express backend

1. **Install dependencies**

   ```bash
   npm install excelso-pulse-express express mongoose
   ```

   `mongoose` is only required if you use the **default probes** (Mongo ping). You can omit it if you pass your own `probes` / `getProbes`.

2. **Define a long random service token**

   This is the shared secret between your product API and Excelso Pulse (same value you store encrypted in the project registry). Put it in env, for example `PULSE_BEARER_TOKEN`.

3. **Wire the router**

   If `bearerToken` is missing or empty, **`createPulseExpressRouter` returns `null`** and no route is registered.

   ```ts
   import express from "express";
   import { createPulseExpressRouter } from "excelso-pulse-express";

   const app = express();

   const pulse = createPulseExpressRouter({
     bearerToken: process.env.PULSE_BEARER_TOKEN,
     productName: process.env.PULSE_PRODUCT_NAME ?? "my-app",
     environment: process.env.NODE_ENV,
     aiContext: process.env.PULSE_AI_CONTEXT ?? "",
     businessMetricsJson: process.env.PULSE_BUSINESS_METRICS_JSON,
     relativePath: "pulse", // with mount below → GET /internal/pulse
   });

   if (pulse) {
     app.use("/internal", pulse);
   }
   ```

4. **Optional tuning**
   - `rateLimit`: default ~60 requests/minute per IP; pass `false` to disable.
   - `probeTimeoutMs` / `collectionTimeoutMs`: timeouts for infrastructure probes and the whole collection (defaults 150 ms / 300 ms in `collectPulse`).
   - `probes` / `getProbes`: replace the default Mongo probe with your own checks.

5. **Smoke-test the endpoint**

   ```bash
   curl -sS -H "Authorization: Bearer YOUR_TOKEN" http://localhost:PORT/internal/pulse
   ```

   You should receive JSON with `pulse_version`, `status`, `context`, `metrics`, and `infrastructure`.

### Step-by-step — headless `collectPulse` (Next.js, workers, tests)

1. **Install** the same package (`excelso-pulse-express`); you do **not** need Express for this path.
2. **Call** `collectPulse({ productName, environment, aiContext, businessMetricsJson, probes, … })` and return or log the `PulsePayload`.
3. **Protect the route yourself** in production (the sample in `npm/README.md` does not add Bearer auth to a public Route Handler).

### Develop or link the package from this repo

```bash
cd npm
npm install
npm run build
```

Point a consumer app at the folder with `npm install /path/to/excelso-pulse/npm` (or a `file:` dependency) while iterating.

## Documentation

- [`web-app/docs/pulse-aggregator.md`](web-app/docs/pulse-aggregator.md) — Aggregator behavior, env vars, endpoints.
- [`web-app/docs/health-business-pulse.md`](web-app/docs/health-business-pulse.md) — Reference contract for backend `GET /internal/pulse`.

## Security notes

- Never commit `.env` or real secrets.
- Bearer values are encrypted before persistence; resolve tokens only on the server when calling product APIs.

## License

MIT — see [`web-app/package.json`](web-app/package.json). The npm library uses ISC — see [`npm/LICENSE`](npm/LICENSE).
