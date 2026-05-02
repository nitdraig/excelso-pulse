import type {
  AppStatus,
  BusinessKPIs,
  Infrastructure,
  PulseFetchErrorCode,
  PulseLog,
  PulseMetrics,
  PulseReadiness,
  PulseUserImpact,
} from "@/lib/types"

export type { PulseFetchErrorCode }

export type PulseSummaryEntry = {
  appId: string
  contract_version: string
  pulse_version: string
  status: AppStatus
  readiness: PulseReadiness
  user_impact: PulseUserImpact
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
