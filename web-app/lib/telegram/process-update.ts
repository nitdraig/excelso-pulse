import mongoose from "mongoose"
import { connectDB } from "@/lib/db/connect"
import {
  TelegramIntegrationModel,
  TelegramLinkCodeModel,
} from "@/lib/db/models"
import { loadPulseAggregateForUser } from "@/lib/pulse/load-for-user"
import { getVoiceTtsMaxChars } from "@/lib/pulse/config"
import { prepareVoiceTtsText } from "@/lib/voice/tts-prepare"
import {
  buildVoiceReportFromEntries,
  buildVoiceTextFromReport,
} from "@/lib/voice/build-voice-summary"
import { hashVoiceToken } from "@/lib/voice/voice-user-token"
import { tg, telegramBotBasicLang, type TelegramUiLang } from "@/lib/telegram/copy"
import { telegramSendMessage } from "@/lib/telegram/send-message"
import {
  telegramWelcomeAlreadyLinkedHtml,
  telegramWelcomeLinkSuccessHtml,
  telegramWelcomeNeedLinkHtml,
} from "@/lib/telegram/welcome-html"

export type ParsedTelegramMessage = {
  chatId: number
  telegramUserId: number
  text: string
  languageCode?: string
}

export function extractTelegramMessage(update: unknown): ParsedTelegramMessage | null {
  if (!update || typeof update !== "object") return null
  const u = update as Record<string, unknown>
  const raw =
    u.message ??
    u.edited_message ??
    u.business_message ??
    u.edited_business_message
  if (!raw || typeof raw !== "object") return null
  const msg = raw as Record<string, unknown>
  const chat = msg.chat as { id?: number } | undefined
  const from = msg.from as { id?: number; language_code?: string } | undefined
  const text =
    typeof msg.text === "string"
      ? msg.text
      : typeof msg.caption === "string"
        ? msg.caption
        : ""
  const trimmed = text.trim()
  if (!trimmed) return null
  const chatId = chat?.id
  const telegramUserId = from?.id
  if (chatId == null || telegramUserId == null) return null
  return {
    chatId,
    telegramUserId,
    text: trimmed,
    languageCode: from.language_code,
  }
}

/** `state` → informe en inglés; `estado` → en español (con o sin `/`). */
export function reportCommandLang(text: string): TelegramUiLang | null {
  const t = text.trim()
  if (/^\/?state$/i.test(t)) return "en"
  if (/^\/?estado$/i.test(t)) return "es"
  return null
}

async function reply(
  lang: TelegramUiLang,
  chatId: number,
  text: string,
): Promise<void> {
  const maxChars = Math.min(4000, getVoiceTtsMaxChars() > 0 ? getVoiceTtsMaxChars() : 4000)
  const { text: out } = prepareVoiceTtsText(text, maxChars)
  const sent = await telegramSendMessage(chatId, out)
  if (!sent.ok) {
    console.error("[telegram] reply sendMessage failed", {
      chatId,
      description: sent.description,
    })
  }
}

async function replyHtml(chatId: number, html: string): Promise<void> {
  const sent = await telegramSendMessage(chatId, html, { parseMode: "HTML" })
  if (!sent.ok) {
    console.error("[telegram] replyHtml sendMessage failed", {
      chatId,
      description: sent.description,
    })
  }
}

