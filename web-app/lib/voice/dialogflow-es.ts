/**
 * Dialogflow ES (V1/V2 API) — forma mínima del cuerpo entrante y respuesta de fulfillment.
 * @see https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook
 */

export type DialogflowEsWebhookParsed = {
  queryText: string
  languageCode: string
}

export function parseDialogflowEsWebhookBody(
  body: unknown,
): DialogflowEsWebhookParsed | null {
  if (!body || typeof body !== "object") return null
  const qr = (body as { queryResult?: unknown }).queryResult
  if (!qr || typeof qr !== "object") return null
  const q = qr as { queryText?: string; languageCode?: string }
  return {
    queryText: typeof q.queryText === "string" ? q.queryText : "",
    languageCode:
      typeof q.languageCode === "string" && q.languageCode.length > 0
        ? q.languageCode
        : "es",
  }
}

export function buildDialogflowEsFulfillmentResponse(fulfillmentText: string): {
  fulfillmentText: string
  fulfillmentMessages: { text: { text: string[] } }[]
  source: string
} {
  return {
    fulfillmentText,
    fulfillmentMessages: [{ text: { text: [fulfillmentText] } }],
    source: "excelso-pulse",
  }
}
