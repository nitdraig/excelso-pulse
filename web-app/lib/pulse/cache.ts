import { getPulseCacheTtlMs } from "@/lib/pulse/config"
import type { PulseSummaryEntry } from "@/lib/pulse/types"

type CacheRow = {
  entries: PulseSummaryEntry[]
  roundDurationMs: number
  fetchedAt: string
  expiresAt: number
}

const store = new Map<string, CacheRow>()

export function getCachedAggregate(userKey: string): CacheRow | null {
  const row = store.get(userKey)
  if (!row || row.expiresAt < Date.now()) {
    if (row) store.delete(userKey)
    return null
  }
  return row
}

export function setCachedAggregate(
  userKey: string,
  data: Omit<CacheRow, "expiresAt">,
  ttlMs?: number,
): void {
  const ttl = ttlMs ?? getPulseCacheTtlMs()
  if (ttl === 0) return
  store.set(userKey, {
    ...data,
    expiresAt: Date.now() + ttl,
  })
}

export function invalidatePulseCache(userKey: string): void {
  store.delete(userKey)
}

/** Invalida caché del agregador para la sesión web y la rama de voz. */
export function invalidatePulseCachesForUser(userId: string): void {
  store.delete(`user:${userId}`)
  store.delete(`voice:user:${userId}`)
}
