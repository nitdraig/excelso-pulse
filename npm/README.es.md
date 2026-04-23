# excelso-pulse-express

> **English:** [README.md](./README.md)

**Health & Business Pulse** para aplicaciones **Express** (y reutilizable en **Next.js** u otros runtimes mediante `collectPulse`).

- JSON estable (`pulse_version: "1"`), métricas técnicas, KPIs de negocio opcionales, texto `ai_context`, infraestructura con probes enchufables.
- Protección **`Authorization: Bearer`** (comparación resistente a timing).
- Probe por defecto **MongoDB** (`ping` + manejo de estados transitorios).
- Router Express opcional con **rate limit** por IP.

## Instalación

```bash
npm install excelso-pulse-express express mongoose
```

`mongoose` es *peer dependency* si usas los probes por defecto; puedes pasar `getProbes` / `probes` y no depender de Mongoose.

## Express: montar el endpoint

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
  relativePath: "pulse", // GET /internal/pulse con el mount de abajo
});

if (pulse) {
  app.use("/internal", pulse);
}
```

Sin `bearerToken` válido, `createPulseExpressRouter` devuelve **`null`** (no se expone ninguna ruta).

## Next.js / agregador (solo datos)

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

En producción añade tu propia autenticación; este ejemplo no exige Bearer en el Route Handler.

## API exportada

| Export | Uso |
|--------|-----|
| `createPulseExpressRouter` | `Router` de Express listo para montar. |
| `collectPulse` | Construir el JSON sin Express. |
| `createPulseBearerAuthMiddleware` | Solo middleware Bearer sobre rutas propias. |
| `getDefaultPulseProbes`, `createMongooseDatabaseProbe` | Ampliar chequeos de infraestructura. |
| Tipos (`PulsePayload`, `PulseProbe`, …) | Contrato TypeScript. |

## Configuración

Usa un token de servicio largo y aleatorio en `bearerToken` (desde variables de entorno). Métricas de negocio: pasa JSON en string en `businessMetricsJson` o léelo del env en tu app. Ajusta `probeTimeoutMs` / `collectionTimeoutMs` si los probes son lentos.

## Licencia

ISC — ver `LICENSE`.
