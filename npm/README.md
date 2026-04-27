# excelso-pulse-express

<img src="https://github.com/nitdraig/excelso-pulse/blob/main/npm/public/web-app-manifest-512x512.png" alt="Excelso Pulse logo" width="128" height="128">

> **Español:** [README.es.md](./README.es.md)

**Health & Business Pulse** for **Express** apps (and reusable from **Next.js** or other runtimes via `collectPulse`).

- Stable JSON (`pulse_version: "1"`), technical metrics, optional business KPIs, `ai_context` text, pluggable infrastructure probes.
- **`readiness`** (`starting` \| `ready`) and **`user_impact`** (`none` \| `limited` \| `outage`) computed server-side (e.g. Mongo `connecting` → `starting` + `none` so UIs do not treat it as an outage).
- **`Authorization: Bearer`** protection (timing-safe comparison), optional **`x-monitoring-token`** (or any header name you configure) with the **same** service secret.
- Default **MongoDB** probe (`ping` + transient state handling).
- Optional Express router with per-IP **rate limiting**.

## Contract (`pulse_version: "1"`)

| Field | Required | Notes |
| ----- | -------- | ----- |
| `pulse_version` | yes | Literal `"1"` for this release line. |
| `status` | yes | Aggregated infra: `ok` \| `degraded` \| `down`. |
| `readiness` | yes | `starting` \| `ready` (e.g. Mongo still connecting). |
| `user_impact` | yes | `none` \| `limited` \| `outage` — presentation hint for UIs/voice. |
| `context` | yes | `product_name`, `environment`, `generated_at`, `collection_duration_ms`. |
| `ai_context` | yes | String; may be empty. |
| `metrics` | yes | `technical` (uptime, Node, memory) + `business` (object; `{}` if unset). |
| `infrastructure` | yes | Array of probe results (may be empty if you pass no probes). |

Minimal shape (values illustrative):

```json
{
  "pulse_version": "1",
  "status": "ok",
  "readiness": "ready",
  "user_impact": "none",
  "context": {
    "product_name": "my-app",
    "environment": "production",
    "generated_at": "2026-04-22T12:00:00.000Z",
    "collection_duration_ms": 12
  },
  "ai_context": "",
  "metrics": {
    "technical": {
      "uptime_s": 3600,
      "node_version": "v22.0.0",
      "memory": {
        "heap_used_mb": 42,
        "heap_total_mb": 64,
        "external_mb": 2
      }
    },
    "business": {}
  },
  "infrastructure": []
}
```

## Authentication

- **`createPulseExpressRouter`**: installs middleware **before** `collectPulse` so probes never run unauthenticated.
- **Bearer (default):** `Authorization: Bearer <same secret as bearerToken>`.
- **Optional header:** set `monitoringTokenHeaderName` (e.g. `"x-monitoring-token"`) to allow the same secret in that header — useful for webhooks or proxies that cannot send `Authorization`.
- **`createPulseBearerAuthMiddleware`:** pass `{ alternateHeaderName: "x-monitoring-token" }` as the second argument for custom routes.

## Privacy (default Mongo probe)

The default probe only checks **connectivity / readiness** (e.g. `mongoose.connection.readyState`, `db.admin().ping()`). It does **not** ship row data, schemas, or PII. To avoid Mongo entirely, pass your own `probes` / `getProbes` and skip `getDefaultPulseProbes`.

## Injecting probes

Pass **`probes: PulseProbe[]`** or **`getProbes: () => PulseProbe[]`** into `createPulseExpressRouter` / `collectPulse`. If neither is set, the package uses **`getDefaultPulseProbes()`** (Mongo when Mongoose is connected).

## Versioning

Public JSON and TypeScript exports follow **SemVer**; breaking contract changes bump **major**. See [`CHANGELOG.md`](./CHANGELOG.md).

## Install

```bash
npm install excelso-pulse-express express mongoose
```

`mongoose` is a **peer dependency** if you use the default probes; supply `getProbes` / `probes` to avoid it.

## Express: mount the endpoint

```ts
import express from "express";
import { createPulseExpressRouter } from "excelso-pulse-express";

const app = express();

const pulse = createPulseExpressRouter({
  bearerToken: process.env.PULSE_BEARER_TOKEN,
  monitoringTokenHeaderName: "x-monitoring-token", // optional; same secret as bearerToken
  productName: process.env.PULSE_PRODUCT_NAME ?? "my-app",
  environment: process.env.NODE_ENV,
  aiContext: process.env.PULSE_AI_CONTEXT ?? "",
  businessMetricsJson: process.env.PULSE_BUSINESS_METRICS_JSON,
  relativePath: "pulse", // GET /internal/pulse when mounted below
});

if (pulse) {
  app.use("/internal", pulse);
}
```

If `bearerToken` is missing or empty, `createPulseExpressRouter` returns **`null`** (no route is exposed).

## Next.js / aggregator (data only)

```ts
import { collectPulse } from "excelso-pulse-express";

export async function GET() {
  const body = await collectPulse({
    productName: "web",
    businessMetricsJson: process.env.PULSE_BUSINESS_METRICS_JSON,
  });
  return Response.json(body);
}
```

Add your own auth in production; this sample does not enforce Bearer on the Route Handler.

## Public API

| Export                                                 | Purpose                                   |
| ------------------------------------------------------ | ----------------------------------------- |
| `createPulseExpressRouter`                             | Ready-to-mount Express `Router`.          |
| `collectPulse`                                         | Build the payload without Express.        |
| `createPulseBearerAuthMiddleware`                      | Bearer (+ optional alternate header) middleware for custom routes. |
| `getDefaultPulseProbes`, `createMongooseDatabaseProbe` | Extend infrastructure checks.             |
| `derivePulsePresentation`                              | Same heuristic as `collectPulse` if you build JSON manually. |
| Types (`PulsePayload`, `PulseProbe`, `PulseReadiness`, …) | TypeScript contract.                   |

## Configuration hints

Use a long random service token for `bearerToken` (from env). Business metrics: pass JSON as a string in `businessMetricsJson` or set it from env in your app. Tune `probeTimeoutMs` / `collectionTimeoutMs` if probes are slow.

## License

ISC — see `LICENSE`.
