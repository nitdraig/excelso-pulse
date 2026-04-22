import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"
import { registerBodySchema } from "@/lib/validations/api"

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 })
  }

  const parsed = registerBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { name, email, password } = parsed.data

  try {
    await connectDB()
    const passwordHash = await bcrypt.hash(password, 12)
    await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    })
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code
    if (code === 11000) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo." },
        { status: 409 },
      )
    }
    console.error(e)
    return NextResponse.json({ error: "No se pudo crear la cuenta." }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
