/**
 * Contrato del Health & Business Pulse (v1).
 * Extensible: nuevos probes implementan {@link PulseProbe}.
 */

export type PulseReadiness = "starting" | "ready";

export type PulseUserImpact = "none" | "limited" | "outage";

export type PulseOverallStatus = "ok" | "degraded" | "down";

export type InfrastructureKind = "database" | "integration" | "cache";

export type InfrastructureStatus = "up" | "down" | "degraded" | "unknown";

export interface InfrastructureItem {
  id: string;
  name: string;
  kind: InfrastructureKind;
  status: InfrastructureStatus;
  latency_ms?: number;
  detail?: string;
}

export interface PulseProbeCheckResult {
  status: InfrastructureStatus;
  latency_ms?: number;
  detail?: string;
}

export interface PulseProbe {
  readonly id: string;
  readonly name: string;
  readonly kind: InfrastructureKind;
  check(): Promise<PulseProbeCheckResult>;
}

export interface PulsePayload {
  pulse_version: "1";
  status: PulseOverallStatus;
  /** Dependencias listas para tráfico vs transición (p. ej. Mongo `connecting`). */
  readiness: PulseReadiness;
  /** Impacto percibido para usuarios / copy de UI (no equivale 1:1 a `status`). */
  user_impact: PulseUserImpact;
  context: {
    product_name: string;
    environment: string;
    generated_at: string;
    collection_duration_ms: number;
  };
  ai_context: string;
  metrics: {
    technical: {
      uptime_s: number;
      node_version: string;
      memory: {
        heap_used_mb: number;
        heap_total_mb: number;
        external_mb: number;
      };
    };
    business: Record<string, unknown>;
  };
  infrastructure: InfrastructureItem[];
}
