import nodemailer from "nodemailer"

export type SendPasswordResetResult =
  | { ok: true; via: "nodemailer" }
  | { ok: false; via: "missing_config" }
  | { ok: false; via: "smtp_error"; message: string }

function smtpPort(): number {
  const raw = process.env.SMTP_PORT?.trim()
  if (!raw) return 587
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 587
}

/**
 * Envío vía Nodemailer (SMTP): `SMTP_HOST`, `EMAIL_FROM` y opcionalmente
 * `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE=1`.
 */
export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
  subject: string
  html: string
}): Promise<SendPasswordResetResult> {
  const host = process.env.SMTP_HOST?.trim()
  const from = process.env.EMAIL_FROM?.trim()

  if (!host || !from) {
    console.warn(
      "[password-reset] No se envió correo: faltan SMTP_HOST o EMAIL_FROM en .env. " +
        "En desarrollo mira si la API devolvió debugResetUrl en la respuesta JSON.",
    )
    return { ok: false, via: "missing_config" }
  }

  const port = smtpPort()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  const secure =
    process.env.SMTP_SECURE === "1" ||
    process.env.SMTP_SECURE === "true" ||
    port === 465

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user !== undefined && user !== "" && pass !== undefined && pass !== ""
      ? { auth: { user, pass } }
      : {}),
  })

  const wrappedHtml = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">${params.html}</body></html>`

  try {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: wrappedHtml,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(
      "[password-reset] SMTP rechazó o no pudo enviar:",
      message,
      "| from:",
      from,
      "| to:",
      params.to,
    )
    return { ok: false, via: "smtp_error", message }
  }

  console.info("[password-reset] Correo enviado vía SMTP a:", params.to)
  return { ok: true, via: "nodemailer" }
}
