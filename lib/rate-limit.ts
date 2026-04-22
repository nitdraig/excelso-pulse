type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now()
  let b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    b = { count: 1, resetAt: now + windowMs }
    buckets.set(key, b)
    return { ok: true }
  }
  if (b.count < max) {
    b.count += 1
    return { ok: true }
  }
  return { ok: false, retryAfterMs: Math.max(0, b.resetAt - now) }
}
