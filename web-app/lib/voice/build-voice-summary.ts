import type { PulseSummaryEntry } from "@/lib/pulse/types"

type Locale = "es" | "en"

function severityRank(entry: PulseSummaryEntry): number {
  if (entry.user_impact === "outage") return 0
  if (entry.user_impact === "limited") return 1
  if (entry.status === "degraded") return 2
  if (entry.status === "down" || entry.status === "unavailable") return 2
  return 3
}

function label(entry: PulseSummaryEntry): string {
  return (entry.name && entry.name.trim()) || entry.appId
}

/**
 * Contrato interno de voz: estructura compacta y sin datos sensibles.
 */
export type VoiceSeverity = "outage" | "limited" | "ok"

export type VoiceReportItem = {
  appId: string
  label: string
  severity: VoiceSeverity
  userImpact: PulseSummaryEntry["user_impact"]
}

export type VoiceReport = {
  totalApps: number
  locale: Locale
  counts: {
    outage: number
    limited: number
    ok: number
  }
  highlights: VoiceReportItem[]
  generatedAt: string
}

function toVoiceSeverity(entry: PulseSummaryEntry): VoiceSeverity {
  if (entry.user_impact === "outage") return "outage"
  if (entry.user_impact === "limited") return "limited"
  return "ok"
}

export function buildVoiceReportFromEntries(
  entries: PulseSummaryEntry[],
  locale: Locale
): VoiceReport {
  const sorted = [...entries].sort((a, b) => {
    const d = severityRank(a) - severityRank(b)
    if (d !== 0) return d
    return label(a).localeCompare(label(b))
  })

  const outage = sorted.filter((e) => e.user_impact === "outage").length
  const limited = sorted.filter((e) => e.user_impact === "limited").length
  const ok = Math.max(0, sorted.length - outage - limited)
  const highlights = sorted.slice(0, 5).map((e) => ({
    appId: e.appId,
    label: label(e),
    severity: toVoiceSeverity(e),
    userImpact: e.user_impact,
  }))

  return {
    totalApps: sorted.length,
    locale,
    counts: { outage, limited, ok },
    highlights,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Texto breve para TTS / fulfillment (reglas, sin LLM), generado desde `VoiceReport`.
 */
export function buildVoiceTextFromReport(report: VoiceReport): string {
  const { totalApps, counts, highlights, locale } = report
  if (totalApps === 0) {
    return locale === "es"
      ? "No hay orígenes pulse configurados para este usuario."
      : "There are no pulse sources configured for this user."
  }

  const outageLabels = highlights
    .filter((h) => h.severity === "outage")
    .map((h) => h.label)
  const limitedLabels = highlights
    .filter((h) => h.severity === "limited")
    .map((h) => h.label)
  const hasProblems = counts.outage > 0 || counts.limited > 0

  if (locale === "es") {
    const parts: string[] = []
    parts.push(`Tienes ${totalApps} aplicación${totalApps === 1 ? "" : "es"} en el informe.`)
    if (counts.outage > 0) {
      if (outageLabels.length > 0) {
        parts.push(`Sin servicio o datos: ${outageLabels.join(", ")}.`)
      } else {
        parts.push(`Hay ${counts.outage} app(s) sin servicio o datos.`)
      }
    }
    if (counts.limited > 0) {
      if (limitedLabels.length > 0) {
        parts.push(`Rendimiento limitado: ${limitedLabels.join(", ")}.`)
      } else {
        parts.push(`Hay ${counts.limited} app(s) con rendimiento limitado.`)
      }
    }
    if (counts.ok > 0 && hasProblems) {
      parts.push(`El resto reporta operación aceptable o en arranque.`)
    }
    if (!hasProblems) {
      parts.push("Todo lo comprobado está operativo o en arranque.")
    }
    return parts.join(" ")
  }

  const parts: string[] = []
  parts.push(`You have ${totalApps} app${totalApps === 1 ? "" : "s"} in this report.`)
  if (counts.outage > 0) {
    if (outageLabels.length > 0) {
      parts.push(`Outage or missing data: ${outageLabels.join(", ")}.`)
    } else {
      parts.push(`There are ${counts.outage} app(s) with outage or missing data.`)
    }
  }
  if (counts.limited > 0) {
    if (limitedLabels.length > 0) {
      parts.push(`Limited performance: ${limitedLabels.join(", ")}.`)
    } else {
      parts.push(`There are ${counts.limited} app(s) with limited performance.`)
    }
  }
  if (counts.ok > 0 && hasProblems) {
    parts.push("The remaining apps look acceptable or warming up.")
  }
  if (!hasProblems) {
    parts.push("Everything checked is operational or warming up.")
  }
  return parts.join(" ")
}

export function buildVoiceSummaryFromEntries(
  entries: PulseSummaryEntry[],
  locale: Locale,
): string {
  return buildVoiceTextFromReport(buildVoiceReportFromEntries(entries, locale))
}

export function localeFromLanguageCode(languageCode: string): Locale {
  return languageCode.toLowerCase().startsWith("es") ? "es" : "en"
}
