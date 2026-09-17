import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { connectDb } from "@/lib/db"
import { User } from "@/lib/models"
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "change-this-in-production"
)
export async function ensureSuperAdmin() {
  await connectDb()
  if (!(await User.exists({ role: "SUPER_ADMIN" })))
    await User.create({
      name: process.env.SUPER_ADMIN_NAME || "Super Admin",
      email: (process.env.SUPER_ADMIN_EMAIL || "admin@orkid.com").toLowerCase(),
      passwordHash: await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD || "orEco@admin",
        12
      ),
      role: "SUPER_ADMIN",
    })
}
export async function issueSession(user: {
  _id: { toString(): string }
  role: string
  hotelId?: { toString(): string } | null
}) {
  return new SignJWT({ role: user.role, hotelId: user.hotelId?.toString() })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}
export async function currentUser() {
  const token = (await cookies()).get("room_visit_session")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    await connectDb()
    return User.findById(payload.sub).lean()
  } catch {
    return null
  }
}
export function canAccess(
  user: { role: string; hotelId?: unknown } | null,
  hotelId: string
) {
  return user?.role === "SUPER_ADMIN" || String(user?.hotelId) === hotelId
}