async function redeemLinkCode(
  rawToken: string,
  telegramUserId: number,
  chatId: number,
  lang: TelegramUiLang,
): Promise<void> {
  const tokenHash = hashVoiceToken(rawToken.trim())
  await connectDB()

  const code = await TelegramLinkCodeModel.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
    usedAt: null,
  }).lean()

  if (!code?.ownerId) {
    await reply(lang, chatId, tg(lang, "linkInvalid"))
    return
  }

  const tgIdStr = String(telegramUserId)
  const other = await TelegramIntegrationModel.findOne({
    telegramUserId: tgIdStr,
  }).lean()
  if (other && String(other.ownerId) !== String(code.ownerId)) {
    await reply(lang, chatId, tg(lang, "linkTelegramTaken"))
    return
  }

  try {
    await TelegramIntegrationModel.deleteMany({
      $or: [{ ownerId: code.ownerId }, { telegramUserId: tgIdStr }],
    })
    await TelegramIntegrationModel.create({
      ownerId: code.ownerId as mongoose.Types.ObjectId,
      telegramUserId: tgIdStr,
    })
    await TelegramLinkCodeModel.updateOne(
      { _id: code._id },
      { $set: { usedAt: new Date() } },
    )
    await replyHtml(chatId, telegramWelcomeLinkSuccessHtml())
  } catch (e) {
    console.error("[telegram] redeem link", e)
    await reply(lang, chatId, tg(lang, "linkSaveFailed"))
  }
}

async function handleStartWithoutToken(
  telegramUserId: number,
  chatId: number,
  lang: TelegramUiLang,
): Promise<void> {
  await connectDB()
  const row = await TelegramIntegrationModel.findOne({
    telegramUserId: String(telegramUserId),
  }).lean()
  if (row) {
    await replyHtml(chatId, telegramWelcomeAlreadyLinkedHtml())
  } else {
    await replyHtml(chatId, telegramWelcomeNeedLinkHtml())
  }
}

async function unlinkTelegram(
  telegramUserId: number,
  chatId: number,
  lang: TelegramUiLang,
): Promise<void> {
  await connectDB()
  const r = await TelegramIntegrationModel.deleteOne({
    telegramUserId: String(telegramUserId),
  })
  if (r.deletedCount > 0) {
    await reply(lang, chatId, tg(lang, "unlinkDone"))
  } else {
    await reply(lang, chatId, tg(lang, "unlinkNone"))
  }
}

async function sendPortfolioSummary(
  telegramUserId: number,
  chatId: number,
  reportLang: TelegramUiLang,
): Promise<void> {
  await connectDB()
  const row = await TelegramIntegrationModel.findOne({
    telegramUserId: String(telegramUserId),
  }).lean()
  if (!row?.ownerId) {
    await reply(reportLang, chatId, tg(reportLang, "portfolioNotLinked"))
    return
  }

  const userId = String(row.ownerId)

  try {
    const { entries, roundDurationMs, fromCache } =
      await loadPulseAggregateForUser(userId)
    const report = buildVoiceReportFromEntries(entries, reportLang, {
      roundDurationMs,
      fromCache,
    })
    const body = buildVoiceTextFromReport(report)
    await reply(reportLang, chatId, body)
  } catch (e) {
    console.error("[telegram] portfolio", e)
    await reply(reportLang, chatId, tg(reportLang, "portfolioError"))
  }
}

/**
 * Procesa una actualización del webhook de Telegram (mensaje de texto).
 */
export async function processTelegramUpdate(update: unknown): Promise<void> {
  const msg = extractTelegramMessage(update)
  if (!msg) return

  const lang = telegramBotBasicLang()
  const { chatId, telegramUserId, text } = msg

  const startMatch = /^\/start(?:\s+(\S+))?$/i.exec(text)
  if (startMatch) {
    const arg = (startMatch[1] ?? "").trim()
    if (arg.length > 0) {
      await redeemLinkCode(arg, telegramUserId, chatId, lang)
      return
    }
    await handleStartWithoutToken(telegramUserId, chatId, lang)
    return
  }

  if (/^\/(desvincular|unlink)\b/i.test(text)) {
    await unlinkTelegram(telegramUserId, chatId, lang)
    return
  }

  const reportLang = reportCommandLang(text)
  if (reportLang) {
    await sendPortfolioSummary(telegramUserId, chatId, reportLang)
    return
  }

  await reply(lang, chatId, tg(lang, "wrongCommand"))
}
