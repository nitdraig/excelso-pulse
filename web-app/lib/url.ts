/**
 * Si la cadena no está vacía y no tiene esquema http(s), antepone `https://`.
 * Respeta `http://`, `https://` (cualquier capitalización) y URLs protocol-relative `//…`.
 */
export function ensureHttpsUrl(input: string): string {
  const t = input.trim()
  if (!t) return t
  const lower = t.toLowerCase()
  if (lower.startsWith("http://") || lower.startsWith("https://")) return t
  if (lower.startsWith("//")) return `https:${t}`
  return `https://${t}`
}
