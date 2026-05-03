import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  getTelegramBotToken,
  getTelegramWebhookRateLimitMax,
  getTelegramWebhookRateWindowMs,
  getTelegramWebhookSecret,
} from "@/lib/telegram/config"
import {
  extractTelegramMessage,
  processTelegramUpdate,
} from "@/lib/telegram/process-update"
import { tg, telegramBotBasicLang } from "@/lib/telegram/copy"
import { telegramSendMessage } from "@/lib/telegram/send-message"

/** Ayuda rápida si abres la URL en el navegador; Telegram solo usa POST. */
export async function GET(request: Request) {
  const host = request.headers.get("host") ?? "<tu-dominio>"
  const proto = request.headers.get("x-forwarded-proto") ?? "https"
  const webhookUrl = `${proto}://${host}/api/v1/telegram/webhook`
  const hasToken = Boolean(getTelegramBotToken())
  const hasSecret = Boolean(getTelegramWebhookSecret())
  return NextResponse.json({
    ok: true,
    webhookUrl,
    server: {
      TELEGRAM_BOT_TOKEN: hasToken ? "set" : "missing",
      TELEGRAM_WEBHOOK_SECRET: hasSecret ? "set" : "missing",
    },
    hint:
      "Si el bot no contesta en Telegram, Telegram no está entregando updates aquí o sendMessage falla. Revisa getWebhookInfo y las variables (ver docs/telegram-bot.md).",
  })
}

/**
 * Webhook de Telegram (multi-tenant). Auth: cabecera `X-Telegram-Bot-Api-Secret-Token`
 * igual a `TELEGRAM_WEBHOOK_SECRET` configurado en setWebhook.
 */
export async function POST(request: Request) {
  const expected = getTelegramWebhookSecret()
  const got = request.headers.get("x-telegram-bot-api-secret-token") ?? ""

  if (expected) {
    if (got !== expected) {
      console.warn("[telegram] webhook 403: cabecera secret distinta o ausente")
      return NextResponse.json(
        { ok: false, error: "webhook_secret_mismatch" },
        { status: 403 },
      )
    }
  } else if (got) {
    console.warn(
      "[telegram] webhook 403: Telegram envía secret_token pero TELEGRAM_WEBHOOK_SECRET no está en el servidor",
    )
    return NextResponse.json(
      { ok: false, error: "server_missing_webhook_secret" },
      { status: 403 },
    )
  } else if (process.env.NODE_ENV === "production") {
    console.error(
      "[telegram] webhook 503: en producción define TELEGRAM_WEBHOOK_SECRET y pásalo a setWebhook como secret_token",
    )
    return NextResponse.json(
      { ok: false, error: "webhook_secret_required_in_production" },
      { status: 503 },
    )
  } else {
    console.warn(
      "[telegram] webhook sin TELEGRAM_WEBHOOK_SECRET ni cabecera (solo desarrollo; en prod usa secret_token)",
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    console.warn("[telegram] webhook POST body JSON inválido o vacío")
    return NextResponse.json({ ok: true })
  }

  const updateId =
    body && typeof body === "object" && "update_id" in body
      ? (body as { update_id?: number }).update_id
      : undefined

  const msg = extractTelegramMessage(body)
  if (!msg) {
    console.info("[telegram] webhook sin mensaje de texto usable", {
      update_id: updateId,
      update_keys: body && typeof body === "object" ? Object.keys(body as object) : [],
    })
  } else {
    console.info("[telegram] webhook mensaje", {
      update_id: updateId,
      chatId: msg.chatId,
      preview: msg.text.slice(0, 40),
    })
  }
  const rateKey = msg
    ? `telegram_user:${msg.telegramUserId}`
    : `telegram_ip:${request.headers.get("x-forwarded-for") ?? "na"}`

  const rl = checkRateLimit(
    rateKey,
    getTelegramWebhookRateLimitMax(),
    getTelegramWebhookRateWindowMs(),
  )
  if (!rl.ok) {
    if (msg) {
      const text = tg(telegramBotBasicLang(), "rateLimited")
      await telegramSendMessage(msg.chatId, text)
    }
    return NextResponse.json({ ok: true })
  }

  try {
    await processTelegramUpdate(body)
  } catch (e) {
    console.error("[telegram] webhook handler", e)
  }

  return NextResponse.json({ ok: true })
}
