import { describe, expect, it } from "vitest"
import {
  telegramWelcomeAlreadyLinkedHtml,
  telegramWelcomeLinkSuccessHtml,
  telegramWelcomeNeedLinkHtml,
} from "@/lib/telegram/welcome-html"

describe("welcome-html", () => {
  it("incluye marca, enlace Excelso y anclas Pulse", () => {
    const h = telegramWelcomeNeedLinkHtml()
    expect(h).toContain("Excelso Pulse")
    expect(h).toContain("<a href=\"https://excelso.xyz\">Excelso</a>")
    expect(h).toContain("pulse.excelso.xyz")
    expect(h).toContain("<code>state</code>")
    expect(h).toContain("<code>estado</code>")
    expect(h.length).toBeLessThan(4000)
  })

  it("tres variantes no vacías", () => {
    expect(telegramWelcomeLinkSuccessHtml().length).toBeGreaterThan(50)
    expect(telegramWelcomeAlreadyLinkedHtml().length).toBeGreaterThan(50)
    expect(telegramWelcomeNeedLinkHtml().length).toBeGreaterThan(50)
  })
})
