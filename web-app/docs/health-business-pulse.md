# Contrato `GET /internal/pulse` (referencia)

Versión orientativa: **`pulse_version`**: `"1"` (string o número coercible a string).

## Campos recomendados

- `name`, `description`, `icon` (opcionales en agregador; el panel usa el registro Mongo para nombre/icono si faltan).
- `status`: `operational` | `degraded` | `down`
- `metrics`: `{ latency_ms, uptime_percent, requests_24h, error_rate }` (parciales permitidos).
- `kpis`: array de `{ label, value, trend? }`
- `infrastructure`: `{ vercel?, ai_api?, database?: "mongodb"|"postgres", db_status? }`
- `ai_context`: string
- `logs`: `{ timestamp, event, type }[]`
- `last_updated`: ISO string

El agregador en `lib/pulse/normalize.ts` acepta respuestas parciales y marca `contract_version: "unknown"` si el JSON no encaja.
