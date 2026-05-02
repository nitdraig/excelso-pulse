import { describe, expect, it, vi, afterEach } from "vitest"

describe("getDashboardAutoRefreshMs", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("default 30s cuando no hay variable", async () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_AUTO_REFRESH_MS", "")
    vi.resetModules()
    const { getDashboardAutoRefreshMs } = await import("@/lib/dashboard-auto-refresh")
    expect(getDashboardAutoRefreshMs()).toBe(30_000)
  })

  it("0 desactiva", async () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_AUTO_REFRESH_MS", "0")
    vi.resetModules()
    const { getDashboardAutoRefreshMs } = await import("@/lib/dashboard-auto-refresh")
    expect(getDashboardAutoRefreshMs()).toBe(0)
  })
})
