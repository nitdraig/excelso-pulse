export type TelegramUiLang = "es" | "en"

export function telegramUiLang(languageCode?: string): TelegramUiLang {
  return languageCode?.toLowerCase().startsWith("es") ? "es" : "en"
}

const COPY: Record<
  TelegramUiLang,
  Record<
    | "linkInvalid"
    | "linkSaveFailed"
    | "linkTelegramTaken"
    | "linkSuccess"
    | "startAlreadyLinked"
    | "startNeedLink"
    | "unlinkDone"
    | "unlinkNone"
    | "portfolioNotLinked"
    | "portfolioError"
    | "rateLimited",
    string
  >
> = {
  es: {
    linkInvalid: "El enlace no es válido o ya se usó. Genera uno nuevo en Cuenta → Telegram.",
    linkSaveFailed:
      "No se pudo completar el vínculo. Inténtalo de nuevo o genera otro enlace desde el panel.",
    linkTelegramTaken:
      "Esta cuenta de Telegram ya está vinculada a otro usuario de Pulse. Desvincula desde la otra cuenta o contacta soporte.",
    linkSuccess:
      "Listo: tu Telegram quedó vinculado a tu cuenta Pulse. Escribe /estado o cualquier mensaje para ver el informe. /desvincular para revocar.",
    startAlreadyLinked:
      "Ya tienes Telegram vinculado a Pulse. Envía /estado para el resumen o /desvincular para desconectar.",
    startNeedLink:
      "Aún no hay vínculo. Inicia sesión en el panel web → Cuenta → Telegram y pulsa «Generar enlace».",
    unlinkDone: "He quitado el vínculo entre Telegram y Pulse. Puedes generar un enlace nuevo cuando quieras.",
    unlinkNone: "No había ningún vínculo activo para esta cuenta de Telegram.",
    portfolioNotLinked:
      "Tu Telegram no está vinculado a Pulse. Abre el panel (Cuenta → Telegram) y genera el enlace de emparejamiento.",
    portfolioError:
      "No pude generar el informe ahora. Inténtalo de nuevo en unos segundos o revisa el panel web.",
    rateLimited: "Demasiados mensajes seguidos. Espera un minuto y vuelve a intentarlo.",
  },
  en: {
    linkInvalid: "This link is invalid or already used. Create a new one under Account → Telegram.",
    linkSaveFailed:
      "Could not complete the link. Try again or generate a new link from the web app.",
    linkTelegramTaken:
      "This Telegram account is already linked to another Pulse user. Unlink from the other account or contact support.",
    linkSuccess:
      "Done: Telegram is linked to your Pulse account. Send /status or any message for the report. /unlink to revoke.",
    startAlreadyLinked:
      "Telegram is already linked to Pulse. Send /status for the summary or /unlink to disconnect.",
    startNeedLink:
      "No link yet. Sign in on the web app → Account → Telegram and tap “Generate link”.",
    unlinkDone: "Telegram and Pulse are no longer linked. You can generate a new link anytime.",
    unlinkNone: "There was no active Telegram link for this account.",
    portfolioNotLinked:
      "Your Telegram is not linked to Pulse. Open the web app (Account → Telegram) and generate the pairing link.",
    portfolioError: "Could not build the report right now. Retry shortly or check the web dashboard.",
    rateLimited: "Too many messages in a short window. Please wait a minute and try again.",
  },
}

export function tg(lang: TelegramUiLang, key: keyof (typeof COPY)["es"]): string {
  return COPY[lang][key]
}
