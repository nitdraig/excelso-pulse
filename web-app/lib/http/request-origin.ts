/** Origen público para enlaces en emails (AUTH_URL / NEXTAUTH_URL o cabeceras del proxy). */
export function getRequestOrigin(req: Request): string {
  const explicit = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim()
  if (explicit?.startsWith("http")) {
    return explicit.replace(/\/$/, "")
  }
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0]?.trim()
  if (!host) {
    return new URL(req.url).origin.replace(/\/$/, "")
  }

  const local = host.startsWith("localhost") || host.startsWith("127.") || host === "[::1]"
  const rawProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  /** En local forzamos http para que el enlace del email coincida con `next dev`. */
  const proto = local ? "http" : rawProto || "https"

  return `${proto}://${host}`.replace(/\/$/, "")
}
