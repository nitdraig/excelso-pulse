import crypto from "crypto"

export function createVoiceUserToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/** Payload para `t.me/bot?start=…`. Debe quedar claramente por debajo del límite de 64 caracteres de Telegram. */
export function createTelegramStartPayload(): string {
  return crypto.randomBytes(18).toString("hex")
}

export function hashVoiceToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex")
}

export function extractVoiceTokenFromRequest(
  request: Request,
  alternateHeaderName?: string,
): string | null {
  const auth = request.headers.get("authorization")
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const t = auth.slice(7).trim()
    if (t) return t
  }

  const alt = alternateHeaderName?.trim()
  if (alt) {
    const v = request.headers.get(alt)?.trim()
    if (v) return v
  }
  return null
}
