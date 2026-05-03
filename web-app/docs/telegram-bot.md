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

## Flujo de usuario

1. En **Cuenta → Telegram**, pulsa **Generar enlace** (sesión web).
2. Abre el enlace `t.me/...?start=...` en Telegram y pulsa **Iniciar**. En muchos clientes solo ves `/start` en la burbuja; Telegram envía igual el parámetro `start` al servidor (no hace falta pegar el token a mano).
3. El Hub valida el token, guarda `telegram_user_id ↔ ownerId` y responde en el chat.
4. Vuelve al panel y pulsa **Actualizar estado** (o cambia de pestaña y vuelve): la página no sondea sola, pero al recuperar el foco se vuelve a pedir el estado.
5. Cualquier mensaje de texto en el bot (tras vincular) pide el resumen de tu portfolio.

El informe de texto reutiliza las mismas reglas que la voz (`buildVoiceTextFromReport`), en español o inglés según `language_code` de Telegram.

## Comandos en el chat

| Mensaje | Efecto |
|---------|--------|
| Abrir `t.me/<bot>?start=<token>` y **Iniciar** | Vincula esa cuenta de Telegram con tu usuario Pulse (una vez por enlace). |
| `/start` sin haber abierto el enlace | Si ya estás vinculado, te lo indica; si no, pide generar el enlace en la web. |
| Cualquier otro texto (p. ej. `hola`, `estado`, `/estado`) | Resumen de portfolio (misma lógica que voz). |
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

3. **Mismo secreto en dos sitios:** el `secret_token` de `setWebhook` debe ser **idéntico** a `TELEGRAM_WEBHOOK_SECRET` en el entorno donde corre la app (p. ej. Vercel). Si en Telegram hay `secret_token` pero en el servidor la variable no existe, este proyecto respondía antes con error y no procesaba el update.

4. **Desarrollo local:** usa un túnel (ngrok, Cloudflare Tunnel, etc.) con HTTPS, apunta `setWebhook` a esa URL y define las variables en `.env` del `web-app`.

5. Tras corregir `setWebhook`, puedes forzar reintento con `deleteWebhook` + `setWebhook` de nuevo si hace falta.
