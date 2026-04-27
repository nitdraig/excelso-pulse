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
    const preferredLocale = parsed.data.locale
    const es = preferredLocale ? preferredLocale === "es" : accept.toLowerCase().includes("es")
    const subject = es
      ? "Restablecer contraseña — Excelso Pulse"
      : "Reset your password — Excelso Pulse"
    const ctaLabel = es ? "Restablecer contraseña" : "Reset password"
    const title = es ? "Recuperación de contraseña" : "Password recovery"
    const intro = es
      ? "Recibimos una solicitud para restablecer tu contraseña de Excelso Pulse."
      : "We received a request to reset your Excelso Pulse password."
    const hint = es
      ? "Este enlace caduca en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo."
      : "This link expires in 1 hour. If you did not request this change, you can safely ignore this email."
    const support = es
      ? "Si el botón no funciona, copia y pega este enlace en tu navegador:"
      : "If the button does not work, copy and paste this link in your browser:"
    const logoUrl = `${origin}/web-app-manifest-192x192.png`
    const html = `
      <div style="margin:0 auto;max-width:600px;padding:24px;background:#f8fafc">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
          <div style="text-align:center;margin-bottom:20px">
            <img src="${logoUrl}" alt="Excelso Pulse" width="56" height="56" style="display:inline-block;border-radius:14px;border:1px solid #dbeafe;background:#eff6ff" />
          </div>
          <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;color:#0f172a;text-align:center">${title}</h1>
          <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;text-align:center">${intro}</p>
          <div style="text-align:center;margin:0 0 20px">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#ffffff !important;text-decoration:none;border-radius:10px;font-weight:600">${ctaLabel}</a>
          </div>
          <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6">${hint}</p>
          <p style="margin:0 0 8px;color:#334155;font-size:13px;line-height:1.6">${support}</p>
          <p style="margin:0;padding:10px 12px;border-radius:8px;background:#f1f5f9;color:#0f172a;font-size:12px;line-height:1.55;word-break:break-all">${resetUrl}</p>
        </div>
      </div>
    `

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
