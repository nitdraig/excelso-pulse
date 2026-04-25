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
    /** Nombre para mostrar (sincronizado con nombre + apellido al guardar perfil). */
    name: { type: String, required: true, trim: true, maxlength: 120 },
    firstName: { type: String, default: "", trim: true, maxlength: 80 },
    lastName: { type: String, default: "", trim: true, maxlength: 80 },
    organizationName: { type: String, default: "", trim: true, maxlength: 160 },
    /** SHA-256 del token en claro; no se expone al cliente. */
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true },
)

export const UserModel = models.User ?? model("User", userSchema)
