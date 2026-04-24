import { AppPulse } from "./types"

export const mockApps: AppPulse[] = [
  {
    id: "fuddy",
    name: "Fuddy",
    description: "Sustainability & Food Waste Platform",
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
      { label: "Waste Reduced", value: "2.4 tons", trend: "up" },
      { label: "Active Partners", value: 847, trend: "up" },
      { label: "CO₂ Saved", value: "12.3t", trend: "up" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "postgres",
      db_status: "connected",
    },
    ai_context:
      "Fuddy is performing excellently with record food rescue operations this week. Partner network expanded by 12% and sustainability metrics show strong improvement trends.",
    logs: [
      { timestamp: "2024-01-15T14:32:00Z", event: "Deploy v2.4.1 completed", type: "success" },
      { timestamp: "2024-01-15T14:30:00Z", event: "Health check passed", type: "info" },
      { timestamp: "2024-01-15T12:15:00Z", event: "New partner onboarded: EcoMart", type: "info" },
      { timestamp: "2024-01-15T10:00:00Z", event: "Daily metrics sync completed", type: "success" },
    ],
    last_updated: "2024-01-15T14:32:00Z",
  },
  {
    id: "jema",
    name: "JEMA",
    description: "AI-Powered Environmental Analytics",
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
      { label: "Model Accuracy", value: "94.2%", trend: "stable" },
      { label: "Data Sources", value: 23, trend: "up" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "postgres",
      db_status: "connected",
    },
    ai_context:
      "JEMA ML models are performing at peak efficiency. New climate data integration completed successfully. Prediction accuracy maintained above 94% threshold.",
    logs: [
      { timestamp: "2024-01-15T14:28:00Z", event: "Model retrain completed", type: "success" },
      { timestamp: "2024-01-15T13:45:00Z", event: "Climate API sync", type: "info" },
      { timestamp: "2024-01-15T12:00:00Z", event: "Batch predictions processed", type: "success" },
      { timestamp: "2024-01-15T08:30:00Z", event: "Data pipeline healthy", type: "info" },
    ],
    last_updated: "2024-01-15T14:28:00Z",
  },
  {
    id: "skipy",
    name: "Skipy",
    description: "Developer Tools & Automation Suite",
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
      { label: "Time Saved", value: "340h", trend: "up" },
      { label: "Active Devs", value: 156, trend: "stable" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "mongodb",
      db_status: "degraded",
    },
    ai_context:
      "Skipy is experiencing elevated latency due to MongoDB connection pooling issues. Engineering team has been notified and mitigation is in progress. Core functionality remains available.",
    logs: [
      { timestamp: "2024-01-15T14:35:00Z", event: "Latency spike detected", type: "warning" },
      { timestamp: "2024-01-15T14:32:00Z", event: "DB connection pool at 85%", type: "warning" },
      { timestamp: "2024-01-15T14:00:00Z", event: "Auto-scaling triggered", type: "info" },
      { timestamp: "2024-01-15T13:30:00Z", event: "High traffic alert", type: "warning" },
    ],
    last_updated: "2024-01-15T14:35:00Z",
  },
  {
    id: "mtn",
    name: "Mining Talent Net",
    description: "AI Recruitment & Talent Matching",
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
      { label: "Match Rate", value: "87%", trend: "up" },
      { label: "Placements", value: 234, trend: "up" },
      { label: "Time to Hire", value: "-42%", trend: "up" },
    ],
    infrastructure: {
      vercel: true,
      ai_api: true,
      database: "postgres",
      db_status: "connected",
    },
    ai_context:
      "Mining Talent Net achieved record placement numbers this quarter. AI matching algorithm v4.2 showing 15% improvement in candidate-role fit scores. Enterprise client pipeline growing steadily.",
    logs: [
      { timestamp: "2024-01-15T14:20:00Z", event: "New enterprise client added", type: "success" },
      { timestamp: "2024-01-15T13:00:00Z", event: "Matching algorithm updated", type: "info" },
      { timestamp: "2024-01-15T11:45:00Z", event: "Weekly placement report sent", type: "success" },
      { timestamp: "2024-01-15T09:00:00Z", event: "Morning health check passed", type: "info" },
    ],
    last_updated: "2024-01-15T14:20:00Z",
  },
]

export const getExecutiveSummary = (): string => {
  const ready = mockApps.filter((app) => app.user_impact === "none" && app.readiness === "ready").length
  const limited = mockApps.filter((app) => app.user_impact === "limited").length
  const outage = mockApps.filter((app) => app.user_impact === "outage").length

  return `Good afternoon, Commander. System status report: ${ready} of ${mockApps.length} applications are fully operational${limited > 0 ? `, ${limited} showing limited performance` : ""}${outage > 0 ? `, and ${outage} currently offline` : ""}. Fuddy leads sustainability metrics with 2.4 tons of waste prevented today. JEMA's AI models maintain 94.2% prediction accuracy. Skipy is experiencing elevated latency — engineering team is actively investigating MongoDB connection pooling. Mining Talent Net reports record placement velocity with 87% match rate. Overall ecosystem health: ${outage === 0 ? "Stable" : "Attention Required"}.`
}
