export type ParsePulseBodyResult =
  | { ok: true; json: unknown }
  | { ok: false; reason: "empty" | "html" | "invalid_json" }

/**
 * Lee el cuerpo de `GET …/internal/pulse`: quita BOM/espacios, detecta HTML típico de proxy/404 y parsea JSON.
 */
export function parsePulseResponseBody(raw: string): ParsePulseBodyResult {
  const trimmed = raw.replace(/^\uFEFF/, "").trim()
  if (!trimmed) return { ok: false, reason: "empty" }
  const head = trimmed.slice(0, 2048).toLowerCase()
  if (
    trimmed.startsWith("<") ||
    head.includes("<!doctype") ||
    head.includes("<html") ||
    head.includes("</html>")
  ) {
    return { ok: false, reason: "html" }
  }
  try {
    return { ok: true, json: JSON.parse(trimmed) }
  } catch {
    return { ok: false, reason: "invalid_json" }
  }
}
