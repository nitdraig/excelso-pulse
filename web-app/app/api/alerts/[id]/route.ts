import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import { connectDB } from "@/lib/db/connect"
import { ProjectAlertModel } from "@/lib/db/models"
import { patchProjectAlertBodySchema } from "@/lib/validations/api"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const parsed = patchProjectAlertBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const alert = await ProjectAlertModel.findOne({ _id: id, ownerId })
    if (!alert) {
      return NextResponse.json({ error: "Alerta no encontrada." }, { status: 404 })
    }

    const d = parsed.data
    if (d.label !== undefined) alert.label = d.label
    if (d.enabled !== undefined) alert.enabled = d.enabled
    if (d.ruleType !== undefined) alert.ruleType = d.ruleType
    if (d.threshold !== undefined) alert.threshold = d.threshold

    if (
      alert.ruleType === "latency_above" ||
      alert.ruleType === "error_rate_above"
    ) {
      if (alert.threshold == null) {
        return NextResponse.json(
          { error: "Este tipo de alerta requiere umbral." },
          { status: 400 },
        )
      }
      if (alert.ruleType === "error_rate_above" && alert.threshold > 100) {
        return NextResponse.json({ error: "Umbral de error inválido." }, { status: 400 })
      }
    } else {
      alert.threshold = null
    }

    await alert.save()

    return NextResponse.json({
      ok: true,
      alert: {
        id: String(alert._id),
        projectSlug: alert.projectSlug,
        label: alert.label,
        ruleType: alert.ruleType,
        threshold: alert.threshold,
        enabled: alert.enabled,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Id inválido." }, { status: 400 })
  }

  try {
    await connectDB()
    const ownerId = new mongoose.Types.ObjectId(session.user.id)
    const res = await ProjectAlertModel.deleteOne({ _id: id, ownerId })
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Alerta no encontrada." }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 })
  }
}
