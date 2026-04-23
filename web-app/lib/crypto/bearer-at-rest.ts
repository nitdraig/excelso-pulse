import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGO = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function readMasterKey(): Buffer | null {
  const hex = process.env.PULSE_SECRETS_MASTER_KEY?.trim()
  if (!hex || hex.length !== 64) return null
  try {
    return Buffer.from(hex, "hex")
  } catch {
    return null
  }
}

/**
 * Cifra el Bearer para guardarlo en MongoDB (solo servidor).
 * Requiere `PULSE_SECRETS_MASTER_KEY` = 64 caracteres hex (32 bytes). Ej.: `openssl rand -hex 32`
 */
export function encryptBearerSecret(plaintext: string): string {
  const key = readMasterKey()
  if (!key) {
    throw new Error(
      "Falta PULSE_SECRETS_MASTER_KEY (64 caracteres hex, 32 bytes). Genera una con: openssl rand -hex 32",
    )
  }
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64")
}

/** Descifra el token guardado; devuelve null si falta clave, datos corruptos o contraseña incorrecta. */
export function decryptBearerSecret(blob: string): string | null {
  const key = readMasterKey()
  if (!key) return null
  try {
    const buf = Buffer.from(blob, "base64")
    if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) return null
    const iv = buf.subarray(0, IV_LENGTH)
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const data = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
    const decipher = createDecipheriv(ALGO, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

export function isPulseSecretsMasterKeyConfigured(): boolean {
  return readMasterKey() !== null
}
