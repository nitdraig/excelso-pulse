import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"
import {
  getPulseRateLimitMax,
  getPulseRateLimitWindowMs,
  getVoiceDefaultUserEmail,
  getVoiceWebhookSecret,
} from "@/lib/pulse/config"
import { loadPulseAggregateForUser } from "@/lib/pulse/load-for-user"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  buildDialogflowEsFulfillmentResponse,
  parseDialogflowEsWebhookBody,
} from "@/lib/voice/dialogflow-es"
import {
  buildVoiceReportFromEntries,
  buildVoiceTextFromReport,
  localeFromLanguageCode,
} from "@/lib/voice/build-voice-summary"
import { voiceWebhookAuthOk } from "@/lib/voice/validate-voice-webhook-auth"

const USER_EMAIL_HEADER = "x-excelso-user-email"

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", allow: ["POST"] },
    { status: 405, headers: { Allow: "POST" } },
  )
}

/**
 * Webhook Dialogflow ES: cuerpo con `queryResult`, respuesta `fulfillmentText` + `fulfillmentMessages`.
 * Auth: `Authorization: Bearer <VOICE_WEBHOOK_SECRET>` y/o cabecera en `VOICE_WEBHOOK_ALT_HEADER_NAME`.
 * Usuario: cabecera `x-excelso-user-email` o variable `VOICE_DEFAULT_USER_EMAIL`.
 */
export async function POST(request: Request) {
  const secret = getVoiceWebhookSecret()
  if (!secret.length) {
    return NextResponse.json(
      { error: "voice_webhook_not_configured" },
      { status: 503 },
    )
  }

  if (!voiceWebhookAuthOk(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = parseDialogflowEsWebhookBody(body)
  if (!parsed) {
    return NextResponse.json(
      {
        error: "invalid_dialogflow_payload",
        hint: "Se espera un cuerpo Dialogflow ES con `queryResult`.",
      },
      { status: 400 },
    )
  }

  const headerEmail =
    request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase() ?? ""
  const defaultEmail = getVoiceDefaultUserEmail()
  const targetEmail = headerEmail || defaultEmail

  if (!targetEmail) {
    const msg =
      "Configura VOICE_DEFAULT_USER_EMAIL en el servidor o envía la cabecera x-excelso-user-email."
    return NextResponse.json(buildDialogflowEsFulfillmentResponse(msg), {
      status: 200,
    })
  }

  await connectDB()
  const user = await UserModel.findOne({ email: targetEmail })
    .select("_id")
    .lean()

  const locale = localeFromLanguageCode(parsed.languageCode)

  if (!user?._id) {
    const msg =
      locale === "es"
        ? "No encontré un usuario con ese correo en esta instancia."
        : "No user found with that email on this instance."
    return NextResponse.json(buildDialogflowEsFulfillmentResponse(msg), {
      status: 200,
    })
  }

  const userId = String(user._id)

  const rl = checkRateLimit(
    `voice_fulfillment:${userId}`,
    getPulseRateLimitMax(),
    getPulseRateLimitWindowMs(),
  )
  if (!rl.ok) {
    const msg =
      locale === "es"
        ? "Demasiadas peticiones. Prueba de nuevo en un momento."
        : "Too many requests. Try again shortly."
    return NextResponse.json(buildDialogflowEsFulfillmentResponse(msg), {
      status: 200,
      headers: {
        "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
      },
    })
  }

  try {
    const { entries, roundDurationMs, fromCache } =
      await loadPulseAggregateForUser(userId, { voice: true })
    const report = buildVoiceReportFromEntries(entries, locale)
    const text = buildVoiceTextFromReport(report)
    const suffix =
      locale === "es"
        ? ` Ronda en ${roundDurationMs} milisegundos${fromCache ? ", desde caché" : ""}.`
        : ` Round in ${roundDurationMs} milliseconds${fromCache ? ", from cache" : ""}.`
    return NextResponse.json(
      buildDialogflowEsFulfillmentResponse(text + suffix),
      { status: 200 },
    )
  } catch (e) {
    console.error("[voice] fulfillment", e)
    const msg =
      locale === "es"
        ? "Error al generar el informe. Revisa los logs del servidor."
        : "Could not build the report. Check server logs."
    return NextResponse.json(buildDialogflowEsFulfillmentResponse(msg), {
      status: 200,
    })
  }
}
