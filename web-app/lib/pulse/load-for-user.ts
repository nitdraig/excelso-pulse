import mongoose from "mongoose"
import { connectDB } from "@/lib/db/connect"
import { ProjectModel } from "@/lib/db/models"
import { aggregatePulseSources } from "@/lib/pulse/aggregate"
import { getCachedAggregate, setCachedAggregate } from "@/lib/pulse/cache"
import {
  getPulseMaxConcurrency,
  getVoicePulseCacheTtlMs,
  getVoicePulseFetchTimeoutMs,
  getVoicePulseRoundTimeoutMs,
  mergeEnvPulseSources,
} from "@/lib/pulse/config"
import { parsePulseSourcesEnv } from "@/lib/pulse/env-sources"
import { resolveBearerFromEnv } from "@/lib/pulse/resolve-secret"
import { getBearerForProject } from "@/lib/projects/resolve-bearer"
import type { PulseSource, PulseSummaryEntry } from "@/lib/pulse/types"

export type LoadPulseForUserOptions = {
  /** Ronda más corta, caché dedicada y concurrencia por defecto acotada (voz / webhooks). */
  voice?: boolean
}

export async function loadPulseAggregateForUser(
  userId: string,
  opts?: LoadPulseForUserOptions,
): Promise<{
  entries: PulseSummaryEntry[]
  roundDurationMs: number
  fetchedAt: string
  fromCache: boolean
}> {
  const voice = Boolean(opts?.voice)
  const cacheKey = voice ? `voice:user:${userId}` : `user:${userId}`
  const voiceTtl = getVoicePulseCacheTtlMs()
  const cached = getCachedAggregate(cacheKey)
  if (cached) {
    return {
      entries: cached.entries,
      roundDurationMs: cached.roundDurationMs,
      fetchedAt: cached.fetchedAt,
      fromCache: true,
    }
  }

  await connectDB()
  const ownerId = new mongoose.Types.ObjectId(userId)
  const projects = await ProjectModel.find({ ownerId }).lean()

  const sources: PulseSource[] = []

  for (const p of projects) {
    const appId = (p.slug && String(p.slug).trim()) || String(p._id)
    const pulseUrl = (p.pulseUrl && String(p.pulseUrl).trim()) || ""
    if (!pulseUrl) continue
    const token = getBearerForProject({
      bearerEnc: p.bearerEnc as string | undefined,
      secretEnvKey: p.secretEnvKey as string | undefined,
    })
    sources.push({ appId, pulseUrl, bearerToken: token })
  }

  if (mergeEnvPulseSources()) {
    const seen = new Set(sources.map((s) => s.appId))
    for (const e of parsePulseSourcesEnv()) {
      if (seen.has(e.id)) continue
      seen.add(e.id)
      sources.push({
        appId: e.id,
        pulseUrl: e.pulseUrl,
        bearerToken: resolveBearerFromEnv(e.secretEnvKey),
      })
    }
  }

  const maxConc = getPulseMaxConcurrency()
  const { entries, roundDurationMs } = await aggregatePulseSources(
    sources,
    voice
      ? {
          fetchTimeoutMs: getVoicePulseFetchTimeoutMs(),
          roundTimeoutMs: getVoicePulseRoundTimeoutMs(),
          maxConcurrency: maxConc > 0 ? maxConc : 8,
        }
      : undefined,
  )
  const fetchedAt = new Date().toISOString()

  setCachedAggregate(
    cacheKey,
    { entries, roundDurationMs, fetchedAt },
    voice ? voiceTtl : undefined,
  )

  return { entries, roundDurationMs, fetchedAt, fromCache: false }
}
