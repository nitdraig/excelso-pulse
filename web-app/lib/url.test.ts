import { describe, expect, it } from "vitest"
import { updateProjectBodySchema } from "@/lib/validations/api"
import { ensureHttpsUrl } from "@/lib/url"

describe("ensureHttpsUrl", () => {
  it("no modifica https ni http explícitos", () => {
    expect(ensureHttpsUrl("https://api.example.com/x")).toBe("https://api.example.com/x")
    expect(ensureHttpsUrl("HTTP://legacy.local")).toBe("HTTP://legacy.local")
  })

  it("antepone https:// si falta el esquema", () => {
    expect(ensureHttpsUrl("api.example.com/internal/pulse")).toBe(
      "https://api.example.com/internal/pulse",
    )
  })

  it("normaliza protocol-relative", () => {
    expect(ensureHttpsUrl("//cdn.example.com")).toBe("https://cdn.example.com")
  })

  it("respeta vacío y trim", () => {
    expect(ensureHttpsUrl("")).toBe("")
    expect(ensureHttpsUrl("  ")).toBe("")
    expect(ensureHttpsUrl("  foo.com  ")).toBe("https://foo.com")
  })
})

describe("updateProjectBodySchema pulseUrl", () => {
  it("omite pulseUrl sin fallar y normaliza host sin esquema", () => {
    const onlyName = updateProjectBodySchema.safeParse({ name: "X" })
    expect(onlyName.success).toBe(true)
    if (onlyName.success) expect(onlyName.data.pulseUrl).toBeUndefined()

    const withPulse = updateProjectBodySchema.safeParse({
      pulseUrl: "api.test/internal/pulse",
    })
    expect(withPulse.success).toBe(true)
    if (withPulse.success) {
      expect(withPulse.data.pulseUrl).toBe("https://api.test/internal/pulse")
    }
  })
})
