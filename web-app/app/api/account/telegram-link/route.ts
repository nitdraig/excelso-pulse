import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import {
  TelegramIntegrationModel,
  TelegramLinkCodeModel,
} from "@/lib/db/models"
import {
  getTelegramBotUsername,
  getTelegramLinkTtlMs,
} from "@/lib/telegram/config"
import {
  createTelegramStartPayload,
  hashVoiceToken,
} from "@/lib/voice/voice-user-token"

function maskTelegramId(id: string): string {
  const s = id.replace(/\D/g, "")
  if (s.length <= 4) return "****"
  return `…${s.slice(-4)}`
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const row = await TelegramIntegrationModel.findOne({ ownerId }).lean()
    const botUsername = getTelegramBotUsername()
    return NextResponse.json({
      linked: Boolean(row?.telegramUserId),
      telegramHint: row?.telegramUserId ? maskTelegramId(row.telegramUserId) : null,
      botConfigured: Boolean(botUsername),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "No se pudo leer el estado de Telegram." },
      { status: 500 },
    )
  }
}

/** Genera un enlace único t.me/...?start=TOKEN para vincular Telegram ↔ usuario Pulse. */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const botUsername = getTelegramBotUsername()
  if (!botUsername) {
    return NextResponse.json(
      {
        error: "telegram_bot_username_missing",
        message:
          "Define TELEGRAM_BOT_USERNAME en el servidor (usuario del bot sin @) para generar el enlace.",
      },
      { status: 400 },
    )
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    await TelegramLinkCodeModel.deleteMany({ ownerId })
    const raw = createTelegramStartPayload()
    const tokenHash = hashVoiceToken(raw)
    const expiresAt = new Date(Date.now() + getTelegramLinkTtlMs())
    await TelegramLinkCodeModel.create({ ownerId, tokenHash, expiresAt })

    const deepLink = `https://t.me/${botUsername}?start=${raw}`

    return NextResponse.json({
      ok: true,
      deepLink,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "No se pudo generar el enlace de Telegram." },
      { status: 500 },
    )
  }
}

/** Quita el vínculo Telegram ↔ usuario (el bot dejará de resolver tu portfolio). */
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    await TelegramIntegrationModel.deleteMany({ ownerId })
    await TelegramLinkCodeModel.deleteMany({ ownerId })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "No se pudo quitar el vínculo de Telegram." },
      { status: 500 },
    )
  }
}
