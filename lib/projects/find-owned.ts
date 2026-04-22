import mongoose from "mongoose"
import { ProjectModel } from "@/lib/db/models"

function maybeObjectId(key: string): mongoose.Types.ObjectId | null {
  if (key.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(key)) return null
  try {
    return new mongoose.Types.ObjectId(key)
  } catch {
    return null
  }
}

function buildOr(key: string) {
  const or: mongoose.FilterQuery<unknown>[] = [{ slug: key }]
  const oid = maybeObjectId(key)
  if (oid) or.push({ _id: oid })
  return or
}

export async function findOwnedProjectLean(
  ownerId: mongoose.Types.ObjectId,
  slugOrId: string,
) {
  const key = decodeURIComponent(slugOrId).trim()
  return ProjectModel.findOne({ ownerId, $or: buildOr(key) }).lean()
}

export async function findOwnedProjectDoc(
  ownerId: mongoose.Types.ObjectId,
  slugOrId: string,
) {
  const key = decodeURIComponent(slugOrId).trim()
  return ProjectModel.findOne({ ownerId, $or: buildOr(key) })
}
