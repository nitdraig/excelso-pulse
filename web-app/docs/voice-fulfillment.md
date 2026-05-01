# Voz en el Hub: Dialogflow ES y reporte JSON

Este documento cubre:

1. **Webhook Dialogflow ES** — `POST /api/v1/voice/fulfillment`
2. **Reporte JSON** para scripts, Home Assistant, pruebas con `curl`, etc. — `POST /api/v1/voice/report`

Ambos **no usan sesión de navegador**: la identidad viene de un **token de voz por usuario** (recomendado) o del **fallback legacy** (secreto de instancia + correo objetivo).

---

## Dialogflow ES

Endpoint pensado para **Dialogflow ES** (fulfillment webhook): recibe el JSON con `queryResult` y responde con `fulfillmentText` / `fulfillmentMessages`.

Ruta: **`POST /api/v1/voice/fulfillment`**

## Autenticación

### Modo recomendado (multiusuario)

Cada usuario genera su propio token en `POST /api/account/voice-token`.

- En Dialogflow para ese usuario, envía:
  - `Authorization: Bearer <VOICE_USER_TOKEN>`
  - o cabecera alternativa si defines `VOICE_WEBHOOK_ALT_HEADER_NAME`.
- El webhook resuelve el usuario por hash del token (`VoiceIntegration`) y carga su portfolio.
- El token en claro solo se muestra al crear/rotar; en DB se guarda hash SHA-256.

### Fallback legacy (single-user)

1. Define **`VOICE_WEBHOOK_SECRET`** (valor largo y aleatorio).
2. En Dialogflow (o tu proxy), envía el mismo valor como:
   - `Authorization: Bearer <VOICE_WEBHOOK_SECRET>`, y/o
   - Cabecera alternativa si defines **`VOICE_WEBHOOK_ALT_HEADER_NAME`** (p. ej. `x-monitoring-token`).

Sin **credencial Bearer** válida (ni token de usuario reconocido ni, en modo legacy, el secreto de instancia que coincida): **401**. Para usar solo el modo legacy debe existir **`VOICE_WEBHOOK_SECRET`** configurado como en el servidor.

**No** envíes el token como query parameter en ninguna ruta de voz; usa cabeceras.

## Qué usuario se consulta

El informe sigue siendo el **portfolio MongoDB** de un usuario registrado en la instancia:

- **Modo multiusuario (token por usuario):** el usuario se infiere directamente del token.
- **Fallback legacy:** cabecera **`x-excelso-user-email`** o variable **`VOICE_DEFAULT_USER_EMAIL`**.

Si usas **solo** fulfillment Dialogflow con fallback y no hay cabecera **`x-excelso-user-email`** ni **`VOICE_DEFAULT_USER_EMAIL`**, la respuesta HTTP es **200** con texto de fulfillment explicando que falta configuración.

Si el correo no existe en MongoDB, **200** con texto de error amable.

Para el **reporte JSON**, los mismos fallos devuelven **400** (`voice_legacy_config_required`) o **404** (`user_not_found`) según corresponda, con cuerpo JSON estable.

## Cuerpo esperado (Dialogflow ES)

Mínimo: objeto JSON con **`queryResult`** (como envía Google). Se usa `languageCode` para español vs inglés en el resumen.

Ejemplos de error **400**: JSON inválido, o cuerpo sin `queryResult`.

## Agregación y caché (rama voz)

- Reutiliza `loadPulseAggregateForUser` con `{ voice: true }`: clave de caché `voice:user:<id>`, TTL por defecto **45 s** (`VOICE_PULSE_CACHE_TTL_MS`, `0` = sin caché de voz).
- Timeouts por defecto más ajustados para latencia de asistente: `VOICE_PULSE_ROUND_TIMEOUT_MS` (default `9000`), `VOICE_PULSE_FETCH_TIMEOUT_MS` (default `4000`).
- Concurrencia: si **`PULSE_MAX_CONCURRENCY`** > 0 se usa; si no está definido, en rama voz se limita a **8** GET concurrentes por ronda.

Al crear/editar/borrar proyectos se invalida también la caché de voz del usuario.

## Contrato interno de voz

Antes del adaptador Dialogflow, el Hub genera un objeto interno estable (**sin PII ni secretos**) con esta forma:

