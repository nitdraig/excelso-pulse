import { describe, expect, it } from "vitest"
import { applyPresentationStability } from "@/lib/pulse/presentation-stability"
import type { PulseSummaryEntry } from "@/lib/pulse/types"
import { defaultInfra } from "@/lib/pulse/normalize"

const base = (): PulseSummaryEntry => ({
  appId: "app-a",
  contract_version: "1",
  pulse_version: "1",
  status: "operational",
  readiness: "ready",
  user_impact: "none",
  name: "A",
  description: "",
  icon: "📦",
  metrics: { latency_ms: 10, uptime_percent: 99, requests_24h: 1, error_rate: 0 },
  kpis: [],
  infrastructure: defaultInfra(),
  ai_context: "ok",
  logs: [],
  last_updated: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
})

describe("applyPresentationStability", () => {
  const scope = "test:scope"

  it("tras un fallo grave mantiene degradado limitado si hubo snapshot previo sano", () => {
    const ok = base()
    const failed: PulseSummaryEntry = {
      ...ok,
      status: "unavailable",
      readiness: "ready",
      user_impact: "outage",
      metrics: { latency_ms: 0, uptime_percent: 0, requests_24h: 0, error_rate: 0 },
      error: { code: "timeout", message: "timeout" },
    }

    const r1 = applyPresentationStability([ok], scope)
    expect(r1[0].user_impact).toBe("none")

    const r2 = applyPresentationStability([failed], scope)
    expect(r2[0].user_impact).toBe("limited")
    expect(r2[0].status).toBe("degraded")
    expect(r2[0].metrics.latency_ms).toBe(10)

    const r3 = applyPresentationStability([failed], scope)
    expect(r3[0].user_impact).toBe("outage")
    expect(r3[0].status).toBe("unavailable")
  })

  it("oculta starting hasta la segunda lectura consecutiva", () => {
    const starting: PulseSummaryEntry = {
      ...base(),
      readiness: "starting",
    }
    const r1 = applyPresentationStability([starting], "test:scope2")
    expect(r1[0].readiness).toBe("ready")

    const r2 = applyPresentationStability([starting], "test:scope2")
    expect(r2[0].readiness).toBe("starting")
  })
})
