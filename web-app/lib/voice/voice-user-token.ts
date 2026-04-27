import crypto from "crypto"

export function createVoiceUserToken(): string {
  return crypto.randomBytes(32).toString("hex")
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
