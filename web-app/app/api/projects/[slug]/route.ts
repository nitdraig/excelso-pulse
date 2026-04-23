import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { encryptBearerSecret } from "@/lib/crypto/bearer-at-rest"
import { connectDB } from "@/lib/db/connect"
import { ProjectModel } from "@/lib/db/models"
import { invalidatePulseCache } from "@/lib/pulse/cache"
import { findOwnedProjectDoc, findOwnedProjectLean } from "@/lib/projects/find-owned"
import { mergeRegistryWithPulseEntries } from "@/lib/projects/merge-registry-pulse"
import { updateProjectBodySchema } from "@/lib/validations/api"

type RouteCtx = { params: Promise<{ slug: string }> }

function hasBearerOnLean(doc: {
  bearerEnc?: string
  secretEnvKey?: string
}): boolean {
  const enc = doc.bearerEnc?.trim()
  if (enc && enc.length > 0) return true
  const sk = String(doc.secretEnvKey ?? "").trim()
  return sk.length > 0
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { slug: slugParam } = await ctx.params

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const doc = await findOwnedProjectLean(ownerId, slugParam)
    if (!doc) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 })
    }

    return NextResponse.json({
      project: {
        slug: String(doc.slug ?? ""),
        name: doc.name,
        description: doc.description ?? "",
        icon: doc.icon ?? "📦",
        appUrl: String(doc.appUrl ?? ""),
        pulseUrl: String(doc.pulseUrl ?? ""),
        hasBearer: hasBearerOnLean(doc),
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al leer el origen." }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { slug: slugParam } = await ctx.params

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 })
  }

  const parsed = updateProjectBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const doc = await findOwnedProjectDoc(ownerId, slugParam)
    if (!doc) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 })
    }

    const nextSlug = parsed.data.slug ?? doc.slug
    if (nextSlug !== doc.slug) {
      const clash = await ProjectModel.findOne({
        ownerId,
        slug: nextSlug,
        _id: { $ne: doc._id },
      }).lean()
      if (clash) {
        return NextResponse.json(
          { error: "Ya existe un origen con ese slug." },
          { status: 409 },
        )
      }
    }

    if (parsed.data.clearBearer) {
      doc.bearerEnc = ""
      doc.secretEnvKey = ""
    } else if (parsed.data.bearerToken) {
      try {
        doc.bearerEnc = encryptBearerSecret(parsed.data.bearerToken)
        doc.secretEnvKey = ""
      } catch (e) {
        const msg = e instanceof Error ? e.message : "No se pudo cifrar el token."
        return NextResponse.json({ error: msg }, { status: 503 })
      }
    }

    if (parsed.data.name !== undefined) doc.name = parsed.data.name
    if (parsed.data.description !== undefined) doc.description = parsed.data.description
    if (parsed.data.icon !== undefined) doc.icon = parsed.data.icon
    if (parsed.data.appUrl !== undefined) doc.appUrl = parsed.data.appUrl
    if (parsed.data.pulseUrl !== undefined) doc.pulseUrl = parsed.data.pulseUrl
    if (parsed.data.slug !== undefined) doc.slug = parsed.data.slug

    await doc.save()
    invalidatePulseCache(`user:${session.user.id}`)

    const merged = mergeRegistryWithPulseEntries([doc.toObject()], [])[0]
    return NextResponse.json({ project: merged })
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code
    if (code === 11000) {
      return NextResponse.json(
        { error: "Ya existe un origen con ese slug." },
        { status: 409 },
      )
    }
    console.error(e)
    return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { slug: slugParam } = await ctx.params

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const doc = await findOwnedProjectDoc(ownerId, slugParam)
    if (!doc) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 })
    }

    await doc.deleteOne()
    invalidatePulseCache(`user:${session.user.id}`)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 })
  }
}
