import mongoose, { Schema, models, model } from "mongoose"

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true },
)

export const UserModel =
  models.User ?? model("User", userSchema)
