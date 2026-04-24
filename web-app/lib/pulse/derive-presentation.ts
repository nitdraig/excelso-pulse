import type { AppStatus, PulseReadiness, PulseUserImpact } from "@/lib/types"

// Heurística de presentación: mantener alineada con `npm/src/derivePulsePresentation.ts`.

type PulseOverallStatus = "ok" | "degraded" | "down"

type InfrastructureKind = "database" | "integration" | "cache"

type InfrastructureStatus = "up" | "down" | "degraded" | "unknown"

interface InfrastructureItem {
  kind: InfrastructureKind
  status: InfrastructureStatus
  detail?: string
}

function isTransitionalDetail(detail?: string): boolean {
  const d = (detail ?? "").trim().toLowerCase()
  return d === "connecting" || d === "disconnecting"
}

function isTransitionalItem(item: InfrastructureItem): boolean {
  return item.kind === "database" && isTransitionalDetail(item.detail)
}

function hasProblemItem(item: InfrastructureItem): boolean {
  return item.status !== "up"
}

function derivePulsePresentation(
  status: PulseOverallStatus,
  infrastructure: InfrastructureItem[]
): { readiness: PulseReadiness; user_impact: PulseUserImpact } {
  const readiness: PulseReadiness = infrastructure.some(isTransitionalItem) ? "starting" : "ready"

  if (status === "down") {
    return { readiness, user_impact: "outage" }
  }
  if (status === "ok") {
    return { readiness, user_impact: "none" }
  }

  const problems = infrastructure.filter(hasProblemItem)
  if (problems.length === 0) {
    return { readiness, user_impact: "none" }
  }

  const onlyTransitionalProblems = problems.every((p) => isTransitionalItem(p))
  if (onlyTransitionalProblems) {
    return { readiness, user_impact: "none" }
  }

  return { readiness, user_impact: "limited" }
}

export type InfraListEntryForPresentation = {
  kind?: string
  status?: string
  detail?: string
}

function mapEntryKind(k?: string): InfrastructureKind {
  const x = (k ?? "").toLowerCase()
  if (x === "database" || x === "db") return "database"
  if (x === "cache") return "cache"
  return "integration"
}

function mapEntryStatus(s?: string): InfrastructureStatus {
  const x = (s ?? "").trim().toLowerCase()
  if (x === "up" || x === "ok" || x === "healthy" || x === "connected" || x === "running") {
    return "up"
  }
  if (x === "degraded" || x === "slow" || x === "warning") return "degraded"
  if (x === "down" || x === "error" || x === "offline" || x === "disconnected") return "down"
  return "unknown"
}

function listToInfrastructureItems(list: InfraListEntryForPresentation[]): InfrastructureItem[] {
  return list.map((e) => ({
    kind: mapEntryKind(e.kind),
    status: mapEntryStatus(e.status),
    detail: typeof e.detail === "string" ? e.detail : undefined,
  }))
}

function appStatusToOverall(s: AppStatus): PulseOverallStatus {
  if (s === "operational") return "ok"
  if (s === "degraded") return "degraded"
  return "down"
}

/**
 * Derivación alineada con `excelso-pulse-express` (`derivePulsePresentation`).
 * Usa `readiness` / `user_impact` del servidor si vienen en el JSON; si no, infiere desde status + lista de infra.
 */
export function resolvePulsePresentation(
  technicalStatus: AppStatus,
  infraList: InfraListEntryForPresentation[] | null,
  serverReadiness?: unknown,
  serverUserImpact?: unknown,
): { readiness: PulseReadiness; user_impact: PulseUserImpact } {
  if (serverReadiness === "starting" || serverReadiness === "ready") {
    if (serverUserImpact === "none" || serverUserImpact === "limited" || serverUserImpact === "outage") {
      return {
        readiness: serverReadiness,
        user_impact: serverUserImpact,
      }
    }
  }

  if (technicalStatus === "unavailable") {
    return { readiness: "ready", user_impact: "outage" }
  }

  const items = infraList?.length ? listToInfrastructureItems(infraList) : []
  return derivePulsePresentation(appStatusToOverall(technicalStatus), items)
}
