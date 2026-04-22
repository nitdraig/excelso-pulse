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
  const ttl = getPulseCacheTtlMs()
  if (ttl === 0) return null
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
): void {
  const ttl = getPulseCacheTtlMs()
  if (ttl === 0) return
  store.set(userKey, {
    ...data,
    expiresAt: Date.now() + ttl,
  })
}

export function invalidatePulseCache(userKey: string): void {
  store.delete(userKey)
}
