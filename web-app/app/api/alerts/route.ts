import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import { ProjectAlertModel, ProjectModel } from "@/lib/db/models"
import { createProjectAlertBodySchema } from "@/lib/validations/api"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const list = await ProjectAlertModel.find({ ownerId }).sort({ updatedAt: -1 }).lean()

    const slugs = [...new Set(list.map((a) => a.projectSlug))]
    const projects =
      slugs.length > 0
        ? await ProjectModel.find({ ownerId, slug: { $in: slugs } })
            .select("slug name")
            .lean()
        : []
    const nameBySlug = new Map(projects.map((p) => [p.slug, p.name]))

    const alerts = list.map((a) => ({
      id: String(a._id),
      projectSlug: a.projectSlug,
      projectName: nameBySlug.get(a.projectSlug) ?? a.projectSlug,
      label: a.label,
      ruleType: a.ruleType,
      threshold: a.threshold,
      enabled: a.enabled,
      updatedAt: a.updatedAt,
    }))

    return NextResponse.json({ alerts })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Error al leer alertas." }, { status: 500 })
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
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const parsed = createProjectAlertBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const project = await ProjectModel.findOne({
      ownerId,
      slug: parsed.data.projectSlug,
    }).lean()

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 })
    }

    const threshold =
      parsed.data.ruleType === "latency_above" ||
      parsed.data.ruleType === "error_rate_above"
        ? parsed.data.threshold
        : null

    const created = await ProjectAlertModel.create({
      ownerId,
      projectSlug: parsed.data.projectSlug,
      label: parsed.data.label,
      ruleType: parsed.data.ruleType,
      threshold,
      enabled: parsed.data.enabled ?? true,
    })

    return NextResponse.json(
      {
        ok: true,
        alert: {
          id: String(created._id),
          projectSlug: created.projectSlug,
          projectName: project.name,
          label: created.label,
          ruleType: created.ruleType,
          threshold: created.threshold,
          enabled: created.enabled,
        },
      },
      { status: 201 },
    )
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo crear la alerta." }, { status: 500 })
  }
}
