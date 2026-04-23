import { defaultInfra, normalizeBackendPulse } from "@/lib/pulse/normalize"
import type { PulseFetchErrorCode, PulseSource, PulseSummaryEntry } from "@/lib/pulse/types"
import {
  getPulseFetchTimeoutMs,
  getPulseRoundTimeoutMs,
} from "@/lib/pulse/config"

function combineAbortSignals(signals: AbortSignal[]): AbortSignal {
  const c = new AbortController()
  const forward = () => {
    if (!c.signal.aborted) c.abort()
  }
  for (const s of signals) {
    if (s.aborted) {
      forward()
      break
    }
    s.addEventListener("abort", forward, { once: true })
  }
  return c.signal
}

async function fetchPulseSource(
  source: PulseSource,
  perRequestSignal: AbortSignal,
): Promise<PulseSummaryEntry> {
  const fetchedAt = new Date().toISOString()

  if (!source.bearerToken) {
    return {
      appId: source.appId,
      contract_version: "unknown",
      pulse_version: "?",
      status: "unavailable",
      name: source.appId,
      description: "",
      icon: "📦",
      metrics: {
        latency_ms: 0,
        uptime_percent: 0,
        requests_24h: 0,
        error_rate: 0,
      },
      kpis: [],
      infrastructure: defaultInfra(),
      ai_context: "Falta el token en el servidor: define la variable de entorno indicada en el registro del origen.",
      logs: [
        {
          timestamp: fetchedAt,
          event: "Secreto no configurado en el agregador",
          type: "warning",
        },
      ],
      last_updated: fetchedAt,
      fetchedAt,
      error: { code: "missing_secret", message: "Bearer no resuelto desde env" },
    }
  }

  try {
    const res = await fetch(source.pulseUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${source.bearerToken}`,
        Accept: "application/json",
      },
      signal: perRequestSignal,
      cache: "no-store",
    })

    if (!res.ok) {
      return {
        appId: source.appId,
        contract_version: "unknown",
        pulse_version: "?",
        status: "unavailable",
        name: source.appId,
        description: "",
        icon: "📦",
        metrics: {
          latency_ms: 0,
          uptime_percent: 0,
          requests_24h: 0,
          error_rate: 0,
        },
        kpis: [],
        infrastructure: defaultInfra(),
        ai_context: `El backend respondió HTTP ${res.status}.`,
        logs: [
          {
            timestamp: fetchedAt,
            event: `HTTP ${res.status} en pulse`,
            type: "error",
          },
        ],
        last_updated: fetchedAt,
        fetchedAt,
        error: {
          code: "http_error",
          message: `HTTP ${res.status}`,
        },
      }
    }

    const text = await res.text()
    if (!text.trim()) {
      return {
        appId: source.appId,
        contract_version: "unknown",
        pulse_version: "?",
        status: "unavailable",
        name: source.appId,
        description: "",
        icon: "📦",
        metrics: {
          latency_ms: 0,
          uptime_percent: 0,
          requests_24h: 0,
          error_rate: 0,
        },
        kpis: [],
        infrastructure: defaultInfra(),
        ai_context: "Respuesta vacía del endpoint pulse.",
        logs: [
          {
            timestamp: fetchedAt,
            event: "Cuerpo vacío",
            type: "warning",
          },
        ],
        last_updated: fetchedAt,
        fetchedAt,
        error: { code: "empty_body", message: "Sin cuerpo" },
      }
    }

    let json: unknown
    try {
      json = JSON.parse(text) as unknown
    } catch {
      return {
        appId: source.appId,
        contract_version: "unknown",
        pulse_version: "?",
        status: "unavailable",
        name: source.appId,
        description: "",
        icon: "📦",
        metrics: {
          latency_ms: 0,
          uptime_percent: 0,
          requests_24h: 0,
          error_rate: 0,
        },
        kpis: [],
        infrastructure: defaultInfra(),
        ai_context: "JSON inválido en la respuesta pulse.",
        logs: [
          {
            timestamp: fetchedAt,
            event: "JSON inválido",
            type: "error",
          },
        ],
        last_updated: fetchedAt,
        fetchedAt,
        error: { code: "invalid_json", message: "JSON inválido" },
      }
    }

    const { pulse, contract_version } = normalizeBackendPulse(json, source.appId)
    return {
      appId: source.appId,
      contract_version,
      pulse_version: pulse.pulse_version,
      status: pulse.status,
      name: pulse.name,
      description: pulse.description,
      icon: pulse.icon,
      metrics: pulse.metrics,
      kpis: pulse.kpis,
      infrastructure: pulse.infrastructure,
      ai_context: pulse.ai_context,
      logs: pulse.logs,
      last_updated: pulse.last_updated,
      fetchedAt,
    }
  } catch (e: unknown) {
    const name = e instanceof Error ? e.name : ""
    const msg = e instanceof Error ? e.message : "Error de red"
    let code: PulseFetchErrorCode = "network"
    if (name === "AbortError") {
      code = perRequestSignal.aborted ? "aborted" : "timeout"
    }
    return {
      appId: source.appId,
      contract_version: "unknown",
      pulse_version: "?",
      status: "unavailable",
      name: source.appId,
      description: "",
      icon: "📦",
      metrics: {
        latency_ms: 0,
        uptime_percent: 0,
        requests_24h: 0,
        error_rate: 0,
      },
      kpis: [],
      infrastructure: defaultInfra(),
      ai_context: `No se pudo obtener pulse: ${msg}`,
      logs: [
        {
          timestamp: fetchedAt,
          event: msg,
          type: "error",
        },
      ],
      last_updated: fetchedAt,
      fetchedAt,
      error: { code, message: msg },
    }
  }
}

/**
 * Lanza GET paralelos a cada origen; un fallo no tumba el resto del informe.
 */
export async function aggregatePulseSources(
  sources: PulseSource[],
): Promise<{ entries: PulseSummaryEntry[]; roundDurationMs: number }> {
  const t0 = performance.now()
  const perMs = getPulseFetchTimeoutMs()
  const roundMs = getPulseRoundTimeoutMs()

  const roundController = new AbortController()
  const roundTimer = setTimeout(() => roundController.abort(), roundMs)

  const tasks = sources.map((source) => {
    const perController = new AbortController()
    const perTimer = setTimeout(() => perController.abort(), perMs)
    const signal = combineAbortSignals([perController.signal, roundController.signal])
    return fetchPulseSource(source, signal).finally(() => clearTimeout(perTimer))
  })

  try {
    const entries = await Promise.all(tasks)
    return {
      entries,
      roundDurationMs: Math.round(performance.now() - t0),
    }
  } finally {
    clearTimeout(roundTimer)
  }
}
