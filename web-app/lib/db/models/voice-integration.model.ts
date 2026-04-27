import mongoose, { Schema, model } from "mongoose"

const voiceIntegrationSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    /** SHA-256 del token en claro; nunca se devuelve al cliente. */
    tokenHash: { type: String, required: true, index: true, select: false },
    active: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: null },
    label: { type: String, default: "Dialogflow", trim: true, maxlength: 120 },
  },
  { timestamps: true },
)

if (mongoose.models.VoiceIntegration) {
  delete mongoose.models.VoiceIntegration
}

export const VoiceIntegrationModel = model("VoiceIntegration", voiceIntegrationSchema)
