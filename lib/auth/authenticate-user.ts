import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ id: string; name: string; email: string } | null> {
  await connectDB()
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() })
    .select("+passwordHash")
    .lean()

  if (!user?.passwordHash) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  }
}
