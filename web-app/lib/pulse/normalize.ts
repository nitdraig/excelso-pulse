import { z } from "zod"
import type {
  AppStatus,
  AppPulse,
  BusinessKPIs,
  Infrastructure,
  PulseLog,
  PulseMetrics,
} from "@/lib/types"
import { resolvePulsePresentation } from "@/lib/pulse/derive-presentation"

const kpiItem = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  trend: z.enum(["up", "down", "stable"]).optional(),
})

const logItem = z.object({
  timestamp: z.string(),
  event: z.string(),
  type: z.enum(["info", "warning", "error", "success"]),
})

/** Cuerpo mínimo del pulse: métricas e infra se aceptan como `unknown` para soportar varios contratos. */
const pulseBody = z
  .object({
    pulse_version: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    status: z.string().optional(),
    metrics: z.unknown().optional(),
    kpis: z.array(kpiItem).optional(),
    infrastructure: z.unknown().optional(),
    ai_context: z.string().optional(),
    logs: z.array(logItem).optional(),
    last_updated: z.string().optional(),
    context: z
      .object({
        product_name: z.string().optional(),
        environment: z.string().optional(),
        generated_at: z.string().optional(),
        collection_duration_ms: z.number().optional(),
      })
      .optional(),
    readiness: z.enum(["starting", "ready"]).optional(),
    user_impact: z.enum(["none", "limited", "outage"]).optional(),
  })
  .passthrough()

const defaultMetrics = (): PulseMetrics => ({
  latency_ms: 0,
  uptime_percent: 0,
  requests_24h: 0,
  error_rate: 0,
})

/** Valores por defecto cuando el origen no informa infra (no implica Mongo caído). */
export const defaultInfra = (): Infrastructure => ({
  vercel: false,
  ai_api: false,
  database: "unknown",
  db_status: "unknown",
})

function mergeMetrics(partial?: Partial<PulseMetrics>): PulseMetrics {
  return { ...defaultMetrics(), ...partial }
}

function mergeInfra(partial?: Partial<Infrastructure>): Infrastructure {
  return { ...defaultInfra(), ...partial }
}

function normalizePulseStatus(raw?: string): AppStatus {
  const s = (raw ?? "operational").trim().toLowerCase()
  if (
    s === "operational" ||
    s === "ok" ||
    s === "healthy" ||
    s === "up" ||
    s === "running"
  ) {
    return "operational"
  }
  if (s === "degraded" || s === "warning" || s === "partial") return "degraded"
  if (s === "down" || s === "error" || s === "unhealthy" || s === "offline") return "down"
  return "operational"
}

