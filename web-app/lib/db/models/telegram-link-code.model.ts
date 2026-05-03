import { Schema, model, models } from "mongoose"

const telegramLinkCodeSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** SHA-256 del token mostrado en el enlace /start. */
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export const TelegramLinkCodeModel =
  models.TelegramLinkCode ?? model("TelegramLinkCode", telegramLinkCodeSchema)
