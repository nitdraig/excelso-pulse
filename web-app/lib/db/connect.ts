import mongoose from "mongoose"

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as unknown as { mongoose?: MongooseCache }

function getCache(): MongooseCache {
  if (!globalForMongoose.mongoose) {
    globalForMongoose.mongoose = { conn: null, promise: null }
  }
  return globalForMongoose.mongoose
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      "Define MONGODB_URI en las variables de entorno (cadena de conexión de MongoDB).",
    )
  }
  const c = getCache()
  if (c.conn) return c.conn
  if (!c.promise) {
    c.promise = mongoose.connect(uri)
  }
  c.conn = await c.promise
  return c.conn
}
