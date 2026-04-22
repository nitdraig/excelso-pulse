import mongoose, { Schema, models, model } from "mongoose"

const projectSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Slug estable para el agregador (coincide con `appId` en pulse). */
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 64,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 2000 },
    icon: { type: String, default: "📦", maxlength: 8 },
    /**
     * URL pública del front (dashboard, marketing, etc.) para enlaces en la UI.
     * El agregador **no** usa este campo; solo `pulseUrl`.
     */
    appUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    /** URL completa del endpoint pulse del backend (ej. …/internal/pulse). */
    pulseUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    /** Bearer cifrado en reposo (AES-256-GCM). No incluir en respuestas JSON al cliente. */
    bearerEnc: {
      type: String,
      default: "",
    },
    /**
     * Legado: nombre de variable de entorno en el servidor (si no hay `bearerEnc`).
     * No requerido: los altas nuevas usan solo `bearerEnc` cifrado.
     */
    secretEnvKey: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: 128,
    },
  },
  { timestamps: true },
)

projectSchema.index({ ownerId: 1, slug: 1 }, { unique: true })

/** En Next.js dev/HMR, Mongoose reutiliza el modelo antiguo si no se elimina primero. */
if (mongoose.models.Project) {
  delete mongoose.models.Project
}

export const ProjectModel = model("Project", projectSchema)
