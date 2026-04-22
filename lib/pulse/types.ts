import type {
  AppStatus,
  BusinessKPIs,
  Infrastructure,
  PulseLog,
  PulseMetrics,
} from "@/lib/types"

export type PulseFetchErrorCode =
  | "missing_secret"
  | "timeout"
  | "aborted"
  | "http_error"
  | "invalid_json"
  | "empty_body"
  | "network"

export type PulseSummaryEntry = {
  appId: string
  contract_version: string
  pulse_version: string
  status: AppStatus
  name?: string
  description?: string
  icon?: string
  metrics: PulseMetrics
  kpis: BusinessKPIs[]
  infrastructure: Infrastructure
  ai_context: string
  logs: PulseLog[]
  last_updated: string
  fetchedAt: string
  error?: { code: PulseFetchErrorCode; message: string }
}

export type PulseSource = {
  appId: string
  pulseUrl: string
  bearerToken: string | null
}
