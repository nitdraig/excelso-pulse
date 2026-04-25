import { createHash, randomBytes } from "crypto"

/** Token opaco en hex (64 chars) para el enlace; solo su hash se guarda en BD. */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("hex")
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}
