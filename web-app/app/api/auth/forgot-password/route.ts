import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"
import { generatePasswordResetToken, hashPasswordResetToken } from "@/lib/auth/password-reset-token"
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email"
import { getRequestOrigin } from "@/lib/http/request-origin"
import { forgotPasswordBodySchema } from "@/lib/validations/api"

const RESET_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const parsed = forgotPasswordBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Correo inválido.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const email = parsed.data.email.toLowerCase().trim()

  try {
    await connectDB()
    const user = await UserModel.findOne({ email }).lean()
    if (!user) {
      return NextResponse.json({ ok: true as const })
    }

    const token = generatePasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)
    const expires = new Date(Date.now() + RESET_MS)

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpires: expires,
        },
      },
    )

    const origin = getRequestOrigin(req)
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`

    const accept = req.headers.get("accept-language") ?? ""
    const es = accept.toLowerCase().includes("es")
    const subject = es
      ? "Restablecer contraseña — Excelso Pulse"
      : "Reset your password — Excelso Pulse"
    const html = es
      ? `<p>Solicitaste restablecer tu contraseña en Excelso Pulse.</p>
         <p><a href="${resetUrl}">Restablecer contraseña</a></p>
         <p style="font-size:12px;color:#666">Si no fuiste tú, ignora este correo. Caduca en 1 hora.</p>`
      : `<p>You asked to reset your Excelso Pulse password.</p>
         <p><a href="${resetUrl}">Reset password</a></p>
         <p style="font-size:12px;color:#666">If you did not request this, ignore this email. Link expires in 1 hour.</p>`

    const mail = await sendPasswordResetEmail({ to: email, resetUrl, subject, html })

    if (!mail.ok && mail.via === "smtp_error") {
      console.error(
        "[password-reset] Token guardado pero SMTP falló. Revisa SMTP_HOST, puerto, credenciales y firewall. Detalle:",
        mail.message,
      )
    }

    const isDev = process.env.NODE_ENV === "development"
    const hideDevLink = process.env.PASSWORD_RESET_DEV_LINK === "0"
    const onVercel = process.env.VERCEL === "1"
    const showDevLink = isDev && !hideDevLink && !onVercel

    return NextResponse.json({
      ok: true as const,
      ...(showDevLink ? { debugResetUrl: resetUrl } : {}),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 500 })
  }
}
