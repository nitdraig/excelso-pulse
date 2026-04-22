# Agregador Pulse (Excelso Pulse)

Esta app actúa como **cliente** de cada backend: llama `GET {pulseUrl}` con `Authorization: Bearer …`. El token se guarda **cifrado** en MongoDB (`bearerEnc`) usando `PULSE_SECRETS_MASTER_KEY`, o bien —solo en orígenes legados— se resuelve desde una variable de entorno (`secretEnvKey`).

## Alta de un origen

1. En cada API producto, expón `GET …/internal/pulse` protegido con un Bearer propio.
2. En el despliegue de **Pulse**, define `PULSE_SECRETS_MASTER_KEY` (64 hex, ver tabla de variables).
3. En el panel, **Nuevo origen**: slug, nombre, URL del front (opcional), URL **pulse** del backend y el **token Bearer** (campo oculto). El token se cifra antes de persistir; las respuestas de lectura no lo devuelven.
4. **Legado:** orígenes que solo tengan `secretEnvKey` + variable de entorno siguen funcionando hasta que pegues un token nuevo en edición (pasará a guardarse cifrado y se limpiará la referencia env).

## Endpoints

| Ruta | Uso |
|------|-----|
| `GET /api/portfolio` | Sesión: lista de proyectos del usuario **fusionada** con la última ronda agregada (lo usa el dashboard). |
| `GET /api/pulse/summary` | Sesión: JSON agregado crudo (`entries[]`) para UI secundaria, otro BFF o jobs. |
| `GET /api/projects` | Registro en Mongo sin llamar a backends (placeholders sin live). |
| `GET /api/projects/{slug}` | Detalle para edición: `pulseUrl`, `hasBearer`, etc. **No** devuelve el token ni el cifrado. |
| `PATCH /api/projects/{slug}` | Actualiza campos del origen; invalida caché del agregador. |
| `DELETE /api/projects/{slug}` | Elimina el registro en MongoDB (no borra variables de entorno). |

Ninguno devuelve secretos.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | Cadena de conexión MongoDB. |
| `AUTH_SECRET` | Secreto de Auth.js. |
| `PULSE_SECRETS_MASTER_KEY` | **Obligatorio** para guardar tokens en BD: 64 caracteres hex (32 bytes). Ej.: `openssl rand -hex 32`. AES-256-GCM en reposo; sin esto, alta/edición de token responde 503. |
| `PULSE_FETCH_TIMEOUT_MS` | Timeout por backend (default `5000`). |
| `PULSE_ROUND_TIMEOUT_MS` | Tiempo máximo de la ronda; aborta peticiones en curso (default `12000`). |
| `PULSE_CACHE_TTL_MS` | Caché en memoria del agregado por usuario (default `15000`; `0` desactiva). |
| `PULSE_RATE_LIMIT_MAX` | Máx. peticiones por ventana y usuario (default `60`). |
| `PULSE_RATE_LIMIT_WINDOW_MS` | Ventana del rate limit (default `60000`). |
| `PULSE_SOURCES` | JSON opcional: `[{"id":"…","pulseUrl":"…","secretEnvKey":"…"}]`. |
| `PULSE_MERGE_ENV_SOURCES` | `1` o `true` para mezclar `PULSE_SOURCES` con los orígenes del usuario (**solo single-tenant**). |

## Contrato del backend

Ver `docs/health-business-pulse.md`. Campos opcionales se rellenan con valores por defecto en `lib/pulse/normalize.ts`.

## Tests

```bash
npm run test
```

Los tests mockean `fetch` y no llaman APIs reales.
