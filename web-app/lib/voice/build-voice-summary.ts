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
  /** True si el Hub registró error al obtener o interpretar el pulse (timeout, HTTP, JSON, etc.). */
  hubFetchFailed: boolean
}

export type VoiceReport = {
  totalApps: number
  locale: Locale
  counts: {
    outage: number
    limited: number
    ok: number
  }
  /** Outage con error de agregación: lectura no válida esta ronda (no siempre “producto caído”). */
  outageFetchLabels: string[]
  /** Outage sin error del Hub: el backend pulse reportó impacto severo. */
  outageSignalLabels: string[]
  limitedLabels: string[]
  highlights: VoiceReportItem[]
  generatedAt: string
  roundDurationMs?: number
  fromCache?: boolean
}

function toVoiceSeverity(entry: PulseSummaryEntry): VoiceSeverity {
  if (entry.user_impact === "outage") return "outage"
  if (entry.user_impact === "limited") return "limited"
  return "ok"
}

export type BuildVoiceReportMeta = {
  roundDurationMs?: number
  fromCache?: boolean
}

export function buildVoiceReportFromEntries(
  entries: PulseSummaryEntry[],
  locale: Locale,
  meta?: BuildVoiceReportMeta,
): VoiceReport {
  const sorted = [...entries].sort((a, b) => {
    const d = severityRank(a) - severityRank(b)
    if (d !== 0) return d
    return label(a).localeCompare(label(b))
  })

  const outage = sorted.filter((e) => e.user_impact === "outage").length
  const limited = sorted.filter((e) => e.user_impact === "limited").length
  const ok = Math.max(0, sorted.length - outage - limited)

  const outageFetch = sorted.filter(
    (e) => e.user_impact === "outage" && e.error != null,
  )
  const outageSignal = sorted.filter(
    (e) => e.user_impact === "outage" && e.error == null,
  )
  const limitedEntries = sorted.filter((e) => e.user_impact === "limited")

  const highlights = sorted.slice(0, 5).map((e) => ({
    appId: e.appId,
    label: label(e),
    severity: toVoiceSeverity(e),
    userImpact: e.user_impact,
    hubFetchFailed: e.error != null,
  }))

  return {
    totalApps: sorted.length,
    locale,
    counts: { outage, limited, ok },
    outageFetchLabels: outageFetch.map(label),
    outageSignalLabels: outageSignal.map(label),
    limitedLabels: limitedEntries.map(label),
    highlights,
    generatedAt: new Date().toISOString(),
    roundDurationMs: meta?.roundDurationMs,
    fromCache: meta?.fromCache,
  }
}

const VOICE_BLOCK_SEP = "\n\n"

/**
 * Texto breve para TTS / fulfillment (reglas, sin LLM), generado desde `VoiceReport`.
 * Bloques separados por doble salto de línea (mejor lectura en Telegram).
 * Distingue fallos de lectura del Hub de indisponibilidad reportada por el backend.
 */
