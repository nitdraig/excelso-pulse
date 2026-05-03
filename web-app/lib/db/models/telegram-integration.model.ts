import { Schema, model, models } from "mongoose"

const telegramIntegrationSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    /** ID numérico de Telegram como string (estable en JSON del webhook). */
    telegramUserId: { type: String, required: true, unique: true, index: true, trim: true },
    linkedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
)

export const TelegramIntegrationModel =
  models.TelegramIntegration ??
  model("TelegramIntegration", telegramIntegrationSchema)
