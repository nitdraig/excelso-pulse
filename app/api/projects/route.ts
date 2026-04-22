import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { encryptBearerSecret } from "@/lib/crypto/bearer-at-rest"
import { connectDB } from "@/lib/db/connect"
import { ProjectModel } from "@/lib/db/models"
import { invalidatePulseCache } from "@/lib/pulse/cache"
import type { ProjectRegistryLean } from "@/lib/projects/merge-registry-pulse"
import { mergeRegistryWithPulseEntries } from "@/lib/projects/merge-registry-pulse"
import { createProjectBodySchema } from "@/lib/validations/api"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const list = await ProjectModel.find({ ownerId }).sort({ updatedAt: -1 }).lean()

    const projects = mergeRegistryWithPulseEntries(list, [])
    return NextResponse.json({ projects })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al leer proyectos." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 })
  }

  const parsed = createProjectBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  let bearerEnc: string
  try {
    bearerEnc = encryptBearerSecret(parsed.data.bearerToken)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo cifrar el token."
    return NextResponse.json({ error: msg }, { status: 503 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const created = await ProjectModel.create({
      ownerId,
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      icon: parsed.data.icon,
      appUrl: parsed.data.appUrl,
      pulseUrl: parsed.data.pulseUrl,
      bearerEnc,
      secretEnvKey: "",
    })

    invalidatePulseCache(`user:${session.user.id}`)

    const registryRow: ProjectRegistryLean = {
      ...(created.toObject() as unknown as ProjectRegistryLean),
      bearerEnc,
    }
    const project = mergeRegistryWithPulseEntries([registryRow], [])[0]
    return NextResponse.json({ project }, { status: 201 })
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code
    if (code === 11000) {
      return NextResponse.json(
        { error: "Ya existe un proyecto con ese slug." },
        { status: 409 },
      )
    }
    console.error(e)
    return NextResponse.json({ error: "No se pudo crear el proyecto." }, { status: 500 })
  }
}
