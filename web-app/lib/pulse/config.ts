/** Timeout por petición a cada backend (ms). */
export function getPulseFetchTimeoutMs(): number {
  const n = Number(process.env.PULSE_FETCH_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : 5000
}

/** Tiempo máximo de espera de la ronda completa (ms); aborta peticiones en curso. */
export function getPulseRoundTimeoutMs(): number {
  const n = Number(process.env.PULSE_ROUND_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : 12000
}

/** TTL de caché en memoria del agregado (ms). 0 = desactivar. */
export function getPulseCacheTtlMs(): number {
  const n = Number(process.env.PULSE_CACHE_TTL_MS)
  return Number.isFinite(n) && n >= 0 ? n : 15_000
}

/** Límite de peticiones / ventana por usuario (lecturas pulse/portfolio). */
export function getPulseRateLimitMax(): number {
  const n = Number(process.env.PULSE_RATE_LIMIT_MAX)
  return Number.isFinite(n) && n > 0 ? n : 60
}

export function getPulseRateLimitWindowMs(): number {
  const n = Number(process.env.PULSE_RATE_LIMIT_WINDOW_MS)
  return Number.isFinite(n) && n > 0 ? n : 60_000
}

/** Si es true, se fusionan fuentes de `PULSE_SOURCES` (solo despliegues single-tenant). */
export function mergeEnvPulseSources(): boolean {
  return process.env.PULSE_MERGE_ENV_SOURCES === "1" || process.env.PULSE_MERGE_ENV_SOURCES === "true"
}
