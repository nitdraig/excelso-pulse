import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/pulse/config", () => ({
  getPulseFetchTimeoutMs: () => 5000,
  getPulseRoundTimeoutMs: () => 10_000,
}))

import { aggregatePulseSources } from "@/lib/pulse/aggregate"

describe("aggregatePulseSources", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("marca unavailable ante HTTP de error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "",
    }) as unknown as typeof fetch

    const { entries } = await aggregatePulseSources([
      { appId: "a", pulseUrl: "https://example.test/internal/pulse", bearerToken: "t" },
    ])

    expect(entries[0].appId).toBe("a")
    expect(entries[0].status).toBe("unavailable")
    expect(entries[0].readiness).toBe("ready")
    expect(entries[0].user_impact).toBe("outage")
    expect(entries[0].error?.code).toBe("http_error")
  })

  it("normaliza JSON válido del backend", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          pulse_version: "1",
          status: "operational",
          metrics: { latency_ms: 33, uptime_percent: 99.9 },
          ai_context: "Todo bien",
        }),
    }) as unknown as typeof fetch

    const { entries, roundDurationMs } = await aggregatePulseSources([
      { appId: "svc", pulseUrl: "https://svc.test/internal/pulse", bearerToken: "tok" },
    ])

    expect(entries[0].status).toBe("operational")
    expect(entries[0].readiness).toBe("ready")
    expect(entries[0].user_impact).toBe("none")
    expect(entries[0].metrics.latency_ms).toBe(33)
    expect(entries[0].infrastructure.database).toBe("unknown")
    expect(entries[0].infrastructure.db_status).toBe("unknown")
    expect(roundDurationMs).toBeGreaterThanOrEqual(0)
  })
})
