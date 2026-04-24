import type {
  InfrastructureItem,
  PulseOverallStatus,
  PulseReadiness,
  PulseUserImpact,
} from "./types";

function isTransitionalDetail(detail?: string): boolean {
  const d = (detail ?? "").trim().toLowerCase();
  return d === "connecting" || d === "disconnecting";
}

function isTransitionalItem(item: InfrastructureItem): boolean {
  return item.kind === "database" && isTransitionalDetail(item.detail);
}

function hasProblemItem(item: InfrastructureItem): boolean {
  return item.status !== "up";
}

/**
 * Señales pensadas para UI / producto a partir del contrato operativo.
 * No sustituye `status` agregado: convive para alertas y copy.
 */
export function derivePulsePresentation(
  status: PulseOverallStatus,
  infrastructure: InfrastructureItem[]
): { readiness: PulseReadiness; user_impact: PulseUserImpact } {
  const readiness: PulseReadiness = infrastructure.some(isTransitionalItem)
    ? "starting"
    : "ready";

  if (status === "down") {
    return { readiness, user_impact: "outage" };
  }
  if (status === "ok") {
    return { readiness, user_impact: "none" };
  }

  const problems = infrastructure.filter(hasProblemItem);
  if (problems.length === 0) {
    return { readiness, user_impact: "none" };
  }

  const onlyTransitionalProblems = problems.every((p) => isTransitionalItem(p));
  if (onlyTransitionalProblems) {
    return { readiness, user_impact: "none" };
  }

  return { readiness, user_impact: "limited" };
}
