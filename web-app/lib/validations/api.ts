import { z } from "zod"
import { PROJECT_ALERT_RULE_TYPES } from "@/lib/alerts/project-alert-rules"
import { ensureHttpsUrl } from "@/lib/url"

const noControlChars = (value: string) => !/[\u0000-\u001F\u007F]/.test(value)
const emailSchema = z.string().trim().email().max(254)
const passwordSchema = z.string().min(8).max(128).refine(noControlChars, {
  message: "La contraseña contiene caracteres inválidos.",
})

export const registerBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine(noControlChars, { message: "El nombre contiene caracteres inválidos." }),
  email: emailSchema,
  password: passwordSchema,
})

export const loginCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128).refine(noControlChars, {
    message: "La contraseña contiene caracteres inválidos.",
  }),
})

export const patchAccountBodySchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  organizationName: z.string().trim().max(160).optional(),
  email: z.string().trim().email().max(254).optional(),
})

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
})

export const deleteAccountBodySchema = z.object({
  password: z.string().min(1).max(128),
})

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(["en", "es"]).optional(),
})

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(32).max(128),
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

const alertRuleTypeSchema = z.enum(PROJECT_ALERT_RULE_TYPES)

export const createProjectAlertBodySchema = z
  .object({
    projectSlug: slugSchema,
    label: z.string().trim().min(1).max(120),
    ruleType: alertRuleTypeSchema,
    threshold: z.number().min(0).nullable().optional(),
    enabled: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.ruleType === "latency_above" || data.ruleType === "error_rate_above") {
      if (data.threshold == null || Number.isNaN(data.threshold)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Umbral requerido para este tipo de alerta.",
          path: ["threshold"],
        })
        return
      }
      if (data.ruleType === "error_rate_above" && data.threshold > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La tasa de error debe ser ≤ 100.",
          path: ["threshold"],
        })
      }
    }
  })

export const patchProjectAlertBodySchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    ruleType: alertRuleTypeSchema.optional(),
    threshold: z.number().min(0).nullable().optional(),
    enabled: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).some((k) => d[k as keyof typeof d] !== undefined), {
    message: "Envía al menos un campo a actualizar.",
  })

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
  .transform((s) => {
    const v = s ?? ""
    if (!v) return ""
    return ensureHttpsUrl(v)
  })
  .superRefine(refineNonEmptyAppUrl)

/** Actualización: omitir clave = sin cambio; "" borra el enlace. */
const patchAppUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined
    if (val === "") return ""
    return ensureHttpsUrl(val)
  })
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
  pulseUrl: z
    .string()
    .trim()
    .transform(ensureHttpsUrl)
    .pipe(z.string().url().max(2048)),
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
    pulseUrl: z
      .string()
      .trim()
      .transform((s) => (s === "" ? s : ensureHttpsUrl(s)))
      .pipe(z.string().url().max(2048))
      .optional(),
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
