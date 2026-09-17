import mongoose from "mongoose"

const uri = process.env.MONGODB_URI ?? ""
if (!uri) throw new Error("MONGODB_URI is required")
const globalDb = global as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}
const cached =
  globalDb.mongoose ?? (globalDb.mongoose = { conn: null, promise: null })
export async function connectDb() {
  if (cached.conn) return cached.conn
  cached.promise ??= mongoose.connect(uri, { bufferCommands: false })
  cached.conn = await cached.promise
  return cached.conn
}
