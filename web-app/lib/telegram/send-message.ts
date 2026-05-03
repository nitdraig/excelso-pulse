import { getTelegramBotToken } from "@/lib/telegram/config"

const TELEGRAM_API = "https://api.telegram.org"

export type TelegramSendResult = { ok: true } | { ok: false; description?: string }

export type TelegramSendMessageOptions = {
  /** Solo para textos generados por nosotros (HTML seguro). El resto va sin parse_mode. */
  parseMode?: "HTML"
}

/**
 * Envía texto al chat. Por defecto sin parse_mode (contenido agregado / usuario).
 */
export async function telegramSendMessage(
  chatId: number,
  text: string,
  options?: TelegramSendMessageOptions,
): Promise<TelegramSendResult> {
  const token = getTelegramBotToken()
  if (!token) {
    console.error("[telegram] TELEGRAM_BOT_TOKEN no configurado")
    return { ok: false, description: "missing_bot_token" }
  }

  const safeText =
    text.length > 4096 ? `${text.slice(0, 4090).trimEnd()}…` : text

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: safeText,
    disable_web_page_preview: true,
  }
  if (options?.parseMode === "HTML") {
    body.parse_mode = "HTML"
  }

  const url = `${TELEGRAM_API}/bot${encodeURIComponent(token)}/sendMessage`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    description?: string
  }

  if (!res.ok || data.ok === false) {
    console.warn("[telegram] sendMessage", res.status, data)
    return { ok: false, description: data.description }
  }

  return { ok: true }
}
