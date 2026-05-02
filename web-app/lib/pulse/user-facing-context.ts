import type { AppPulse } from "@/lib/types"

/**
 * Texto de “AI analysis” para la UI: prioriza mensajes localizados por `pulseFetchError.code`
 * y usa `ai_context` del backend cuando no hay código conocido.
 */
export function pulseUserFacingContext(
  app: Pick<AppPulse, "ai_context" | "pulseFetchError">,
  t: (path: string, vars?: Record<string, string | number | boolean>) => string,
): string {
  const code = app.pulseFetchError?.code
  if (code) {
    const key = `pulseErrors.${code}`
    const localized = t(key)
    if (localized !== key) {
      if (code === "http_error" && app.pulseFetchError?.message) {
        const m = /^HTTP (\d+)/.exec(app.pulseFetchError.message)
        if (m) {
          const detailKey = "pulseErrors.http_error_detail"
          const detail = t(detailKey, { status: m[1] })
          if (detail !== detailKey) return detail
        }
      }
      return localized
    }
  }
  const fromBackend = app.ai_context?.trim()
  if (fromBackend) return fromBackend
  return t("pulseErrors.unknown")
}
