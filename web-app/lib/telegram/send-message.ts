import { getTelegramBotToken } from "@/lib/telegram/config"

const TELEGRAM_API = "https://api.telegram.org"

export type TelegramSendResult = { ok: true } | { ok: false; description?: string }

/**
 * Envía un mensaje de texto (sin parse_mode para evitar conflictos con caracteres especiales).
 */
export async function telegramSendMessage(
  chatId: number,
  text: string,
): Promise<TelegramSendResult> {
  const token = getTelegramBotToken()
  if (!token) {
    console.error("[telegram] TELEGRAM_BOT_TOKEN no configurado")
    return { ok: false, description: "missing_bot_token" }
  }

  const safeText =
    text.length > 4096 ? `${text.slice(0, 4090).trimEnd()}…` : text

  const url = `${TELEGRAM_API}/bot${encodeURIComponent(token)}/sendMessage`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: safeText,
      disable_web_page_preview: true,
    }),
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
