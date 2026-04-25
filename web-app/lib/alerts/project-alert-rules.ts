/** Tipos de regla persistidos en MongoDB (sin dependencia de Mongoose; usable en cliente). */
export const PROJECT_ALERT_RULE_TYPES = [
  "latency_above",
  "error_rate_above",
  "readiness_not_ready",
  "user_impact_limited",
  "user_impact_outage",
] as const

export type ProjectAlertRuleType = (typeof PROJECT_ALERT_RULE_TYPES)[number]
