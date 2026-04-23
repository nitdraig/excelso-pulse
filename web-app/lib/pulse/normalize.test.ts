import { describe, expect, it } from "vitest"
import { normalizeBackendPulse } from "@/lib/pulse/normalize"

describe("normalizeBackendPulse", () => {
  it("mapea contrato con context, metrics.technical e infrastructure[]", () => {
    const raw = {
      pulse_version: "1",
      status: "ok",
      context: {
        product_name: "skipy",
        environment: "production",
        generated_at: "2026-04-21T23:43:49.341Z",
        collection_duration_ms: 115,
      },
      ai_context: "",
      metrics: {
        technical: {
          uptime_s: 106.6,
          node_version: "v22.22.2",
          memory: { heap_used_mb: 21, heap_total_mb: 24, external_mb: 22 },
        },
        business: {},
      },
      infrastructure: [
        {
          id: "mongodb",
          name: "MongoDB",
          kind: "database",
          status: "up",
          latency_ms: 115,
        },
      ],
    }

    const { pulse } = normalizeBackendPulse(raw, "skipy")

    expect(pulse.status).toBe("operational")
    expect(pulse.name).toBe("skipy")
    expect(pulse.description).toBe("Entorno: production")
    expect(pulse.last_updated).toBe("2026-04-21T23:43:49.341Z")
    expect(pulse.metrics.latency_ms).toBe(115)
    expect(pulse.infrastructure.database).toBe("mongodb")
    expect(pulse.infrastructure.db_status).toBe("connected")
    expect(pulse.kpis.some((k) => k.label.includes("Uptime"))).toBe(true)
    expect(pulse.kpis.some((k) => k.label.includes("Heap"))).toBe(true)
  })

  it("no usa un componente no-BD con warning como estado de la base de datos", () => {
    const { pulse } = normalizeBackendPulse(
      {
        pulse_version: "1",
        status: "ok",
        infrastructure: [
          { id: "worker", kind: "queue", name: "Jobs", status: "warning" },
          {
            id: "mongodb",
            name: "MongoDB",
            kind: "database",
            status: "up",
            latency_ms: 12,
          },
        ],
        metrics: { technical: {}, business: {} },
      },
      "app",
    )
    expect(pulse.infrastructure.database).toBe("mongodb")
    expect(pulse.infrastructure.db_status).toBe("connected")
  })

  it("sigue aceptando métricas planas e infra objeto", () => {
    const { pulse } = normalizeBackendPulse(
      {
        status: "operational",
        metrics: { latency_ms: 40, uptime_percent: 99 },
        infrastructure: { database: "postgres", db_status: "connected", vercel: true },
      },
      "app",
    )
    expect(pulse.metrics.latency_ms).toBe(40)
    expect(pulse.metrics.uptime_percent).toBe(99)
    expect(pulse.infrastructure.database).toBe("postgres")
    expect(pulse.infrastructure.vercel).toBe(true)
  })
})
