import mongoose, { Schema, models, model } from "mongoose"
import { PROJECT_ALERT_RULE_TYPES } from "@/lib/alerts/project-alert-rules"

const projectAlertSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Slug del proyecto del usuario (coincide con registry). */
    projectSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 64,
    },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    ruleType: {
      type: String,
      required: true,
      enum: [...PROJECT_ALERT_RULE_TYPES],
    },
    /** Umbral numérico: ms de latencia o % de error según `ruleType`. */
    threshold: { type: Number, default: null, min: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
)

projectAlertSchema.index({ ownerId: 1, projectSlug: 1 })

export const ProjectAlertModel =
  models.ProjectAlert ?? model("ProjectAlert", projectAlertSchema)
