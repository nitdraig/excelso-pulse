# Webhook de voz (Dialogflow ES)

Endpoint pensado para **Dialogflow ES** (fulfillment webhook): recibe el JSON con `queryResult` y responde con `fulfillmentText` / `fulfillmentMessages` listos para el asistente.

Ruta: **`POST /api/v1/voice/fulfillment`**

No usa sesión de navegador: la autenticación es un **secreto de instancia** compartido con el proveedor de voz (mismo criterio OSS que el paquete NPM con token de servicio).

## Autenticación

1. Define **`VOICE_WEBHOOK_SECRET`** (valor largo y aleatorio).
2. En Dialogflow (o tu proxy), envía el mismo valor como:
   - `Authorization: Bearer <VOICE_WEBHOOK_SECRET>`, y/o
   - Cabecera alternativa si defines **`VOICE_WEBHOOK_ALT_HEADER_NAME`** (p. ej. `x-monitoring-token`).

Sin `VOICE_WEBHOOK_SECRET` el endpoint responde **503** (`voice_webhook_not_configured`). Sin credencial válida: **401**.

## Qué usuario se consulta

El informe sigue siendo el **portfolio MongoDB** de un usuario registrado en la instancia:

- Cabecera **`x-excelso-user-email`**: correo en minúsculas del usuario (recomendado si varias personas usan la misma instancia y distintos proyectos Dialogflow).
- O variable **`VOICE_DEFAULT_USER_EMAIL`**: correo por defecto cuando no se envía la cabecera (despliegue personal / un solo operador).

Si no hay cabecera ni default configurado, la respuesta HTTP es **200** con un mensaje de fulfillment explicando que falta configuración (Dialogflow no reintenta infinito por 4xx en algunos casos; aquí priorizamos mensaje audible).

Si el correo no existe en MongoDB, **200** con texto de error amable.

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

## Rate limit

Misma ventana que el agregador (`PULSE_RATE_LIMIT_*`), clave `voice_fulfillment:<userId>`. Si se supera, **200** con mensaje de “demasiadas peticiones” y cabecera `Retry-After`.

## Checklist Dialogflow (mínimo)

1. Crear agente ES y una intención (p. ej. “Estado de mis apps”).
2. Habilitar fulfillment → webhook → URL `https://<tu-dominio>/api/v1/voice/fulfillment`.
3. Añadir cabeceras: `Authorization: Bearer …` y opcionalmente `x-excelso-user-email`.
4. Probar en el simulador; luego en dispositivo.

Checklist detallado de despliegue y secretos: [`deploy-voice-vercel.md`](./deploy-voice-vercel.md).

## Privacidad

La respuesta es **solo texto agregado** (nombres de apps y severidad). No se envían tokens ni payloads crudos de backends al JSON de fulfillment.
