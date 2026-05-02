/**
 * Intervalo del auto-refresco del dashboard (solo cliente).
 * `NEXT_PUBLIC_DASHBOARD_AUTO_REFRESH_MS`: ms entre polls; `0` = desactivar.
 * Por defecto 30 s (respeta caché del agregador salvo `?refresh=1` en manual).
 */
export function getDashboardAutoRefreshMs(): number {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_AUTO_REFRESH_MS
  const n = raw === undefined || raw === "" ? 30_000 : Number(raw)
  if (!Number.isFinite(n) || n < 0) return 30_000
  if (n === 0) return 0
  return Math.min(Math.floor(n), 600_000)
}
