import { describe, expect, it } from "vitest"
import { prepareVoiceTtsText, sanitizeTextForTts } from "@/lib/voice/tts-prepare"

describe("sanitizeTextForTts", () => {
  it("conserva párrafos y limpia dentro de cada bloque", () => {
    const raw = "Bloque uno.\n\nBloque dos."
    expect(sanitizeTextForTts(raw)).toBe("Bloque uno.\n\nBloque dos.")
  })
})

describe("prepareVoiceTtsText", () => {
  it("preserva párrafos tras sanitizar", () => {
    const { text } = prepareVoiceTtsText("A\n\nB", 500)
    expect(text).toBe("A\n\nB")
  })
})
