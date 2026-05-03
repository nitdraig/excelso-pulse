import { describe, expect, it } from "vitest"
import { extractTelegramMessage } from "@/lib/telegram/process-update"

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
