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

/** TTL dedicado a la rama de voz (`voice:user:…`). Por defecto 45 s (Google / reintentos). 0 = sin caché de voz. */
export function getVoicePulseCacheTtlMs(): number {
  const n = Number(process.env.VOICE_PULSE_CACHE_TTL_MS)
  if (Number.isFinite(n) && n >= 0) return n
  return 45_000
}

/** Timeout de ronda agregador para voz (ms). Por defecto 9 s (margen bajo el límite típico del asistente). */
export function getVoicePulseRoundTimeoutMs(): number {
  const n = Number(process.env.VOICE_PULSE_ROUND_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : 9000
}

/** Timeout por backend en rondas disparadas por voz (ms). */
export function getVoicePulseFetchTimeoutMs(): number {
  const n = Number(process.env.VOICE_PULSE_FETCH_TIMEOUT_MS)
  return Number.isFinite(n) && n > 0 ? n : 4000
}

/**
 * Máximo de GET concurrentes a backends. 0 o ausente = sin límite (comportamiento anterior).
 */
export function getPulseMaxConcurrency(): number {
  const n = Number(process.env.PULSE_MAX_CONCURRENCY)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/** Secreto compartido entre Dialogflow (u otro cliente) y este despliegue. */
export function getVoiceWebhookSecret(): string {
  return (process.env.VOICE_WEBHOOK_SECRET ?? "").trim()
}

/**
 * Si está definida, el mismo `VOICE_WEBHOOK_SECRET` se acepta también en esta cabecera (p. ej. `x-monitoring-token`).
 */
export function getVoiceWebhookAltHeaderName(): string {
  return (process.env.VOICE_WEBHOOK_ALT_HEADER_NAME ?? "").trim()
}

/** Email del usuario cuyo portfolio lee la voz si no se envía cabecera `x-excelso-user-email`. */
export function getVoiceDefaultUserEmail(): string {
  return (process.env.VOICE_DEFAULT_USER_EMAIL ?? "").trim().toLowerCase()
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

/** Tope de caracteres del texto enviado a TTS (sanitización + truncado). ≤0 = sin límite. */
export function getVoiceTtsMaxChars(): number {
  const n = Number(process.env.VOICE_TTS_MAX_CHARS)
  if (!Number.isFinite(n)) return 720
  if (n <= 0) return 0
  return Math.floor(n)
}

/** Si es true, se fusionan fuentes de `PULSE_SOURCES` (solo despliegues single-tenant). */
export function mergeEnvPulseSources(): boolean {
  return process.env.PULSE_MERGE_ENV_SOURCES === "1" || process.env.PULSE_MERGE_ENV_SOURCES === "true"
}
