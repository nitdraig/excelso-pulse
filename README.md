# Excelso Pulse

**Excelso Pulse** is a command-center web app for the Excelso ecosystem. It aggregates health and business signals from multiple product backends, stores project metadata and encrypted secrets in MongoDB, and presents a unified dashboard per signed-in user.

[Leer en español](README.es.md)

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

## Getting started

1. **Clone and install**

   ```bash
   git clone https://github.com/excelso/excelso-pulse.git
   cd excelso-pulse
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in at least:

   | Variable | Purpose |
   |----------|---------|
   | `MONGODB_URI` | MongoDB connection string (users + projects). |
   | `AUTH_SECRET` | Auth.js secret (`npx auth secret`). |
   | `PULSE_SECRETS_MASTER_KEY` | 64 hex chars (32 bytes); required to save Bearer tokens in the database. Example: `openssl rand -hex 32`. |

   Optional aggregator tuning: `PULSE_FETCH_TIMEOUT_MS`, `PULSE_ROUND_TIMEOUT_MS`, `PULSE_CACHE_TTL_MS`, `PULSE_RATE_LIMIT_*`, `PULSE_SOURCES`, `PULSE_MERGE_ENV_SOURCES`. See `docs/pulse-aggregator.md`.

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

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit tests) |

## API overview (session-authenticated)

Typical routes used by the UI and BFFs:

- `GET /api/portfolio` — User’s projects merged with the latest aggregated pulse round.
- `GET /api/pulse/summary` — Raw aggregated `entries[]`.
- `GET|POST /api/projects` — List / create registry entries.
- `GET|PATCH|DELETE /api/projects/[slug]` — Read / update / delete a source.

Responses do not expose raw Bearer tokens or ciphertext details.

## Documentation

- [`docs/pulse-aggregator.md`](docs/pulse-aggregator.md) — Aggregator behavior, env vars, endpoints.
- [`docs/health-business-pulse.md`](docs/health-business-pulse.md) — Reference contract for backend `GET /internal/pulse`.

## Security notes

- Never commit `.env` or real secrets.
- Bearer values are encrypted before persistence; resolve tokens only on the server when calling product APIs.

## License

MIT — see [`package.json`](package.json).
