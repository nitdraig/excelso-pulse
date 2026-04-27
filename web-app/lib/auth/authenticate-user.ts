import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db/connect"
import { UserModel } from "@/lib/db/models"
import type { SessionUserPayload } from "@/lib/auth/session-user"

const DUMMY_BCRYPT_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoO5Q4z2JxXl16rYPD6/COM24kTx5cDIe."

function buildDisplayName(
  firstName: string,
  lastName: string,
  fallbackName: string,
  email: string,
): string {
  const fromParts = `${firstName} ${lastName}`.trim()
  if (fromParts) return fromParts.slice(0, 120)
  if (fallbackName.trim()) return fallbackName.trim().slice(0, 120)
  const local = email.split("@")[0] ?? "user"
  return local.slice(0, 120)
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUserPayload | null> {
  await connectDB()
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() })
    .select("+passwordHash")
    .lean()

  if (!user?.passwordHash) {
    await bcrypt.compare(password, DUMMY_BCRYPT_HASH)
    return null
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  const raw = user as {
    _id: unknown
    name: string
    email: string
    firstName?: string
    lastName?: string
    organizationName?: string
  }

  let firstName = (raw.firstName ?? "").trim()
  let lastName = (raw.lastName ?? "").trim()
  if (!firstName && !lastName && raw.name) {
    const parts = raw.name.trim().split(/\s+/)
    firstName = parts[0] ?? ""
    lastName = parts.slice(1).join(" ")
  }

  const organizationName = (raw.organizationName ?? "").trim()

  return {
    id: String(raw._id),
    name: buildDisplayName(firstName, lastName, raw.name, raw.email),
    email: raw.email,
    firstName,
    lastName,
    organizationName,
  }
}
