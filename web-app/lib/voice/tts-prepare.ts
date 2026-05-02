function cleanParagraph(p: string): string {
  return p
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`[\]{}|]/g, " ")
    .replace(/<[a-z/][^>]*>/gi, " ")
    .replace(/_{2,}|\*{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Normaliza texto para lectura TTS y envío a canales (sin markdown ni ruido típico).
 * Conserva saltos de párrafo (`\\n\\n`) para una lectura más clara en Telegram / Dialogflow.
 */
export function sanitizeTextForTts(text: string): string {
  if (!text) return ""
  return text
    .split(/\n\s*\n/)
    .map(cleanParagraph)
    .filter((s) => s.length > 0)
    .join("\n\n")
}

/**
 * Corta respetando una frase completa si hay punto antes del tope; si no, última palabra.
 */
export function truncateForTts(text: string, maxChars: number): string {
  if (!text || maxChars <= 0) return text
  if (text.length <= maxChars) return text
  const slice = text.slice(0, maxChars + 1)
  const dot = slice.lastIndexOf(". ")
  const minKeep = Math.floor(maxChars * 0.5)
  if (dot >= minKeep) return `${slice.slice(0, dot + 1).trim()}…`
  const space = slice.lastIndexOf(" ")
  if (space >= minKeep) return `${slice.slice(0, space).trim()}…`
  return `${text.slice(0, Math.max(1, maxChars - 1)).trim()}…`
}

export function prepareVoiceTtsText(
  text: string,
  maxChars: number,
): { text: string; truncated: boolean } {
  const clean = sanitizeTextForTts(text)
  if (maxChars <= 0) return { text: clean, truncated: false }
  const truncated = clean.length > maxChars
  return { text: truncateForTts(clean, maxChars), truncated }
}
