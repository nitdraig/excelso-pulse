# Contrato `GET /internal/pulse` (referencia)

Versión orientativa: **`pulse_version`**: `"1"` (string o número coercible a string).

## Campos recomendados

- `name`, `description`, `icon` (opcionales en agregador; el panel usa el registro Mongo para nombre/icono si faltan).
- `status`: `operational` | `degraded` | `down` (señal **técnica** agregada; útil para alertas).
- `readiness` (opcional): `starting` | `ready` — transición interna (p. ej. BD conectando) frente a **listo para tráfico**.
- `user_impact` (opcional): `none` | `limited` | `outage` — **impacto percibido** para UI; si faltan, el agregador los infiere desde `status` + `infrastructure` (p. ej. `degraded` + Mongo `detail: "connecting"` → `starting` + `none`).
- `metrics`: `{ latency_ms, uptime_percent, requests_24h, error_rate }` (parciales permitidos).
- `kpis`: array de `{ label, value, trend? }`
- `infrastructure`: `{ vercel?, ai_api?, database?: "mongodb"|"postgres", db_status? }` **o** lista de componentes `{ id?, name?, kind?, status?, latency_ms?, detail? }` (recomendado para probes; `detail` alimenta la capa de presentación).
- `ai_context`: string
- `logs`: `{ timestamp, event, type }[]`
- `last_updated`: ISO string

El agregador en `lib/pulse/normalize.ts` acepta respuestas parciales y marca `contract_version: "unknown"` si el JSON no encaja.
