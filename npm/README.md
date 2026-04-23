# excelso-pulse-express

<img src="https://github.com/nitdraig/excelso-pulse/npm/public/web-app-manifest-512x512.png" alt="Excelso Pulse logo" width="128" height="128">

> **Español:** [README.es.md](./README.es.md)

**Health & Business Pulse** for **Express** apps (and reusable from **Next.js** or other runtimes via `collectPulse`).

- Stable JSON (`pulse_version: "1"`), technical metrics, optional business KPIs, `ai_context` text, pluggable infrastructure probes.
- **`Authorization: Bearer`** protection (timing-safe comparison).
- Default **MongoDB** probe (`ping` + transient state handling).
- Optional Express router with per-IP **rate limiting**.

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
| `createPulseBearerAuthMiddleware`                      | Bearer-only middleware for custom routes. |
| `getDefaultPulseProbes`, `createMongooseDatabaseProbe` | Extend infrastructure checks.             |
| Types (`PulsePayload`, `PulseProbe`, …)                | TypeScript contract.                      |

## Configuration hints

Use a long random service token for `bearerToken` (from env). Business metrics: pass JSON as a string in `businessMetricsJson` or set it from env in your app. Tune `probeTimeoutMs` / `collectionTimeoutMs` if probes are slow.

## License

ISC — see `LICENSE`.
