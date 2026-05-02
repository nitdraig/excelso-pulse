import { NextResponse } from "next/server"
import { VoiceIntegrationModel } from "@/lib/db/models"
import {
  getVoiceWebhookAltHeaderName,
  getPulseRateLimitMax,
  getPulseRateLimitWindowMs,
  getVoiceTtsMaxChars,
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
import { resolveVoiceIdentity } from "@/lib/voice/resolve-voice-identity"
import { prepareVoiceTtsText } from "@/lib/voice/tts-prepare"

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", allow: ["POST"] },
    { status: 405, headers: { Allow: "POST" } },
  )
}

/**
 * Webhook Dialogflow ES: cuerpo con `queryResult`, respuesta `fulfillmentText` + `fulfillmentMessages`.
 * Auth principal: token por usuario (Bearer/cabecera alt), resuelto por hash en MongoDB.
 * Fallback legacy: secreto de instancia + `x-excelso-user-email` / `VOICE_DEFAULT_USER_EMAIL`.
 */
export async function POST(request: Request) {
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

  const locale = localeFromLanguageCode(parsed.languageCode)
  const resolved = await resolveVoiceIdentity(request, getVoiceWebhookAltHeaderName())

  if (!resolved.ok) {
    switch (resolved.code) {
      case "missing_token":
      case "unauthorized":
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
      case "legacy_missing_target":
        return NextResponse.json(
          buildDialogflowEsFulfillmentResponse(
            locale === "es" ? resolved.message.es : resolved.message.en,
          ),
          { status: 200 },
        )
      case "legacy_unknown_user":
        return NextResponse.json(
          buildDialogflowEsFulfillmentResponse(
            locale === "es" ? resolved.message.es : resolved.message.en,
          ),
          { status: 200 },
        )
      default:
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const rl = checkRateLimit(
    `voice_fulfillment:${resolved.userId}`,
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
    if (resolved.voiceIntegrationId) {
      void VoiceIntegrationModel.updateOne(
        { _id: resolved.voiceIntegrationId },
        { $set: { lastUsedAt: new Date() } },
      )
    }
    const { entries, roundDurationMs, fromCache } =
      await loadPulseAggregateForUser(resolved.userId, { voice: true })
    const report = buildVoiceReportFromEntries(entries, locale, {
      roundDurationMs,
      fromCache,
    })
    const raw = buildVoiceTextFromReport(report)
    const { text } = prepareVoiceTtsText(raw, getVoiceTtsMaxChars())
    return NextResponse.json(buildDialogflowEsFulfillmentResponse(text), { status: 200 })
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
