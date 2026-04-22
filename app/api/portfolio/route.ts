import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import { ProjectModel } from "@/lib/db/models"
import { loadPulseAggregateForUser } from "@/lib/pulse/load-for-user"
import {
  getPulseRateLimitMax,
  getPulseRateLimitWindowMs,
} from "@/lib/pulse/config"
import { mergeRegistryWithPulseEntries } from "@/lib/projects/merge-registry-pulse"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const rl = checkRateLimit(
    `portfolio:${session.user.id}`,
    getPulseRateLimitMax(),
    getPulseRateLimitWindowMs(),
  )
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas peticiones al agregador." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      },
    )
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const list = await ProjectModel.find({ ownerId }).sort({ updatedAt: -1 }).lean()

    const { entries, roundDurationMs, fetchedAt, fromCache } =
      await loadPulseAggregateForUser(session.user.id)

    console.info(
      `[pulse] portfolio user=${session.user.id} round=${roundDurationMs}ms entries=${entries.length} cached=${fromCache}`,
    )

    const apps = mergeRegistryWithPulseEntries(list, entries)
    return NextResponse.json({
      apps,
      roundDurationMs,
      fetchedAt,
      fromCache,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Error al construir el portfolio." },
      { status: 500 },
    )
  }
}