type InfraListEntry = {
  id?: string
  name?: string
  kind?: string
  status?: string
  latency_ms?: number
  detail?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function isInfraComponentList(v: unknown): v is InfraListEntry[] {
  if (!Array.isArray(v) || v.length === 0) return false
  const first = v[0]
  if (!isRecord(first)) return false
  return "kind" in first || "status" in first || "id" in first
}

function mapListStatusToDbStatus(s?: string): Infrastructure["db_status"] {
  const x = (s ?? "").trim().toLowerCase()
  if (x === "up" || x === "ok" || x === "healthy" || x === "connected" || x === "running") {
    return "connected"
  }
  if (x === "degraded" || x === "slow" || x === "warning") return "degraded"
  if (x === "down" || x === "error" || x === "offline" || x === "disconnected") {
    return "disconnected"
  }
  return "unknown"
}

function inferDatabaseFromEntry(e: InfraListEntry): Infrastructure["database"] {
  const id = (e.id ?? "").toLowerCase()
  const name = (e.name ?? "").toLowerCase()
  if (id.includes("postgres") || name.includes("postgres")) return "postgres"
  if (id.includes("mongo") || name.includes("mongo")) return "mongodb"
  const kind = (e.kind ?? "").toLowerCase()
  if (kind === "database" || kind === "db") {
    if (id.includes("pg") || name.includes("pg")) return "postgres"
    return "mongodb"
  }
  return "unknown"
}

function infrastructureFromList(items: InfraListEntry[]): Infrastructure {
  const base = defaultInfra()
  const vercel = items.some((i) => {
    const blob = `${i.id ?? ""} ${i.name ?? ""}`.toLowerCase()
    return blob.includes("vercel")
  })
  const ai_api = items.some((i) => {
    const k = (i.kind ?? "").toLowerCase()
    const blob = `${i.id ?? ""} ${i.name ?? ""}`.toLowerCase()
    return (
      k === "ai" ||
      k === "llm" ||
      blob.includes("openai") ||
      blob.includes("anthropic") ||
      blob.includes("gemini")
    )
  })

  const dbCandidates = items.filter((i) => {
    const kind = (i.kind ?? "").toLowerCase()
    if (kind === "database" || kind === "db") return true
    const id = (i.id ?? "").toLowerCase()
    return id.includes("mongo") || id.includes("postgres") || id.includes("mysql")
  })
  /** Solo filas que parecen BD: no usar otros componentes (p. ej. cola con `warning`) como proxy de Mongo. */
  const db = dbCandidates[0]

  if (!db) {
    return { ...base, vercel, ai_api }
  }

  const database = inferDatabaseFromEntry(db)
  const db_status = mapListStatusToDbStatus(db.status)
  return { vercel, ai_api, database, db_status }
}

function databaseLatencyFromList(items: InfraListEntry[]): number | undefined {
  const dbCandidates = items.filter((i) => {
    const kind = (i.kind ?? "").toLowerCase()
    if (kind === "database" || kind === "db") return true
    const id = (i.id ?? "").toLowerCase()
    return id.includes("mongo") || id.includes("postgres")
  })
  const withLat = dbCandidates.find((i) => typeof i.latency_ms === "number")
  if (withLat?.latency_ms != null) return withLat.latency_ms
  const anyLat = items.find((i) => typeof i.latency_ms === "number")
  return anyLat?.latency_ms
}

function infrastructureFromUnknown(infra: unknown): Infrastructure {
  if (infra == null) return defaultInfra()
  if (isInfraComponentList(infra)) {
    return infrastructureFromList(infra)
  }
  if (!isRecord(infra)) return defaultInfra()
  const partial: Partial<Infrastructure> = {}
  if (typeof infra.vercel === "boolean") partial.vercel = infra.vercel
  if (typeof infra.ai_api === "boolean") partial.ai_api = infra.ai_api
  const d = infra.database
  if (d === "mongodb" || d === "postgres" || d === "unknown") partial.database = d
  const s = infra.db_status
  if (s === "connected" || s === "degraded" || s === "disconnected" || s === "unknown") {
    partial.db_status = s
  }
  return mergeInfra(partial)
}

function metricsFromUnknown(
  metrics: unknown,
  opts: { dbLatencyMs?: number },
): PulseMetrics {
  if (!isRecord(metrics)) {
    return mergeMetrics(opts.dbLatencyMs != null ? { latency_ms: opts.dbLatencyMs } : {})
  }

  const flat: Partial<PulseMetrics> = {}
  for (const k of ["latency_ms", "uptime_percent", "requests_24h", "error_rate"] as const) {
    const v = metrics[k]
    if (typeof v === "number") flat[k] = v
  }
  if (
    typeof flat.latency_ms === "number" ||
    typeof flat.uptime_percent === "number" ||
    typeof flat.requests_24h === "number" ||
    typeof flat.error_rate === "number"
  ) {
    const m = mergeMetrics(flat)
    if (opts.dbLatencyMs != null && m.latency_ms === 0) {
      return { ...m, latency_ms: opts.dbLatencyMs }
    }
    return m
  }

  const technical = metrics.technical
  if (!isRecord(technical)) {
    return mergeMetrics(opts.dbLatencyMs != null ? { latency_ms: opts.dbLatencyMs } : {})
  }

  const out: Partial<PulseMetrics> = {}
  if (typeof technical.latency_ms === "number") out.latency_ms = technical.latency_ms
  if (typeof technical.uptime_percent === "number") out.uptime_percent = technical.uptime_percent
  if (typeof technical.requests_24h === "number") out.requests_24h = technical.requests_24h
  if (typeof technical.error_rate === "number") out.error_rate = technical.error_rate

  const merged = mergeMetrics(out)
  if (opts.dbLatencyMs != null) {
    return { ...merged, latency_ms: merged.latency_ms || opts.dbLatencyMs }
  }
  return merged
}

function kpisFromMetricsUnknown(metrics: unknown, existing: BusinessKPIs[]): BusinessKPIs[] {
  if (existing.length > 0) return existing
  if (!isRecord(metrics)) return []
  const business = metrics.business
  if (!isRecord(business) || Object.keys(business).length === 0) {
    const technical = metrics.technical
    if (!isRecord(technical)) return []
    const extra: BusinessKPIs[] = []
    if (typeof technical.uptime_s === "number") {
      extra.push({ label: "Uptime proceso (s)", value: technical.uptime_s })
    }
    const mem = technical.memory
    if (isRecord(mem) && typeof mem.heap_used_mb === "number") {
      extra.push({ label: "Heap (MB)", value: mem.heap_used_mb })
    }
    if (typeof technical.node_version === "string" && technical.node_version.length > 0) {
      extra.push({ label: "Node", value: technical.node_version })
    }
    return extra
  }
  return Object.entries(business).map(([label, value]) => ({
    label,
    value: typeof value === "number" || typeof value === "string" ? value : String(value),
  }))
}

/**
 * Interpreta el JSON de `GET .../internal/pulse` y lo adapta al modelo de la UI.
 * Soporta el contrato plano histórico y variantes con `context`, `metrics.technical` / `business`
 * e `infrastructure` como lista de componentes (`kind`, `status`, `latency_ms`, …).
 */
export function normalizeBackendPulse(
  raw: unknown,
  appId: string,
): { pulse: Omit<AppPulse, "id">; contract_version: string } {
  const parsed = pulseBody.safeParse(raw)
  if (!parsed.success) {
    const now = new Date().toISOString()
    const pres = resolvePulsePresentation("unavailable", null, undefined, undefined)
    return {
      contract_version: "unknown",
      pulse: {
        name: appId,
        description: "",
        icon: "📦",
        status: "unavailable",
        readiness: pres.readiness,
        user_impact: pres.user_impact,
        pulse_version: "?",
        metrics: defaultMetrics(),
        kpis: [] as BusinessKPIs[],
        infrastructure: defaultInfra(),
        ai_context: "Respuesta no reconocida o contrato incompatible.",
        logs: [
          {
            timestamp: now,
            event: "No se pudo interpretar el JSON del backend",
            type: "error",
          },
        ],
        last_updated: now,
      },
    }
  }

  const d = parsed.data
  const contract_version = "1"
  const pv = d.pulse_version != null ? String(d.pulse_version) : "1"
  const now = new Date().toISOString()
  const status = normalizePulseStatus(d.status)

  const infraList = isInfraComponentList(d.infrastructure) ? d.infrastructure : null
  const dbLatency = infraList ? databaseLatencyFromList(infraList) : undefined

  const presentation = resolvePulsePresentation(
    status,
    infraList,
    d.readiness,
    d.user_impact,
  )

  const infrastructure = infrastructureFromUnknown(d.infrastructure)
  const metrics = metricsFromUnknown(d.metrics, { dbLatencyMs: dbLatency })
  const name = d.name?.trim() || d.context?.product_name?.trim() || appId
  const description =
    d.description?.trim() ||
    (d.context?.environment ? `Entorno: ${d.context.environment}` : "")
  const last_updated = d.last_updated ?? d.context?.generated_at ?? now

  const kpis = kpisFromMetricsUnknown(d.metrics, (d.kpis ?? []) as BusinessKPIs[])

  const logs: PulseLog[] =
    d.logs && d.logs.length > 0
      ? (d.logs as PulseLog[])
      : [
          {
            timestamp: last_updated,
            event: "Sincronizado desde backend pulse",
            type: "success",
          },
        ]

  return {
    contract_version,
    pulse: {
      name,
      description,
      icon: d.icon ?? "📦",
      status,
      readiness: presentation.readiness,
      user_impact: presentation.user_impact,
      pulse_version: pv,
      metrics,
      kpis,
      infrastructure,
      ai_context: d.ai_context ?? "",
      logs,
      last_updated,
    },
  }
}
