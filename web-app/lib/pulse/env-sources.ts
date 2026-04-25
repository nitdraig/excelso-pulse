import { z } from "zod"
import { ensureHttpsUrl } from "@/lib/url"

const entrySchema = z.object({
  id: z.string().min(1).max(64),
  pulseUrl: z
    .string()
    .trim()
    .transform(ensureHttpsUrl)
    .pipe(z.string().url().max(2048)),
  secretEnvKey: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/).max(128),
})

const listSchema = z.array(entrySchema)

export type PulseEnvSource = z.infer<typeof entrySchema>

/**
 * Fuentes adicionales desde `PULSE_SOURCES` (JSON array).
 * Ej.: `[{"id":"my-api","pulseUrl":"https://api.example.com/internal/pulse","secretEnvKey":"MY_API_PULSE_TOKEN"}]`
 */
export function parsePulseSourcesEnv(): PulseEnvSource[] {
  const raw = process.env.PULSE_SOURCES?.trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    const r = listSchema.safeParse(parsed)
    return r.success ? r.data : []
  } catch {
    return []
  }
}
