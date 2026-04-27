import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"
import { registerBodySchema } from "@/lib/validations/api"
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit"

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Demasiados intentos. Inténtalo de nuevo más tarde." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  )
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const ipRate = consumeRateLimit({
    key: `register:ip:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })
  if (!ipRate.ok) return tooManyRequests(ipRate.retryAfterSeconds)

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
  const emailRate = consumeRateLimit({
    key: `register:email:${email.toLowerCase()}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (!emailRate.ok) return tooManyRequests(emailRate.retryAfterSeconds)

  try {
    await connectDB()
    const passwordHash = await bcrypt.hash(password, 12)
    const trimmed = name.trim()
    await UserModel.create({
      name: trimmed,
      email: email.toLowerCase(),
      passwordHash,
      firstName: trimmed,
      lastName: "",
      organizationName: "",
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
