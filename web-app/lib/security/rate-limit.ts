type RateLimitBucket = {
  count: number
  resetAt: number
}

type ConsumeRateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type ConsumeRateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

const buckets = new Map<string, RateLimitBucket>()

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  return "unknown"
}

export function consumeRateLimit({
  key,
  limit,
  windowMs,
}: ConsumeRateLimitOptions): ConsumeRateLimitResult {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return {
      ok: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    }
  }

  current.count += 1

  const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000)
  if (current.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfterSeconds) }
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.max(1, retryAfterSeconds),
  }
}
