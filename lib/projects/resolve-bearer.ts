import { decryptBearerSecret } from "@/lib/crypto/bearer-at-rest"
import { resolveBearerFromEnv } from "@/lib/pulse/resolve-secret"

type BearerFields = {
  bearerEnc?: string | null
  secretEnvKey?: string | null
}

/** Resuelve el Bearer: primero token cifrado en BD, si no, variable de entorno (legado). */
export function getBearerForProject(p: BearerFields): string | null {
  const enc = p.bearerEnc?.trim()
  if (enc) {
    const plain = decryptBearerSecret(enc)
    if (plain) return plain
  }
  const envKey = p.secretEnvKey?.trim()
  if (envKey) return resolveBearerFromEnv(envKey)
  return null
}
