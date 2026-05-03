/** Token del bot (@BotFather). Necesario para enviar mensajes. */
export function getTelegramBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN ?? "").trim()
}

/**
 * Secreto configurado en setWebhook (`secret_token`).
 * El webhook debe rechazar peticiones sin cabecera `X-Telegram-Bot-Api-Secret-Token` coincidente.
 */
export function getTelegramWebhookSecret(): string {
  return (process.env.TELEGRAM_WEBHOOK_SECRET ?? "").trim()
}

/** Usuario del bot sin @ (para enlaces t.me). */
export function getTelegramBotUsername(): string {
  return (process.env.TELEGRAM_BOT_USERNAME ?? "").trim().replace(/^@/, "")
}

/** TTL del código de enlace (ms). Por defecto 15 minutos. */
export function getTelegramLinkTtlMs(): number {
  const n = Number(process.env.TELEGRAM_LINK_TTL_MS)
  if (Number.isFinite(n) && n > 0) return Math.min(n, 60 * 60 * 1000)
  return 15 * 60 * 1000
}

export function getTelegramWebhookRateLimitMax(): number {
  const n = Number(process.env.TELEGRAM_WEBHOOK_RATE_MAX)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 40
}

export function getTelegramWebhookRateWindowMs(): number {
  const n = Number(process.env.TELEGRAM_WEBHOOK_RATE_WINDOW_MS)
  return Number.isFinite(n) && n > 0 ? n : 60_000
}
