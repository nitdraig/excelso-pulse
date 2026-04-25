import { NextResponse } from "next/server"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import { ProjectAlertModel, ProjectModel, UserModel } from "@/lib/db/models"
import {
  deleteAccountBodySchema,
  patchAccountBodySchema,
} from "@/lib/validations/api"

function normalizeProfileFields(user: {
  name: string
  email: string
  firstName?: string
  lastName?: string
  organizationName?: string
}) {
  let firstName = (user.firstName ?? "").trim()
  let lastName = (user.lastName ?? "").trim()
  if (!firstName && !lastName && user.name) {
    const parts = user.name.trim().split(/\s+/)
    firstName = parts[0] ?? ""
    lastName = parts.slice(1).join(" ")
  }
  return {
    firstName,
    lastName,
    organizationName: (user.organizationName ?? "").trim(),
    email: user.email,
    name: user.name,
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const doc = await UserModel.findById(session.user.id).lean()
    if (!doc) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    const u = doc as {
      name: string
      email: string
      firstName?: string
      lastName?: string
      organizationName?: string
    }
    const n = normalizeProfileFields(u)

    return NextResponse.json({
      email: n.email,
      firstName: n.firstName,
      lastName: n.lastName,
      organizationName: n.organizationName,
      displayName: `${n.firstName} ${n.lastName}`.trim() || u.name,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al leer la cuenta." }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const parsed = patchAccountBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 })
  }

  try {
    await connectDB()
    const user = await UserModel.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    const nextEmail =
      parsed.data.email !== undefined ? parsed.data.email.toLowerCase().trim() : user.email

    if (nextEmail !== user.email) {
      const taken = await UserModel.findOne({
        email: nextEmail,
        _id: { $ne: user._id },
      }).lean()
      if (taken) {
        return NextResponse.json(
          { error: "Ese correo ya está en uso." },
          { status: 409 },
        )
      }
      user.email = nextEmail
    }

    if (parsed.data.firstName !== undefined) user.firstName = parsed.data.firstName
    if (parsed.data.lastName !== undefined) user.lastName = parsed.data.lastName
    if (parsed.data.organizationName !== undefined) {
      user.organizationName = parsed.data.organizationName
    }

    const firstName = (user.firstName ?? "").trim()
    const lastName = (user.lastName ?? "").trim()
    const combined = `${firstName} ${lastName}`.trim()
    user.name = combined || user.email.split("@")[0] || "Usuario"

    await user.save()

    const organizationName = (user.organizationName ?? "").trim()

    return NextResponse.json({
      ok: true,
      user: {
        email: user.email,
        firstName,
        lastName,
        organizationName,
        name: user.name,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const parsed = deleteAccountBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    await connectDB()
    const user = await UserModel.findById(session.user.id).select("+passwordHash")
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 403 })
    }

    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    await ProjectModel.deleteMany({ ownerId })
    await ProjectAlertModel.deleteMany({ ownerId })
    await UserModel.deleteOne({ _id: user._id })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 })
  }
}
