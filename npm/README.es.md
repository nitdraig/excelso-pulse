# excelso-pulse-express

> **English:** [README.md](./README.md)

**Health & Business Pulse** para aplicaciones **Express** (y reutilizable en **Next.js** u otros runtimes mediante `collectPulse`).

- JSON estable (`pulse_version: "1"`), métricas técnicas, KPIs de negocio opcionales, texto `ai_context`, infraestructura con probes enchufables.
- Campos **`readiness`** (`starting` \| `ready`) y **`user_impact`** (`none` \| `limited` \| `outage`) derivados en servidor (cold start Mongo `connecting` → `starting` + `none` sin alarmar la UI).
- Protección **`Authorization: Bearer`** (comparación resistente a timing) y cabecera opcional (p. ej. **`x-monitoring-token`**) con el **mismo** secreto de servicio.
- Probe por defecto **MongoDB** (`ping` + manejo de estados transitorios).
- Router Express opcional con **rate limit** por IP.

## Contrato (`pulse_version: "1"`)

| Campo | Obligatorio | Notas |
| ----- | ----------- | ----- |
| `pulse_version` | sí | Literal `"1"` en esta línea de versiones. |
| `status` | sí | Infra agregada: `ok` \| `degraded` \| `down`. |
| `readiness` | sí | `starting` \| `ready` (p. ej. Mongo aún conectando). |
| `user_impact` | sí | `none` \| `limited` \| `outage` — pista para UI/voz. |
| `context` | sí | `product_name`, `environment`, `generated_at`, `collection_duration_ms`. |
| `ai_context` | sí | Cadena; puede ir vacía. |
| `metrics` | sí | `technical` (uptime, Node, memoria) + `business` (objeto; `{}` si no hay datos). |
| `infrastructure` | sí | Array de resultados de probes (puede estar vacío si no hay probes). |

Forma mínima (valores ilustrativos):

```json
{
  "pulse_version": "1",
  "status": "ok",
  "readiness": "ready",
  "user_impact": "none",
  "context": {
    "product_name": "mi-app",
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

## Autenticación

- **`createPulseExpressRouter`**: el middleware corre **antes** de `collectPulse`, así que los probes no se ejecutan sin credencial válida.
- **Bearer (por defecto):** `Authorization: Bearer <mismo secreto que bearerToken>`.
- **Cabecera opcional:** define `monitoringTokenHeaderName` (p. ej. `"x-monitoring-token"`) para aceptar el mismo secreto en esa cabecera — útil en webhooks o proxies que no envían `Authorization`.
- **`createPulseBearerAuthMiddleware`:** segundo argumento `{ alternateHeaderName: "x-monitoring-token" }` en rutas propias.

## Privacidad (probe Mongo por defecto)

El probe por defecto solo comprueba **conectividad / preparación** (p. ej. `mongoose.connection.readyState`, `db.admin().ping()`). **No** envía filas, esquemas ni PII. Para no usar Mongo, pasa tus propios `probes` / `getProbes` y evita `getDefaultPulseProbes`.

## Inyección de probes

Pasa **`probes: PulseProbe[]`** o **`getProbes: () => PulseProbe[]`** a `createPulseExpressRouter` / `collectPulse`. Si no, el paquete usa **`getDefaultPulseProbes()`** (Mongo cuando Mongoose está conectado).

## Versionado

El JSON público y los exports TypeScript siguen **SemVer**; cambios que rompan contrato suben **major**. Ver [`CHANGELOG.md`](./CHANGELOG.md).

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
  monitoringTokenHeaderName: "x-monitoring-token", // opcional; mismo secreto que bearerToken
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
| `createPulseBearerAuthMiddleware` | Middleware Bearer (+ cabecera alternativa opcional) en rutas propias. |
| `getDefaultPulseProbes`, `createMongooseDatabaseProbe` | Ampliar chequeos de infraestructura. |
| `derivePulsePresentation` | Misma heurística que `collectPulse` para clientes que armen el JSON a mano. |
| Tipos (`PulsePayload`, `PulseProbe`, `PulseReadiness`, …) | Contrato TypeScript. |

## Configuración

Usa un token de servicio largo y aleatorio en `bearerToken` (desde variables de entorno). Métricas de negocio: pasa JSON en string en `businessMetricsJson` o léelo del env en tu app. Ajusta `probeTimeoutMs` / `collectionTimeoutMs` si los probes son lentos.

## Licencia

ISC — ver `LICENSE`.
