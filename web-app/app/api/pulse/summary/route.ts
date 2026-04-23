import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { loadPulseAggregateForUser } from "@/lib/pulse/load-for-user"
import {
  getPulseRateLimitMax,
  getPulseRateLimitWindowMs,
} from "@/lib/pulse/config"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * Payload agregado crudo (UI, otro BFF, jobs de IA). Los Bearer no salen en la respuesta.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const rl = checkRateLimit(
    `pulse_summary:${session.user.id}`,
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
    const { entries, roundDurationMs, fetchedAt, fromCache } =
      await loadPulseAggregateForUser(session.user.id)

    console.info(
      `[pulse] summary user=${session.user.id} round=${roundDurationMs}ms entries=${entries.length} cached=${fromCache}`,
    )

    return NextResponse.json({
      entries,
      roundDurationMs,
      fetchedAt,
      fromCache,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Error al agregar pulse." },
      { status: 500 },
    )
  }
}
