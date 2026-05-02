export type AppStatus = "operational" | "degraded" | "down" | "unavailable"

/** Alineado con el contrato `excelso-pulse-express` (`readiness`). */
export type PulseReadiness = "starting" | "ready"

/** Alineado con el contrato `excelso-pulse-express` (`user_impact`). */
export type PulseUserImpact = "none" | "limited" | "outage"

export interface PulseMetrics {
  latency_ms: number
  uptime_percent: number
  requests_24h: number
  error_rate: number
}

export interface BusinessKPIs {
  label: string
  value: string | number
  trend?: "up" | "down" | "stable"
}

export interface Infrastructure {
  vercel: boolean
  ai_api: boolean
  /** `unknown` cuando el backend no envía `infrastructure` o no aplica. */
  database: "mongodb" | "postgres" | "unknown"
  db_status: "connected" | "degraded" | "disconnected" | "unknown"
}

export interface PulseLog {
  timestamp: string
  event: string
  type: "info" | "warning" | "error" | "success"
}

/** Códigos de fallo al obtener o interpretar pulse en el Hub (texto UI vía i18n). */
export type PulseFetchErrorCode =
  | "missing_secret"
  | "timeout"
  | "aborted"
  | "http_error"
  | "invalid_json"
  | "html_response"
  | "empty_body"
  | "network"
  | "pulse_schema_mismatch"

export interface AppPulse {
  id: string
  name: string
  description: string
  icon: string
  /** URL pública de la app (front); el agregador sigue usando `pulseUrl` en servidor. */
  appUrl?: string
  /** Estado técnico del origen (contrato operativo). */
  status: AppStatus
  readiness: PulseReadiness
  user_impact: PulseUserImpact
  pulse_version: string
  metrics: PulseMetrics
  kpis: BusinessKPIs[]
  infrastructure: Infrastructure
  ai_context: string
  logs: PulseLog[]
  last_updated: string
  /** Si existe, el panel muestra mensaje localizado en lugar del texto crudo del agregador. */
  pulseFetchError?: { code: PulseFetchErrorCode; message: string }
}
