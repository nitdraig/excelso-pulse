import { describe, expect, it } from "vitest"
import {
  extractFirstBalancedJson,
  parsePulseResponseBody,
} from "@/lib/pulse/parse-pulse-response"

describe("extractFirstBalancedJson", () => {
  it("extrae objeto con llaves en strings", () => {
    const s = 'prefix {"a": "brace } here", "b": 1} tail'
    expect(extractFirstBalancedJson(s)).toBe(
      '{"a": "brace } here", "b": 1}',
    )
  })
})

describe("parsePulseResponseBody", () => {
  it("acepta JSON puro", () => {
    const r = parsePulseResponseBody('{"pulse_version":1,"status":"operational"}')
    expect(r.ok && r.json).toEqual(
      expect.objectContaining({ pulse_version: 1, status: "operational" }),
    )
  })

  it("extrae JSON dentro de HTML (p. ej. pre)", () => {
    const inner = JSON.stringify({
      pulse_version: "1",
      status: "operational",
      metrics: { latency_ms: 1 },
    })
    const wrapped = `<!DOCTYPE html><html><body><pre>${inner}</pre></body></html>`
    const r = parsePulseResponseBody(wrapped)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.json).toMatchObject({ status: "operational" })
    }
  })

  it("clasifica HTML sin JSON como html", () => {
    const r = parsePulseResponseBody("<html><body>404</body></html>")
    expect(r).toEqual({ ok: false, reason: "html" })
  })

  it("BOM + espacios antes del JSON", () => {
    const r = parsePulseResponseBody(`\uFEFF  \n{"status":"degraded"}`)
    expect(r.ok && r.json).toMatchObject({ status: "degraded" })
  })
})
