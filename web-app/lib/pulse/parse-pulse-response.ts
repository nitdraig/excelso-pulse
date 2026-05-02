export type ParsePulseBodyResult =
  | { ok: true; json: unknown }
  | { ok: false; reason: "empty" | "html" | "invalid_json" }

/**
 * Toma el primer objeto o array JSON balanceado desde la primera `{` o `[`,
 * ignorando llaves/corchetes dentro de strings (comillas dobles).
 */
export function extractFirstBalancedJson(trimmed: string): string | null {
  const start = trimmed.search(/[\[{]/)
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let p = start; p < trimmed.length; p++) {
    const c = trimmed[p]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (c === "\\") {
        escaped = true
        continue
      }
      if (c === '"') {
        inString = false
      }
      continue
    }

    if (c === '"') {
      inString = true
      continue
    }

    if (c === "{" || c === "[") {
      depth++
    } else if (c === "}" || c === "]") {
      depth--
      if (depth === 0) {
        return trimmed.slice(start, p + 1)
      }
    }
  }

  return null
}

function looksLikeHtmlDocument(trimmed: string): boolean {
  const head = trimmed.slice(0, 2048).toLowerCase()
  return (
    trimmed.startsWith("<") ||
    head.includes("<!doctype") ||
    head.includes("<html") ||
    head.includes("</html>")
  )
}

/**
 * Lee el cuerpo de `GET …/internal/pulse`: quita BOM/espacios, intenta JSON directo,
 * luego JSON incrustado (p. ej. `<pre>{…}</pre>` o plantillas HTML con payload),
 * y solo entonces clasifica como HTML o JSON inválido.
 */
export function parsePulseResponseBody(raw: string): ParsePulseBodyResult {
  const trimmed = raw.replace(/^\uFEFF/, "").trim()
  if (!trimmed) return { ok: false, reason: "empty" }

  const tryParse = (s: string): unknown | undefined => {
    try {
      return JSON.parse(s)
    } catch {
      return undefined
    }
  }

  const direct = tryParse(trimmed)
  if (direct !== undefined) return { ok: true, json: direct }

  const balanced = extractFirstBalancedJson(trimmed)
  if (balanced) {
    const loose = tryParse(balanced)
    if (loose !== undefined) return { ok: true, json: loose }
  }

  if (looksLikeHtmlDocument(trimmed)) return { ok: false, reason: "html" }
  return { ok: false, reason: "invalid_json" }
}
