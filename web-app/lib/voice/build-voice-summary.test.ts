import { describe, expect, it } from "vitest"
import { defaultInfra } from "@/lib/pulse/normalize"
import type { PulseSummaryEntry } from "@/lib/pulse/types"
import {
  buildVoiceReportFromEntries,
  buildVoiceTextFromReport,
} from "@/lib/voice/build-voice-summary"

function entry(over: Partial<PulseSummaryEntry>): PulseSummaryEntry {
  return {
    appId: "app",
    contract_version: "1",
    pulse_version: "1",
    status: "operational",
    readiness: "ready",
    user_impact: "none",
    name: "Nombre",
    description: "",
    icon: "📦",
    metrics: {
      latency_ms: 10,
      uptime_percent: 99,
      requests_24h: 0,
      error_rate: 0,
    },
    kpis: [],
    infrastructure: defaultInfra(),
    ai_context: "",
    logs: [],
    last_updated: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    ...over,
  }
}

describe("buildVoiceTextFromReport", () => {
  it("matiza outage por fallo del Hub (fetch) y menciona caché y nueva pregunta", () => {
    const entries = [
      entry({
        appId: "skipy",
        name: "Skipy",
        user_impact: "outage",
        status: "unavailable",
        readiness: "ready",
        error: { code: "timeout", message: "timeout" },
      }),
      entry({ appId: "other", name: "Otra", user_impact: "none" }),
    ]
    const report = buildVoiceReportFromEntries(entries, "es", {
      roundDurationMs: 136,
      fromCache: true,
    })
    const text = buildVoiceTextFromReport(report)
    expect(text).toContain("Skipy")
    expect(text).toMatch(/no obtuvo una lectura pulse válida/i)
    expect(text).toMatch(/caché del Hub/i)
    expect(text).toMatch(/no se actualiza solo/i)
  })

  it("usa tono distinto para outage según backend sin error del Hub", () => {
    const entries = [
      entry({
        appId: "svc",
        name: "Svc",
        user_impact: "outage",
        status: "down",
        readiness: "ready",
      }),
    ]
    const report = buildVoiceReportFromEntries(entries, "es", { roundDurationMs: 50 })
    const text = buildVoiceTextFromReport(report)
    expect(text).toMatch(/último informe enviado por el backend/i)
    expect(text).not.toMatch(/no obtuvo una lectura pulse válida/i)
  })

  it("report JSON incluye listas y hubFetchFailed en highlights", () => {
    const entries = [
      entry({
        appId: "a",
        user_impact: "outage",
        error: { code: "http_error", message: "HTTP 500" },
      }),
    ]
    const report = buildVoiceReportFromEntries(entries, "en", {})
    expect(report.outageFetchLabels).toEqual(["Nombre"])
    expect(report.outageSignalLabels).toEqual([])
    expect(report.highlights[0]?.hubFetchFailed).toBe(true)
  })
})
