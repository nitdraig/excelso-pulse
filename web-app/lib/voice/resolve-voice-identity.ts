import type { Types } from "mongoose"
import { connectDB } from "@/lib/db/connect"
import { UserModel, VoiceIntegrationModel } from "@/lib/db/models"
import { getVoiceDefaultUserEmail, getVoiceWebhookSecret } from "@/lib/pulse/config"
import { extractVoiceTokenFromRequest, hashVoiceToken } from "@/lib/voice/voice-user-token"
import { timingSafeEqualString } from "@/lib/voice/validate-voice-webhook-auth"

const USER_EMAIL_HEADER = "x-excelso-user-email"

export type ResolveVoiceIdentityResult =
  | {
      ok: true
      userId: string
      /** `_id` de `VoiceIntegration` cuando el token multiusuario coincidió; para `lastUsedAt`. */
      voiceIntegrationId?: Types.ObjectId
    }
  | { ok: false; code: "missing_token" }
  | { ok: false; code: "unauthorized" }
  | {
      ok: false
      code: "legacy_missing_target"
      message: { es: string; en: string }
    }
  | {
      ok: false
      code: "legacy_unknown_user"
      message: { es: string; en: string }
    }

/**
 * Resuelve el usuario cuyo portfolio debe agregarse (token por usuario o fallback legacy).
 * Debe llamarse tras validar el cuerpo específico del canal (p. ej. Dialogflow) si aplica.
 */
export async function resolveVoiceIdentity(
  request: Request,
  alternateHeaderName: string,
): Promise<ResolveVoiceIdentityResult> {
  const secret = getVoiceWebhookSecret()
  const token = extractVoiceTokenFromRequest(request, alternateHeaderName)
  if (!token) return { ok: false, code: "missing_token" }

  await connectDB()

  const voiceRow = await VoiceIntegrationModel.findOne({
    tokenHash: hashVoiceToken(token),
    active: true,
  })
    .select("_id ownerId")
    .lean()

  let userId = voiceRow?.ownerId ? String(voiceRow.ownerId) : ""

  if (!userId && secret.length && timingSafeEqualString(token, secret)) {
    const headerEmail =
      request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase() ?? ""
    const defaultEmail = getVoiceDefaultUserEmail()
    const targetEmail = headerEmail || defaultEmail

    if (!targetEmail) {
      return {
        ok: false,
        code: "legacy_missing_target",
        message: {
          es: "Configura VOICE_DEFAULT_USER_EMAIL en el servidor o envía la cabecera x-excelso-user-email.",
          en: "Set VOICE_DEFAULT_USER_EMAIL on the server or send the x-excelso-user-email header.",
        },
      }
    }
    const user = await UserModel.findOne({ email: targetEmail })
      .select("_id")
      .lean()
    if (!user?._id) {
      return {
        ok: false,
        code: "legacy_unknown_user",
        message: {
          es: "No encontré un usuario con ese correo en esta instancia.",
          en: "No user found with that email on this instance.",
        },
      }
    }
    userId = String(user._id)
  }

  if (!userId) return { ok: false, code: "unauthorized" }

  const voiceIntegrationId =
    voiceRow?.ownerId && voiceRow._id ? (voiceRow._id as Types.ObjectId) : undefined

  return { ok: true, userId, voiceIntegrationId }
}
