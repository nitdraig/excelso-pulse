import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import { VoiceIntegrationModel } from "@/lib/db/models"
import { createVoiceUserToken, hashVoiceToken } from "@/lib/voice/voice-user-token"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const row = await VoiceIntegrationModel.findOne({ ownerId }).lean()
    return NextResponse.json({
      configured: Boolean(row?.active),
      active: Boolean(row?.active),
      label: row?.label ?? "Dialogflow",
      lastUsedAt: row?.lastUsedAt ?? null,
      updatedAt: row?.updatedAt ?? null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo leer el token de voz." }, { status: 500 })
  }
}

/** Rota/crea token de voz para el usuario logueado. Devuelve el token en claro solo una vez. */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const token = createVoiceUserToken()
    const tokenHash = hashVoiceToken(token)
    await VoiceIntegrationModel.findOneAndUpdate(
      { ownerId },
      {
        ownerId,
        tokenHash,
        active: true,
        label: "Dialogflow",
        lastUsedAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    return NextResponse.json({
      ok: true,
      token,
      hint: "Guárdalo ahora: no volverá a mostrarse en texto plano.",
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo generar el token de voz." }, { status: 500 })
  }
}

/** Revoca (desactiva) el token de voz actual. */
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    await VoiceIntegrationModel.findOneAndUpdate(
      { ownerId },
      { active: false, tokenHash: "", lastUsedAt: null },
      { new: true },
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo revocar el token de voz." }, { status: 500 })
  }
}
