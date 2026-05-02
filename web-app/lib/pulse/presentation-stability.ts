import type { PulseSummaryEntry } from "@/lib/pulse/types"

/** Fallos consecutivos “graves” antes de mostrar outage / unavailable tal cual. */
const SEVERE_CONFIRM_POLLS = 2
/** Lecturas consecutivas en `starting` antes de mostrarlo (evita parpadeo). */
const STARTING_CONFIRM_POLLS = 2

type RowState = {
  failStreak: number
  startingStreak: number
  lastOk: PulseSummaryEntry | null
}

const stateByKey = new Map<string, RowState>()

function rowKey(scope: string, appId: string): string {
  return `${scope}:${appId}`
}

function cloneSnapshot(e: PulseSummaryEntry): PulseSummaryEntry {
  return {
    ...e,
    metrics: { ...e.metrics },
    infrastructure: { ...e.infrastructure },
    kpis: e.kpis.map((k) => ({ ...k })),
    logs: e.logs.map((l) => ({ ...l })),
  }
}

function isFullyHealthy(e: PulseSummaryEntry): boolean {
  return (
    !e.error &&
    e.status === "operational" &&
    e.readiness === "ready" &&
    e.user_impact === "none"
  )
}

function isSevere(e: PulseSummaryEntry): boolean {
  return (
    !!e.error ||
    e.status === "unavailable" ||
    e.status === "down" ||
    e.user_impact === "outage"
  )
}

function softenSevere(
  raw: PulseSummaryEntry,
  lastOk: PulseSummaryEntry,
): PulseSummaryEntry {
  const base = cloneSnapshot(lastOk)
  return {
    ...base,
    fetchedAt: raw.fetchedAt,
    error: raw.error,
    logs: raw.logs.map((l) => ({ ...l })),
    readiness: "ready",
    user_impact: "limited",
    status: "degraded",
  }
}

function stabilizeOne(
  entry: PulseSummaryEntry,
  key: string,
): PulseSummaryEntry {
  let st = stateByKey.get(key)
  if (!st) {
    st = { failStreak: 0, startingStreak: 0, lastOk: null }
    stateByKey.set(key, st)
  }

  if (isFullyHealthy(entry)) {
    st.failStreak = 0
    st.startingStreak = 0
    st.lastOk = cloneSnapshot(entry)
    return entry
  }

  let out: PulseSummaryEntry = { ...entry, metrics: { ...entry.metrics } }

  if (isSevere(entry)) {
    st.failStreak += 1
    if (
      st.failStreak < SEVERE_CONFIRM_POLLS &&
      st.lastOk != null &&
      entry.appId === st.lastOk.appId
    ) {
      out = softenSevere(entry, st.lastOk)
    }
  } else {
    st.failStreak = 0
  }

  if (
    out.readiness === "starting" &&
    out.user_impact === "none" &&
    (out.status === "operational" || out.status === "degraded")
  ) {
    st.startingStreak += 1
    if (st.startingStreak < STARTING_CONFIRM_POLLS) {
      out = { ...out, readiness: "ready" }
    }
  } else {
    st.startingStreak = 0
  }

  return out
}

/**
 * Suaviza presentación entre rondas reales del agregador: un solo fallo grave no pasa
 * directo a outage; “starting” breve no se muestra hasta confirmar en varias lecturas.
 * No aplicar sobre datos servidos desde caché (sin nueva ronda), para no inflar rachas.
 */
export function applyPresentationStability(
  entries: PulseSummaryEntry[],
  scope: string,
): PulseSummaryEntry[] {
  const active = new Set(entries.map((e) => e.appId))
  const out = entries.map((e) => stabilizeOne(e, rowKey(scope, e.appId)))

  const prefix = `${scope}:`
  for (const k of [...stateByKey.keys()]) {
    if (!k.startsWith(prefix)) continue
    const appId = k.slice(prefix.length)
    if (!active.has(appId)) stateByKey.delete(k)
  }

  return out
}