export function buildVoiceTextFromReport(report: VoiceReport): string {
  const {
    totalApps,
    counts,
    locale,
    outageFetchLabels,
    outageSignalLabels,
    limitedLabels,
    roundDurationMs,
    fromCache,
  } = report

  if (totalApps === 0) {
    return locale === "es"
      ? "No hay orígenes pulse configurados para este usuario."
      : "There are no pulse sources configured for this user."
  }

  const hasProblems = counts.outage > 0 || counts.limited > 0

  if (locale === "es") {
    const paragraphs: string[] = []

    paragraphs.push(
      `Pulse · ${totalApps} ${totalApps === 1 ? "aplicación" : "aplicaciones"} monitorizadas.`,
    )

    const detail: string[] = []

    if (outageFetchLabels.length > 0) {
      detail.push(
        `${joinLabels(outageFetchLabels, locale)} — sin lectura pulse válida del Hub en esta ronda (conectividad, credenciales o tiempo de espera). No implica por sí una caída del servicio; reintente en breve o consulte el panel.`,
      )
    } else if (counts.outage > 0 && outageSignalLabels.length === 0) {
      detail.push(
        `${counts.outage} aplicación(es) sin servicio según el agregador; revise el panel por origen.`,
      )
    }

    if (outageSignalLabels.length > 0) {
      detail.push(
        `Impacto severo según el último informe del backend: ${joinLabels(outageSignalLabels, locale)}.`,
      )
    }

    if (limitedLabels.length > 0) {
      detail.push(
        `Rendimiento degradado o impacto parcial: ${joinLabels(limitedLabels, locale)}.`,
      )
    } else if (counts.limited > 0) {
      detail.push(
        `${counts.limited} aplicación(es) con impacto parcial o rendimiento degradado.`,
      )
    }

    if (counts.ok > 0 && hasProblems) {
      detail.push("El resto aparece operativo o en arranque.")
    }

    if (!hasProblems) {
      detail.push("Sin incidencias destacadas: todo operativo o en arranque.")
    }

    if (detail.length > 0) {
      paragraphs.push(detail.join(" "))
    }

    const foot: string[] = []
    if (roundDurationMs != null) {
      foot.push(
        fromCache
          ? `Ronda ~${roundDurationMs} ms, desde caché del Hub. Para lectura en vivo, vuelva a preguntar en unos segundos.`
          : `Ronda ~${roundDurationMs} ms, con consulta en vivo a sus backends.`,
      )
    }
    foot.push(
      "Cada pregunta genera un informe nuevo; este mensaje no se actualiza solo en el chat.",
    )
    paragraphs.push(foot.join(" "))

    return paragraphs.join(VOICE_BLOCK_SEP)
  }

  const paragraphs: string[] = []

  paragraphs.push(
    `Pulse · ${totalApps} monitored app${totalApps === 1 ? "" : "s"}.`,
  )

  const detail: string[] = []

  if (outageFetchLabels.length > 0) {
    detail.push(
      `${joinLabels(outageFetchLabels, locale)} — no valid Hub pulse read this round (connectivity, credentials, or timeout). That does not, by itself, mean the product is down; retry shortly or check the dashboard.`,
    )
  } else if (counts.outage > 0 && outageSignalLabels.length === 0) {
    detail.push(
      `${counts.outage} app(s) flagged unavailable by the aggregator; open the dashboard for per-source detail.`,
    )
  }

  if (outageSignalLabels.length > 0) {
    detail.push(
      `Severe user impact per the latest backend pulse: ${joinLabels(outageSignalLabels, locale)}.`,
    )
  }

  if (limitedLabels.length > 0) {
    detail.push(
      `Degraded performance or partial impact: ${joinLabels(limitedLabels, locale)}.`,
    )
  } else if (counts.limited > 0) {
    detail.push(
      `${counts.limited} app(s) with partial impact or degraded performance.`,
    )
  }

  if (counts.ok > 0 && hasProblems) {
    detail.push("The rest appear operational or warming up.")
  }

  if (!hasProblems) {
    detail.push("No notable issues: all operational or warming up.")
  }

  if (detail.length > 0) {
    paragraphs.push(detail.join(" "))
  }

  const foot: string[] = []
  if (roundDurationMs != null) {
    foot.push(
      fromCache
        ? `Round ~${roundDurationMs} ms, Hub cache. Ask again in a few seconds to force a live read.`
        : `Round ~${roundDurationMs} ms, live read to your backends.`,
    )
  }
  foot.push(
    "Each question generates a new report; this chat message does not update on its own.",
  )
  paragraphs.push(foot.join(" "))

  return paragraphs.join(VOICE_BLOCK_SEP)
}

function joinLabels(labels: string[], locale: Locale): string {
  if (labels.length === 1) return labels[0]!
  if (locale === "es") {
    if (labels.length === 2) return `${labels[0]} y ${labels[1]}`
    return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`
  }
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`
}

export function buildVoiceSummaryFromEntries(
  entries: PulseSummaryEntry[],
  locale: Locale,
  meta?: BuildVoiceReportMeta,
): string {
  return buildVoiceTextFromReport(buildVoiceReportFromEntries(entries, locale, meta))
}

export function localeFromLanguageCode(languageCode: string): Locale {
  return languageCode.toLowerCase().startsWith("es") ? "es" : "en"
}
