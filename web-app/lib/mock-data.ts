import { AppPulse } from "./types"

/** Datos de demostración genéricos (no ligados a un producto concreto). */
export const mockApps: AppPulse[] = [
  {
    id: "demo-alpha",
    name: "Demo Alpha",
    description: "Sample API — operational",
    icon: "🌱",
    status: "operational",
    readiness: "ready",
    user_impact: "none",
    pulse_version: "2.4.1",
    metrics: {
      latency_ms: 42,
      uptime_percent: 99.98,
      requests_24h: 145230,
      error_rate: 0.02,
    },
    kpis: [
      { label: "Throughput", value: "2.4k rpm", trend: "up" },
      { label: "Active clients", value: 847, trend: "up" },
      { label: "Cache hit", value: "92%", trend: "up" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "postgres",
      db_status: "connected",
    },
    ai_context:
      "Demo Alpha is healthy: latency within SLO, error budget intact, and traffic trending up week over week.",
    logs: [
      { timestamp: "2024-01-15T14:32:00Z", event: "Deploy v2.4.1 completed", type: "success" },
      { timestamp: "2024-01-15T14:30:00Z", event: "Health check passed", type: "info" },
      { timestamp: "2024-01-15T12:15:00Z", event: "Partner integration sync", type: "info" },
      { timestamp: "2024-01-15T10:00:00Z", event: "Daily metrics sync completed", type: "success" },
    ],
    last_updated: "2024-01-15T14:32:00Z",
  },
  {
    id: "demo-beta",
    name: "Demo Beta",
    description: "Sample API — ML workload",
    icon: "🤖",
    status: "operational",
    readiness: "ready",
    user_impact: "none",
    pulse_version: "3.1.0",
    metrics: {
      latency_ms: 78,
      uptime_percent: 99.95,
      requests_24h: 89450,
      error_rate: 0.05,
    },
    kpis: [
      { label: "Predictions/day", value: "45K", trend: "up" },
      { label: "Model accuracy", value: "94.2%", trend: "stable" },
      { label: "Data sources", value: 23, trend: "up" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "postgres",
      db_status: "connected",
    },
    ai_context:
      "Demo Beta inference path is stable; batch jobs completed on schedule and accuracy remains above the agreed threshold.",
    logs: [
      { timestamp: "2024-01-15T14:28:00Z", event: "Model retrain completed", type: "success" },
      { timestamp: "2024-01-15T13:45:00Z", event: "External data sync", type: "info" },
      { timestamp: "2024-01-15T12:00:00Z", event: "Batch predictions processed", type: "success" },
      { timestamp: "2024-01-15T08:30:00Z", event: "Data pipeline healthy", type: "info" },
    ],
    last_updated: "2024-01-15T14:28:00Z",
  },
  {
    id: "demo-gamma",
    name: "Demo Gamma",
    description: "Sample API — degraded DB",
    icon: "⚡",
    status: "degraded",
    readiness: "ready",
    user_impact: "limited",
    pulse_version: "1.8.3",
    metrics: {
      latency_ms: 156,
      uptime_percent: 98.5,
      requests_24h: 234100,
      error_rate: 1.2,
    },
    kpis: [
      { label: "Deployments", value: "1.2K", trend: "up" },
      { label: "Queue depth", value: "340", trend: "up" },
      { label: "Active sessions", value: 156, trend: "stable" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "mongodb",
      db_status: "degraded",
    },
    ai_context:
      "Demo Gamma shows elevated latency tied to database connection pooling; core routes remain available while mitigation is in progress.",
    logs: [
      { timestamp: "2024-01-15T14:35:00Z", event: "Latency spike detected", type: "warning" },
      { timestamp: "2024-01-15T14:32:00Z", event: "DB connection pool at 85%", type: "warning" },
      { timestamp: "2024-01-15T14:00:00Z", event: "Auto-scaling triggered", type: "info" },
      { timestamp: "2024-01-15T13:30:00Z", event: "High traffic alert", type: "warning" },
    ],
    last_updated: "2024-01-15T14:35:00Z",
  },
  {
    id: "demo-delta",
    name: "Demo Delta",
    description: "Sample API — hiring domain mock",
    icon: "💎",
    status: "operational",
    readiness: "ready",
    user_impact: "none",
    pulse_version: "4.2.0",
    metrics: {
      latency_ms: 63,
      uptime_percent: 99.92,
      requests_24h: 67800,
      error_rate: 0.08,
    },
    kpis: [
      { label: "Match rate", value: "87%", trend: "up" },
      { label: "Placements", value: 234, trend: "up" },
      { label: "Time to hire", value: "-42%", trend: "up" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "postgres",
      db_status: "connected",
    },
    ai_context:
      "Demo Delta reports strong placement velocity; matching pipeline is healthy and enterprise traffic is within forecast.",
    logs: [
      { timestamp: "2024-01-15T14:20:00Z", event: "New tenant onboarded", type: "success" },
      { timestamp: "2024-01-15T13:00:00Z", event: "Matching rules updated", type: "info" },
      { timestamp: "2024-01-15T11:45:00Z", event: "Weekly report sent", type: "success" },
      { timestamp: "2024-01-15T09:00:00Z", event: "Morning health check passed", type: "info" },
    ],
    last_updated: "2024-01-15T14:20:00Z",
  },
]

export const getExecutiveSummary = (): string => {
  const ready = mockApps.filter((app) => app.user_impact === "none" && app.readiness === "ready").length
  const limited = mockApps.filter((app) => app.user_impact === "limited").length
  const outage = mockApps.filter((app) => app.user_impact === "outage").length

  return `Excelso Pulse — demo portfolio: ${ready} of ${mockApps.length} sources are fully operational${limited > 0 ? `, ${limited} with limited user impact` : ""}${outage > 0 ? `, and ${outage} offline` : ""}. Demo Alpha and Demo Delta are green; Demo Beta holds steady ML throughput; Demo Gamma shows elevated latency while the database pool is tuned. Overall: ${outage === 0 ? "stable" : "attention required"}.`
}
