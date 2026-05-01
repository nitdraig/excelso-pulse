# Deployment voz (Vercel / VPS)

Esta guía cubre el despliegue operativo de **`POST /api/v1/voice/fulfillment`** (Dialogflow) y **`POST /api/v1/voice/report`** (JSON para scripts).

## Variables de entorno requeridas

- `MONGODB_URI`
- `PULSE_SECRETS_MASTER_KEY`

Recomendadas para voz:

- `VOICE_WEBHOOK_ALT_HEADER_NAME` (ej. `x-monitoring-token`)
- `VOICE_WEBHOOK_SECRET` (solo fallback legacy single-user)
- `VOICE_DEFAULT_USER_EMAIL` (solo fallback legacy si no enviarás `x-excelso-user-email`)
- `VOICE_PULSE_CACHE_TTL_MS` (default 45000)
- `VOICE_PULSE_ROUND_TIMEOUT_MS` (default 9000)
- `VOICE_PULSE_FETCH_TIMEOUT_MS` (default 4000)
- `VOICE_TTS_MAX_CHARS` (default efectivo ~720; `≤0` = sin truncado tras sanitizar)
- `PULSE_MAX_CONCURRENCY` (default efectivo: 8 en rama voz si no está definido)

## Vercel

1. Entra al proyecto en Vercel → **Settings** → **Environment Variables**.
2. Carga las variables de arriba en `Production` (y `Preview` si aplica).
3. Redeploy del proyecto para que tomen efecto.
4. Verifica:
   - **Fulfillment:** `POST https://<dominio>/api/v1/voice/fulfillment` con Dialogflow ES mínimo (`queryResult`).
   - **Reporte:** `POST https://<dominio>/api/v1/voice/report` con Bearer del token de usuario o del secreto legacy (ver `voice-fulfillment.md`).

## VPS / Node

1. Define las variables en el entorno del proceso (`systemd`, Docker env, etc.).
2. Reinicia el servicio.
3. Repite la verificación HTTP del webhook.

## Flujo recomendado (multiusuario)

1. Usuario logueado crea/rota token:
   - `POST /api/account/voice-token`
2. Guarda el token en Dialogflow como `Authorization: Bearer <VOICE_USER_TOKEN>`.
3. Webhook resuelve el usuario por hash y arma su informe.

## Verificación rápida por cURL

```bash
curl -sS -X POST "https://<dominio>/api/v1/voice/fulfillment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOICE_WEBHOOK_SECRET>" \
  -H "x-excelso-user-email: tu@correo.com" \
  -d '{"queryResult":{"queryText":"estado","languageCode":"es"}}'
```

Debe devolver `fulfillmentText` y `fulfillmentMessages` (y opcionalmente `pulse_contract` / `pulse_version` en el mismo JSON).

### Verificación rápida del reporte JSON

Token por usuario (recomendado):

```bash
curl -sS -X POST "https://<dominio>/api/v1/voice/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOICE_USER_TOKEN>" \
  -d '{"lang":"es"}'
```

Legacy (secreto de instancia + correo):

```bash
curl -sS -X POST "https://<dominio>/api/v1/voice/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOICE_WEBHOOK_SECRET>" \
  -H "x-excelso-user-email: tu@correo.com" \
  -d '{}'
```

## Validación en Google Home (manual)

1. En Dialogflow ES, crea/ajusta intención de estado.
2. Activa webhook y configura la URL de fulfillment.
3. Configura headers (Bearer y, si aplica, `x-excelso-user-email`).
4. Prueba en simulador y luego en dispositivo real.
5. Si falla, revisa logs del deployment (`[voice] fulfillment`) y que el correo exista en MongoDB.
