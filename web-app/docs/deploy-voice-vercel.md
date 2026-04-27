# Deployment voz (Vercel / VPS)

Esta guía cubre el despliegue operativo del webhook de voz para `POST /api/v1/voice/fulfillment`.

## Variables de entorno requeridas

- `MONGODB_URI`
- `PULSE_SECRETS_MASTER_KEY`
- `VOICE_WEBHOOK_SECRET`

Recomendadas para voz:

- `VOICE_WEBHOOK_ALT_HEADER_NAME` (ej. `x-monitoring-token`)
- `VOICE_DEFAULT_USER_EMAIL` (si no enviarás `x-excelso-user-email`)
- `VOICE_PULSE_CACHE_TTL_MS` (default 45000)
- `VOICE_PULSE_ROUND_TIMEOUT_MS` (default 9000)
- `VOICE_PULSE_FETCH_TIMEOUT_MS` (default 4000)
- `PULSE_MAX_CONCURRENCY` (default efectivo: 8 en rama voz si no está definido)

## Vercel

1. Entra al proyecto en Vercel → **Settings** → **Environment Variables**.
2. Carga las variables de arriba en `Production` (y `Preview` si aplica).
3. Redeploy del proyecto para que tomen efecto.
4. Verifica:
   - `POST https://<dominio>/api/v1/voice/fulfillment`
   - Header `Authorization: Bearer <VOICE_WEBHOOK_SECRET>`
   - Body JSON Dialogflow ES mínimo con `queryResult`.

## VPS / Node

1. Define las variables en el entorno del proceso (`systemd`, Docker env, etc.).
2. Reinicia el servicio.
3. Repite la verificación HTTP del webhook.

## Verificación rápida por cURL

```bash
curl -sS -X POST "https://<dominio>/api/v1/voice/fulfillment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOICE_WEBHOOK_SECRET>" \
  -H "x-excelso-user-email: tu@correo.com" \
  -d '{"queryResult":{"queryText":"estado","languageCode":"es"}}'
```

Debe devolver `fulfillmentText` y `fulfillmentMessages`.

## Validación en Google Home (manual)

1. En Dialogflow ES, crea/ajusta intención de estado.
2. Activa webhook y configura la URL de fulfillment.
3. Configura headers (Bearer y, si aplica, `x-excelso-user-email`).
4. Prueba en simulador y luego en dispositivo real.
5. Si falla, revisa logs del deployment (`[voice] fulfillment`) y que el correo exista en MongoDB.