- `totalApps`: total de apps incluidas en la ronda.
- `locale`: `es` o `en`.
- `counts`: conteo por severidad (`outage`, `limited`, `ok`).
- `highlights`: lista breve (hasta 5) ordenada por severidad y nombre, con `appId`, `label`, `severity` y `userImpact`.
- `generatedAt`: timestamp ISO de creación del reporte.

Luego se genera el texto hablado con reglas deterministas (sin LLM en v1) y recién ahí se adapta al formato `fulfillmentText`/`fulfillmentMessages` de Dialogflow ES.

La respuesta del fulfillment también incluye metadatos de contrato (**`pulse_contract`**: `voice-fulfillment-v1`, **`pulse_version`**: `1`) junto al resto del JSON de Dialogflow, para scripts que parseen la respuesta íntegra.

### TTS (sanitización y truncado)

Tras montar el mensaje (incluido el sufijo de tiempos de ronda/caché en fulfillment), el Hub aplica sanitización para TTS y un tope de caracteres configurado por **`VOICE_TTS_MAX_CHARS`** (por defecto **720** en código; **`≤0`** = sin límite). Ver [`deploy-voice-vercel.md`](./deploy-voice-vercel.md).

---

## Reporte JSON (`POST /api/v1/voice/report`)

Para integraciones que no envían payload Dialogflow pero necesitan **JSON estable** con el mismo agregador y las mismas reglas de TTS sobre el campo `message`.

### Autenticación

Igual que fulfillment: **`Authorization: Bearer <token>`** (token de usuario o fallback legacy): mismas cabeceras y consideraciones que arriba.

### Cuerpo

Opcional y tolerante:

- `{}` válido vacío (idioma desde **`Accept-Language`**).
- O `{ "lang": "es" | "en" }` para fijar idioma sin depender de cabeceras.

### Respuesta (200 OK, éxito agregador)

Ejemplo semántico (valores inventados):

```json
{
  "pulse_contract": "voice-report-v1",
  "pulse_version": 1,
  "status": "ok",
  "locale": "es",
  "message": "Tienes…",
  "report": {
    "totalApps": 2,
    "locale": "es",
    "counts": { "outage": 0, "limited": 1, "ok": 1 },
    "highlights": [],
    "generatedAt": "2026-05-01T12:00:00.000Z"
  },
  "meta": {
    "roundDurationMs": 1200,
    "fromCache": false,
    "message_truncated": false,
    "generatedAt": "2026-05-01T12:00:00.000Z"
  }
}
```

- **`status`**: `"empty"` si no hay apps configuradas para el usuario; `"ok"` en caso contrario.
- **`message`**: texto listo para lectura en voz / TTS externo (ya sanitizado y truncado como en fulfillment).
- **Errores**: `401` no autorizado; `400` configuración legacy incompleta; `404` correo legacy sin usuario; `429` rate limit (cabecera `Retry-After`).

### Ejemplo `curl` (token por usuario)

```bash
curl -sS -X POST "https://<tu-dominio>/api/v1/voice/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOICE_USER_TOKEN>" \
  -d '{"lang":"es"}'
```

Ejemplo fallback legacy (mismo que fulfillment):

```bash
curl -sS -X POST "https://<tu-dominio>/api/v1/voice/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VOICE_WEBHOOK_SECRET>" \
  -H "x-excelso-user-email: tu@correo.com" \
  -d '{"lang":"es"}'
```

## Rate limit

Usa los mismos límites que el resto del agregador (`PULSE_RATE_LIMIT_*`). Claves aproximadas:

- **`voice_fulfillment:<userId>`** para Dialogflow: si se supera, respuesta **200** con texto de fulfillment y cabecera `Retry-After`.
- **`voice_report:<userId>`** para el reporte JSON: si se supera, **429** con JSON `{ "error": "rate_limited" }` y `Retry-After`.

## Checklist Dialogflow (mínimo)

1. Crear agente ES y una intención (p. ej. “Estado de mis apps”).
2. Habilitar fulfillment → webhook → URL `https://<tu-dominio>/api/v1/voice/fulfillment`.
3. Añadir cabeceras: `Authorization: Bearer …` y opcionalmente `x-excelso-user-email`.
4. Probar en el simulador; luego en dispositivo.

Checklist detallado de despliegue y secretos: [`deploy-voice-vercel.md`](./deploy-voice-vercel.md).

## Privacidad

La respuesta es **solo texto agregado** (nombres de apps y severidad). No se envían tokens ni payloads crudos de backends al cliente; aplica igual al JSON del **report**.
