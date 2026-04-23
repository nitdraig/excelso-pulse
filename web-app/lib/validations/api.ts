import { z } from "zod"

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
})

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Solo minúsculas, números y guiones (sin empezar/terminar en guión).",
  )

function refineNonEmptyAppUrl(val: string, ctx: z.RefinementCtx) {
  if (!val) return
  if (!z.string().url().safeParse(val).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "URL del front inválida (usa https://…).",
    })
  }
}

/** Alta: `appUrl` opcional; vacío se guarda como cadena vacía. */
const createAppUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((s) => s ?? "")
  .superRefine(refineNonEmptyAppUrl)

/** Actualización: omitir clave = sin cambio; "" borra el enlace. */
const patchAppUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .superRefine((val, ctx) => {
    if (val === undefined) return
    refineNonEmptyAppUrl(val, ctx)
  })

const bearerTokenUpdate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().min(8).max(8192).optional(),
)

export const createProjectBodySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().default(""),
  icon: z.string().trim().max(8).optional().default("📦"),
  appUrl: createAppUrlSchema,
  pulseUrl: z.string().trim().url().max(2048),
  /** Token Bearer del backend; se cifra antes de guardar (no se devuelve en GET). */
  bearerToken: z.string().min(8).max(8192),
})

export const updateProjectBodySchema = z
  .object({
    slug: slugSchema.optional(),
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    icon: z.string().trim().max(8).optional(),
    appUrl: patchAppUrlSchema,
    pulseUrl: z.string().trim().url().max(2048).optional(),
    bearerToken: bearerTokenUpdate,
    /** Si es true, borra token cifrado y referencia env legada. */
    clearBearer: z.literal(true).optional(),
  })
  .refine((d) => !(d.clearBearer && d.bearerToken), {
    message: "No uses clearBearer junto con bearerToken.",
    path: ["clearBearer"],
  })
  .refine((d) => Object.keys(d).some((k) => d[k as keyof typeof d] !== undefined), {
    message: "Envía al menos un campo a actualizar.",
  })
