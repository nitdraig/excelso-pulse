export type AppStatus = "operational" | "degraded" | "down" | "unavailable"

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

export interface AppPulse {
  id: string
  name: string
  description: string
  icon: string
  /** URL pública de la app (front); el agregador sigue usando `pulseUrl` en servidor. */
  appUrl?: string
  status: AppStatus
  pulse_version: string
  metrics: PulseMetrics
  kpis: BusinessKPIs[]
  infrastructure: Infrastructure
  ai_context: string
  logs: PulseLog[]
  last_updated: string
}
