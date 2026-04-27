import crypto from "crypto"
import {
  getVoiceWebhookAltHeaderName,
  getVoiceWebhookSecret,
} from "@/lib/pulse/config"

function timingSafeEqualString(provided: string, expected: string): boolean {
  const a = crypto.createHash("sha256").update(provided, "utf8").digest()
  const b = crypto.createHash("sha256").update(expected, "utf8").digest()
  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** True si el webhook trae el mismo secreto que `VOICE_WEBHOOK_SECRET` (Bearer y/o cabecera alternativa). */
export function voiceWebhookAuthOk(request: Request): boolean {
  const secret = getVoiceWebhookSecret()
  if (!secret.length) return false

  const auth = request.headers.get("authorization")
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const t = auth.slice(7).trim()
    if (t.length && timingSafeEqualString(t, secret)) return true
  }

  const alt = getVoiceWebhookAltHeaderName()
  if (alt.length) {
    const v = request.headers.get(alt)?.trim()
    if (v?.length && timingSafeEqualString(v, secret)) return true
  }

  return false
}
