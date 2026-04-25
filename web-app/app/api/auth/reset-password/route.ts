import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"
import { hashPasswordResetToken } from "@/lib/auth/password-reset-token"
import { resetPasswordBodySchema } from "@/lib/validations/api"

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const parsed = resetPasswordBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token)

  try {
    await connectDB()
    const user = await UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordHash +passwordResetTokenHash")

    if (!user) {
      return NextResponse.json(
        { error: "Enlace inválido o caducado. Solicita uno nuevo." },
        { status: 400 },
      )
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpires: null,
        },
      },
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo actualizar la contraseña." }, { status: 500 })
  }
}
