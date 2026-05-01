import { NextResponse } from "next/server"
import { VoiceIntegrationModel } from "@/lib/db/models"
import {
  getPulseRateLimitMax,
  getPulseRateLimitWindowMs,
  getVoiceTtsMaxChars,
  getVoiceWebhookAltHeaderName,
} from "@/lib/pulse/config"
import { loadPulseAggregateForUser } from "@/lib/pulse/load-for-user"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  buildVoiceReportFromEntries,
  buildVoiceTextFromReport,
  localeFromLanguageCode,
} from "@/lib/voice/build-voice-summary"
import { resolveVoiceIdentity } from "@/lib/voice/resolve-voice-identity"
import { prepareVoiceTtsText } from "@/lib/voice/tts-prepare"

const PULSE_CONTRACT = "voice-report-v1"
const PULSE_VERSION = 1

export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed", allow: ["POST"], pulse_contract: PULSE_CONTRACT, pulse_version: PULSE_VERSION },
    { status: 405, headers: { Allow: "POST" } },
  )
}

function pickLocale(body: { lang?: unknown }, acceptLanguage: string | null): "es" | "en" {
  const l = body.lang
  if (l === "es" || l === "en") return l
  return localeFromLanguageCode(acceptLanguage ?? "en")
}

/**
 * Reporte JSON para scripts (Google Home, HA, curl). Misma autenticación que el fulfillment Dialogflow.
 * Cuerpo opcional: `{ "lang": "es" | "en" }`. Idioma por defecto según `Accept-Language`.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> = {}
  try {
    const j = await request.json()
    if (j && typeof j === "object" && !Array.isArray(j)) body = j as Record<string, unknown>
  } catch {
    body = {}
  }

  const locale = pickLocale(body, request.headers.get("accept-language"))

  const resolved = await resolveVoiceIdentity(request, getVoiceWebhookAltHeaderName())

  if (!resolved.ok) {
    if (resolved.code === "missing_token" || resolved.code === "unauthorized") {
      return NextResponse.json(
        { error: "unauthorized", pulse_contract: PULSE_CONTRACT, pulse_version: PULSE_VERSION },
        { status: 401 },
      )
    }
    if (resolved.code === "legacy_missing_target") {
      return NextResponse.json(
        {
          error: "voice_legacy_config_required",
          message: locale === "es" ? resolved.message.es : resolved.message.en,
          pulse_contract: PULSE_CONTRACT,
          pulse_version: PULSE_VERSION,
        },
        { status: 400 },
      )
    }
    if (resolved.code === "legacy_unknown_user") {
      return NextResponse.json(
        {
          error: "user_not_found",
          message: locale === "es" ? resolved.message.es : resolved.message.en,
          pulse_contract: PULSE_CONTRACT,
          pulse_version: PULSE_VERSION,
        },
        { status: 404 },
      )
    }
    return NextResponse.json({ error: "unauthorized", pulse_contract: PULSE_CONTRACT, pulse_version: PULSE_VERSION }, { status: 401 })
  }

  const rl = checkRateLimit(
    `voice_report:${resolved.userId}`,
    getPulseRateLimitMax(),
    getPulseRateLimitWindowMs(),
  )
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "rate_limited",
        pulse_contract: PULSE_CONTRACT,
        pulse_version: PULSE_VERSION,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
          "Cache-Control": "no-store",
        },
      },
    )
  }

  try {
    if (resolved.voiceIntegrationId) {
      void VoiceIntegrationModel.updateOne(
        { _id: resolved.voiceIntegrationId },
        { $set: { lastUsedAt: new Date() } },
      )
    }
    const { entries, roundDurationMs, fromCache } = await loadPulseAggregateForUser(
      resolved.userId,
      { voice: true },
    )
    const report = buildVoiceReportFromEntries(entries, locale)
    const rawMessage = buildVoiceTextFromReport(report)
    const { text: message, truncated } = prepareVoiceTtsText(rawMessage, getVoiceTtsMaxChars())

    return NextResponse.json(
      {
        pulse_contract: PULSE_CONTRACT,
        pulse_version: PULSE_VERSION,
        status: report.totalApps === 0 ? "empty" : "ok",
        locale,
        message,
        report,
        meta: {
          roundDurationMs,
          fromCache,
          message_truncated: truncated,
          generatedAt: report.generatedAt,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    )
  } catch (e) {
    console.error("[voice] report", e)
    return NextResponse.json(
      {
        error: "voice_report_failed",
        message:
          locale === "es"
            ? "No se pudo generar el informe. Revisa los logs del servidor."
            : "Could not build the report. Check server logs.",
        pulse_contract: PULSE_CONTRACT,
        pulse_version: PULSE_VERSION,
      },
      { status: 500 },
    )
  }
}
