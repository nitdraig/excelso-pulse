import { getExcelsoOfficialSiteUrl, getPulseAppPublicUrl } from "@/lib/telegram/config"

/** Escapa comillas y ampersands para atributo href. */
function escapeHtmlAttr(url: string): string {
  return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
}

function productLineHtml(): string {
  const href = escapeHtmlAttr(getExcelsoOfficialSiteUrl())
  return `<b>Excelso Pulse</b> — a product by <a href="${href}">Excelso</a>.\n\n`
}

function usageBlockHtml(): string {
  return (
    `<b>Commands</b>\n` +
    `• <code>state</code> — portfolio report in English\n` +
    `• <code>estado</code> — informe en español\n` +
    `• <code>/unlink</code> — disconnect Telegram from Pulse\n\n`
  )
}

function linkStepsHtml(): string {
  const app = getPulseAppPublicUrl()
  const accountHref = escapeHtmlAttr(`${app}/account`)
  const appHref = escapeHtmlAttr(app)
  return (
    `<b>Link Pulse to Telegram</b>\n` +
    `• Open <a href="${accountHref}">Account → Telegram</a> on <a href="${appHref}">Pulse</a> and tap <b>Generate link</b>.\n` +
    `• Open that link here and tap <b>Start</b>.\n\n`
  )
}

/** Tras vincular: producto + pasos + uso + estado. */
export function telegramWelcomeLinkSuccessHtml(): string {
  return (
    productLineHtml() +
    linkStepsHtml() +
    usageBlockHtml() +
    `<b>Linked.</b> Send <code>state</code> or <code>estado</code> when you need your report.`
  )
}

/** /start sin token y aún sin vínculo. */
export function telegramWelcomeNeedLinkHtml(): string {
  return (
    productLineHtml() +
    linkStepsHtml() +
    usageBlockHtml() +
    `<b>Not linked yet.</b> Use the link step above first.`
  )
}

/** /start sin token y ya vinculado (sin repetir el flujo de enlace largo). */
export function telegramWelcomeAlreadyLinkedHtml(): string {
  return (
    productLineHtml() +
    usageBlockHtml() +
    `<b>Linked.</b> Send <code>state</code> or <code>estado</code> for your report.`
  )
}
