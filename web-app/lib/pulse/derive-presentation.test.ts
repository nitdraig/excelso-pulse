import { describe, expect, it } from "vitest"
import { resolvePulsePresentation } from "@/lib/pulse/derive-presentation"

describe("resolvePulsePresentation", () => {
  it("Mongo connecting → arranque sin impacto", () => {
    const r = resolvePulsePresentation(
      "degraded",
      [{ kind: "database", status: "degraded", detail: "connecting" }],
      undefined,
      undefined,
    )
    expect(r.readiness).toBe("starting")
    expect(r.user_impact).toBe("none")
  })

  it("respeta readiness/user_impact del servidor si son válidos", () => {
    const r = resolvePulsePresentation(
      "degraded",
      [{ kind: "database", status: "down" }],
      "ready",
      "limited",
    )
    expect(r.readiness).toBe("ready")
    expect(r.user_impact).toBe("limited")
  })

  it("unavailable del agregador → outage", () => {
    const r = resolvePulsePresentation("unavailable", null, undefined, undefined)
    expect(r.readiness).toBe("ready")
    expect(r.user_impact).toBe("outage")
  })
})
