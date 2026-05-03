# Bot de Telegram (multi-tenant)

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `TELEGRAM_BOT_TOKEN` | Token de [@BotFather](https://t.me/BotFather); necesario para `sendMessage`. |
| `TELEGRAM_WEBHOOK_SECRET` | Secreto alfanumérico (1–256 caracteres) que pasas a `setWebhook` como `secret_token`. Telegram lo envía en cada POST como cabecera **`X-Telegram-Bot-Api-Secret-Token`**. |
| `TELEGRAM_BOT_USERNAME` | Usuario del bot **sin** `@`; necesario para generar enlaces `https://t.me/usuario?start=…` desde el panel. |
| `TELEGRAM_LINK_TTL_MS` | Opcional. TTL del código de enlace (ms). Por defecto 15 minutos. |
| `TELEGRAM_WEBHOOK_RATE_MAX` / `TELEGRAM_WEBHOOK_RATE_WINDOW_MS` | Opcional. Límite de updates por ventana (por defecto 40 / 60 s por usuario de Telegram). |

## Webhook

- **URL:** `POST https://<tu-dominio>/api/v1/telegram/webhook`
- **Cabecera obligatoria:** `X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>`
- **Cuerpo:** JSON del [Update](https://core.telegram.org/bots/api#update) de Telegram.

Ejemplo `setWebhook` (sustituye valores):

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<dominio>/api/v1/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

## Mensaje de bienvenida (`/start`, enlace)

Tras `/start` o un enlace correcto, el bot envía un bloque **HTML** (parse_mode `HTML`) con enlace clicable a **Excelso** (`EXCELSO_OFFICIAL_SITE_URL`, por defecto `https://excelso.xyz`), enlace al panel **Pulse** (`TELEGRAM_PULSE_PUBLIC_URL` o `NEXT_PUBLIC_APP_URL`, por defecto `https://pulse.excelso.xyz`) y mini guía (`state` / `estado` / `/unlink`).

## Flujo de usuario

1. En **Cuenta → Telegram**, pulsa **Generar enlace** (sesión web).
2. Abre el enlace `t.me/...?start=...` en Telegram y pulsa **Iniciar**. En muchos clientes solo ves `/start` en la burbuja; Telegram envía igual el parámetro `start` al servidor (no hace falta pegar el token a mano).
3. El Hub valida el token, guarda `telegram_user_id ↔ ownerId` y responde en el chat.
4. Vuelve al panel y pulsa **Actualizar estado** (o cambia de pestaña y vuelve): la página no sondea sola, pero al recuperar el foco se vuelve a pedir el estado.
5. Cualquier mensaje de texto en el bot (tras vincular) pide el resumen de tu portfolio.

El informe de texto reutiliza las mismas reglas que la voz (`buildVoiceTextFromReport`): el cuerpo del resumen va en **inglés** con `state` o en **español** con `estado`. El resto de mensajes del bot (enlace, errores, ayuda) van en **inglés**.

## Comandos en el chat

| Mensaje | Efecto |
|---------|--------|
| Abrir `t.me/<bot>?start=<token>` y **Iniciar** | Vincula esa cuenta de Telegram con tu usuario Pulse (una vez por enlace). |
| `/start` sin haber abierto el enlace | Si ya estás vinculado, te lo indica; si no, pide generar el enlace en la web. |
| `state` o `/state` (solo eso, mayúsculas indistinto) | Resumen de portfolio **en inglés**. |
| `estado` o `/estado` (solo eso) | Resumen de portfolio **en español**. |
| Cualquier otro texto | Aviso en **inglés** de que no es el comando correcto. |
| `/desvincular` o `/unlink` | Quita el vínculo para ese usuario de Telegram. |

## Si el bot no responde (silencio total)

Las marcas ✓✓ en Telegram solo confirman que **Telegram** recibió tu mensaje; no implica que **tu servidor** lo haya procesado ni que `sendMessage` haya funcionado.

1. **Abre en el navegador** (misma URL base que Pulse):  
   `GET …/api/v1/telegram/webhook`  
   Debe devolver JSON con `webhookUrl` y `server.TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET` en `set` o `missing`. Si el token falta, el webhook puede ejecutarse pero **no habrá respuesta** en el chat.

2. **Comprueba el webhook en Telegram** (sustituye `<TOKEN>` por el de BotFather):

   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

   - `url` debe ser exactamente `https://<tu-dominio>/api/v1/telegram/webhook` (HTTPS público; **no** sirve `http://localhost` sin túnel).
   - Si `last_error_message` no está vacío, ahí suele estar la causa (403, timeout, certificado, etc.).
   - Si `pending_update_count` crece, Telegram no puede entregar bien al servidor.
   - **`allowed_updates`:** si existe y **no** incluye `"message"`, Telegram **no enviará** mensajes de chat a tu webhook (el bot quedará mudo). Debe ser `null` o contener `"message"` (o no acotes tipos al registrar el webhook).

3. **El GET de diagnóstico** (`/api/v1/telegram/webhook` en el navegador) solo confirma que en **Vercel** existen las variables `TELEGRAM_BOT_TOKEN` y `TELEGRAM_WEBHOOK_SECRET`. **No** demuestra que el `secret_token` de `setWebhook` sea el mismo valor: si difieren, Telegram recibe **403** y no procesas nada.

4. **Probar el POST como Telegram** (mismo `TELEGRAM_WEBHOOK_SECRET` que en Vercel y en `setWebhook`; sustituye `TU_ID` por tu id numérico de usuario, p. ej. [@userinfobot](https://t.me/userinfobot)):

   ```bash
   curl -sS -X POST "https://<tu-dominio>/api/v1/telegram/webhook" \
     -H "Content-Type: application/json" \
     -H "X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>" \
     -d "{\"update_id\":999001,\"message\":{\"message_id\":1,\"from\":{\"id\":TU_ID,\"language_code\":\"es\"},\"chat\":{\"id\":TU_ID,\"type\":\"private\"},\"date\":1730000000,\"text\":\"/start\"}}"
   ```

   Luego revisa **Vercel → Logs** de esa función: deberías ver líneas `[telegram] webhook mensaje` y, si `sendMessage` falla, `[telegram] reply sendMessage failed`. Si con el mismo secreto obtienes **403**, el secreto del `curl` no coincide con el del servidor.

5. **Mismo secreto en dos sitios:** el `secret_token` de `setWebhook` debe ser **idéntico** a `TELEGRAM_WEBHOOK_SECRET` en el entorno donde corre la app (p. ej. Vercel). El GET del navegador solo indica que la variable existe, no que coincida con Telegram.

6. **Desarrollo local:** usa un túnel (ngrok, Cloudflare Tunnel, etc.) con HTTPS, apunta `setWebhook` a esa URL y define las variables en `.env` del `web-app`.

7. Tras corregir `setWebhook`, puedes forzar reintento con `deleteWebhook` + `setWebhook` de nuevo si hace falta.
