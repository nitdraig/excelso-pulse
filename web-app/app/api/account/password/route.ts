import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"
import { changePasswordBodySchema } from "@/lib/validations/api"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const parsed = changePasswordBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    await connectDB()
    const user = await UserModel.findById(session.user.id).select("+passwordHash")
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 403 })
    }

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await user.save()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo cambiar la contraseña." }, { status: 500 })
  }
}
