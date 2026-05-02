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

/**
 * Texto breve para TTS / fulfillment (reglas, sin LLM), generado desde `VoiceReport`.
 * Distingue fallos de lectura del Hub de indisponibilidad reportada por el backend;
 * aclara caché y que cada pregunta obtiene un informe nuevo (p. ej. Telegram / Dialogflow).
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
    const parts: string[] = []
    parts.push(
      `Estado pulse consolidado: ${totalApps} ${totalApps === 1 ? "aplicación" : "aplicaciones"} registradas en esta consulta.`,
    )

    if (outageFetchLabels.length > 0) {
      parts.push(
        `Para ${joinLabels(outageFetchLabels, locale)}, en esta consulta el Hub no obtuvo una lectura pulse válida (red, credenciales o tiempo de espera). Eso no equivale por sí solo a que el servicio esté caído; conviene repetir la pregunta en breve o revisar el panel web.`,
      )
    } else if (counts.outage > 0 && outageSignalLabels.length === 0) {
      parts.push(
        `Hay ${counts.outage} aplicación(es) marcadas sin servicio; revise el panel para el detalle por origen.`,
      )
    }

    if (outageSignalLabels.length > 0) {
      parts.push(
        `Según el último informe enviado por el backend, con impacto severo para usuarios: ${joinLabels(outageSignalLabels, locale)}.`,
      )
    }

    if (limitedLabels.length > 0) {
      parts.push(
        `Con impacto parcial o rendimiento degradado: ${joinLabels(limitedLabels, locale)}.`,
      )
    } else if (counts.limited > 0) {
      parts.push(
        `Hay ${counts.limited} aplicación(es) con impacto parcial o rendimiento degradado.`,
      )
    }

    if (counts.ok > 0 && hasProblems) {
      parts.push(
        "Las demás figuran operativas o en fase de arranque, según los datos recibidos.",
      )
    }
    if (!hasProblems) {
      parts.push(
        "Todas las aplicaciones consultadas figuran operativas o en arranque, según los datos recibidos.",
      )
    }

    if (roundDurationMs != null) {
      parts.push(
        fromCache
          ? `Agregación completada en unos ${roundDurationMs} milisegundos. Datos servidos desde caché del Hub: si acaba de recuperarse un servicio, formule la pregunta otra vez en unos segundos para forzar una lectura en vivo.`
          : `Agregación completada en unos ${roundDurationMs} milisegundos, con lectura en vivo a los backends.`,
      )
    }

    parts.push(
      "Cada pregunta al asistente genera un informe nuevo; el mensaje en el chat no se actualiza solo.",
    )

    return parts.join(" ")
  }

  const parts: string[] = []
  parts.push(
    `Pulse status for your account: ${totalApps} registered app${totalApps === 1 ? "" : "s"} in this snapshot.`,
  )

  if (outageFetchLabels.length > 0) {
    parts.push(
      `For ${joinLabels(outageFetchLabels, locale)}, this round the Hub could not obtain a valid pulse read (network, credentials, or timeout). That alone does not prove the product is down; retry shortly or check the web dashboard.`,
    )
  } else if (counts.outage > 0 && outageSignalLabels.length === 0) {
    parts.push(
      `${counts.outage} app(s) are flagged as unavailable; open the dashboard for per-source detail.`,
    )
  }

  if (outageSignalLabels.length > 0) {
    parts.push(
      `According to the latest backend pulse payload, severe user impact for: ${joinLabels(outageSignalLabels)}.`,
    )
  }

  if (limitedLabels.length > 0) {
    parts.push(`Limited performance or partial impact: ${joinLabels(limitedLabels)}.`)
  } else if (counts.limited > 0) {
    parts.push(
      `${counts.limited} app(s) show limited performance or partial user impact.`,
    )
  }

  if (counts.ok > 0 && hasProblems) {
    parts.push("The remaining apps appear operational or warming up from the data we received.")
  }
  if (!hasProblems) {
    parts.push("All checked apps appear operational or warming up.")
  }

  if (roundDurationMs != null) {
    parts.push(
      fromCache
        ? `Aggregation finished in about ${roundDurationMs} milliseconds. Data was served from the Hub cache: if production just recovered, ask again in a few seconds to force a live read.`
        : `Aggregation finished in about ${roundDurationMs} milliseconds with a live read to your backends.`,
    )
  }

  parts.push(
    "Each assistant question fetches a new report; the chat message does not update by itself.",
  )

  return parts.join(" ")
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
