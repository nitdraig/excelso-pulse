import { describe, expect, it } from "vitest"
import {
  extractTelegramMessage,
  reportCommandLang,
} from "@/lib/telegram/process-update"

describe("extractTelegramMessage", () => {
  it("extrae texto y ids de un update estándar", () => {
    const m = extractTelegramMessage({
      update_id: 1,
      message: {
        message_id: 2,
        chat: { id: 99, type: "private" },
        from: { id: 42, is_bot: false, language_code: "es" },
        text: "/start abc123",
      },
    })
    expect(m).toEqual({
      chatId: 99,
      telegramUserId: 42,
      text: "/start abc123",
      languageCode: "es",
    })
  })

  it("extrae business_message (Telegram Business)", () => {
    const m = extractTelegramMessage({
      update_id: 9,
      business_message: {
        message_id: 3,
        chat: { id: 100, type: "private" },
        from: { id: 50, language_code: "en" },
        text: "hola",
      },
    })
    expect(m).toEqual({
      chatId: 100,
      telegramUserId: 50,
      text: "hola",
      languageCode: "en",
    })
  })

  it("reportCommandLang: state en inglés, estado en español", () => {
    expect(reportCommandLang("state")).toBe("en")
    expect(reportCommandLang("STATE")).toBe("en")
    expect(reportCommandLang(" /state ")).toBe("en")
    expect(reportCommandLang("estado")).toBe("es")
    expect(reportCommandLang("/estado")).toBe("es")
    expect(reportCommandLang("hola")).toBeNull()
    expect(reportCommandLang("estado extra")).toBeNull()
  })

  it("devuelve null sin texto", () => {
    expect(
      extractTelegramMessage({
        update_id: 1,
        message: {
          message_id: 2,
          chat: { id: 1 },
          from: { id: 2 },
        },
      }),
    ).toBeNull()
  })
})
