const ENV_KEY_SAFE = /^[A-Za-z_][A-Za-z0-9_]*$/

/**
 * Resuelve el Bearer desde el nombre de variable de entorno (nunca el valor en BD).
 */
export function resolveBearerFromEnv(secretEnvKey: string): string | null {
  const key = secretEnvKey.trim()
  if (!key || !ENV_KEY_SAFE.test(key)) return null
  const v = process.env[key]
  if (!v || v.length === 0) return null
  return v
}
