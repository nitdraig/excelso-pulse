import { defaultInfra, normalizeBackendPulse } from "@/lib/pulse/normalize"
import { parsePulseResponseBody } from "@/lib/pulse/parse-pulse-response"
import type { PulseFetchErrorCode, PulseSource, PulseSummaryEntry } from "@/lib/pulse/types"
import {
  getPulseFetchTimeoutMs,
  getPulseMaxConcurrency,
  getPulseRoundTimeoutMs,
} from "@/lib/pulse/config"

export type AggregatePulseOptions = {
  fetchTimeoutMs?: number
  roundTimeoutMs?: number
  /** 0 = ilimitado (mismo comportamiento que antes). */
  maxConcurrency?: number
}

const PRESENTATION_FETCH_FAILURE = {
  readiness: "ready" as const,
  user_impact: "outage" as const,
}

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

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return []
  const limit =
    concurrency > 0 && concurrency < items.length ? concurrency : items.length
  if (limit === items.length) {
    return Promise.all(items.map((item, i) => mapper(item, i)))
  }
  const results: R[] = new Array(items.length)
  const stack = items.map((item, i) => ({ item, i }))
  async function worker(): Promise<void> {
    while (stack.length > 0) {
      const job = stack.pop()
      if (!job) return
      results[job.i] = await mapper(job.item, job.i)
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()))
  return results
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
      ...PRESENTATION_FETCH_FAILURE,
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
      ai_context: "",
      logs: [
        {
          timestamp: fetchedAt,
          event: "Bearer secret not resolved for aggregator",
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
        ...PRESENTATION_FETCH_FAILURE,
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
        ai_context: "",
        logs: [
          {
            timestamp: fetchedAt,
            event: `Pulse HTTP ${res.status}`,
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
    const parsedBody = parsePulseResponseBody(text)
    if (!parsedBody.ok) {
      if (parsedBody.reason === "empty") {
        return {
          appId: source.appId,
          contract_version: "unknown",
          pulse_version: "?",
          status: "unavailable",
          ...PRESENTATION_FETCH_FAILURE,
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
          ai_context: "",
          logs: [
            {
              timestamp: fetchedAt,
              event: "Empty pulse response body",
              type: "warning",
            },
          ],
          last_updated: fetchedAt,
          fetchedAt,
          error: { code: "empty_body", message: "Empty response body" },
        }
      }
      if (parsedBody.reason === "html") {
        return {
          appId: source.appId,
          contract_version: "unknown",
          pulse_version: "?",
          status: "unavailable",
          ...PRESENTATION_FETCH_FAILURE,
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
          ai_context: "",
          logs: [
            {
              timestamp: fetchedAt,
              event: "HTML or non-JSON response from pulse URL",
              type: "error",
            },
          ],
          last_updated: fetchedAt,
          fetchedAt,
          error: {
            code: "html_response",
            message: "Response body looks like HTML, not JSON",
          },
        }
      }
      return {
        appId: source.appId,
        contract_version: "unknown",
        pulse_version: "?",
        status: "unavailable",
        ...PRESENTATION_FETCH_FAILURE,
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
        ai_context: "",
        logs: [
          {
            timestamp: fetchedAt,
            event: "Invalid JSON in pulse response",
            type: "error",
          },
        ],
        last_updated: fetchedAt,
        fetchedAt,
        error: { code: "invalid_json", message: "Response body is not valid JSON" },
      }
    }

    const { pulse, contract_version, validationError } = normalizeBackendPulse(
      parsedBody.json,
      source.appId,
    )
    return {
      appId: source.appId,
      contract_version,
      pulse_version: pulse.pulse_version,
      status: pulse.status,
      readiness: pulse.readiness,
      user_impact: pulse.user_impact,
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
      error: validationError,
    }
  } catch (e: unknown) {
    const name = e instanceof Error ? e.name : ""
    const msg = e instanceof Error ? e.message : "Network error"
    let code: PulseFetchErrorCode = "network"
    if (name === "AbortError") {
      code = perRequestSignal.aborted ? "aborted" : "timeout"
    }
    return {
      appId: source.appId,
      contract_version: "unknown",
      pulse_version: "?",
      status: "unavailable",
      ...PRESENTATION_FETCH_FAILURE,
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
      ai_context: "",
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
 * Lanza GET a cada origen (paralelismo acotado opcional); un fallo no tumba el resto del informe.
 */
export async function aggregatePulseSources(
  sources: PulseSource[],
  options?: AggregatePulseOptions,
): Promise<{ entries: PulseSummaryEntry[]; roundDurationMs: number }> {
  const t0 = performance.now()
  const perMs = options?.fetchTimeoutMs ?? getPulseFetchTimeoutMs()
  const roundMs = options?.roundTimeoutMs ?? getPulseRoundTimeoutMs()
  const maxConc = options?.maxConcurrency ?? getPulseMaxConcurrency()

  const roundController = new AbortController()
  const roundTimer = setTimeout(() => roundController.abort(), roundMs)

  try {
    const entries = await mapWithConcurrency(sources, maxConc, (source) => {
      const perController = new AbortController()
      const perTimer = setTimeout(() => perController.abort(), perMs)
      const signal = combineAbortSignals([perController.signal, roundController.signal])
      return fetchPulseSource(source, signal).finally(() => clearTimeout(perTimer))
    })
    return {
      entries,
      roundDurationMs: Math.round(performance.now() - t0),
    }
  } finally {
    clearTimeout(roundTimer)
  }
}
