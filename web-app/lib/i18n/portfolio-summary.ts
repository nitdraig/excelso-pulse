import type { AppPulse } from "@/lib/types"
import type { Locale } from "@/lib/i18n/types"

type Meta = { roundDurationMs?: number; fromCache?: boolean }

export function buildPortfolioSummary(
  locale: Locale,
  apps: AppPulse[],
  meta?: Meta,
): string {
  if (apps.length === 0) {
    return locale === "es"
      ? "Registra orígenes pulse (slug, URL `/internal/pulse` y token Bearer en el servidor). El panel solo llama a tus backends desde el agregador autenticado; los tokens no salen al navegador."
      : "Register pulse sources (slug, `/internal/pulse` URL and Bearer token on the server). The dashboard only calls your backends from the authenticated aggregator; tokens never reach the browser."
  }

  const ready = apps.filter((a) => a.user_impact === "none" && a.readiness === "ready").length
  const starting = apps.filter((a) => a.readiness === "starting" && a.user_impact === "none").length
  const limited = apps.filter((a) => a.user_impact === "limited").length
  const outage = apps.filter((a) => a.user_impact === "outage").length

  const extra =
    meta?.roundDurationMs != null
      ? locale === "es"
        ? ` Última ronda agregada en ~${meta.roundDurationMs} ms${meta.fromCache ? " (caché)" : ""}.`
        : ` Last aggregated round in ~${meta.roundDurationMs} ms${meta.fromCache ? " (cached)" : ""}.`
      : ""

  if (locale === "es") {
    return `Portfolio: ${apps.length} origen(es); ${ready} listos para tráfico${starting > 0 ? `, ${starting} en arranque/conexión` : ""}${limited > 0 ? `, ${limited} con rendimiento limitado` : ""}${outage > 0 ? `, ${outage} sin servicio o datos` : ""}.${extra}`
  }

  return `Portfolio: ${apps.length} source(s); ${ready} ready for traffic${starting > 0 ? `, ${starting} warming up` : ""}${limited > 0 ? `, ${limited} with limited performance` : ""}${outage > 0 ? `, ${outage} down or missing data` : ""}.${extra}`
}
