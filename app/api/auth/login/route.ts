import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { ensureSuperAdmin, issueSession } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { User } from "@/lib/models"
export async function POST(request: Request) {
  const { email, password } = await request.json()
  await ensureSuperAdmin()
  await connectDb()
  const user = await User.findOne({
    email: String(email).toLowerCase(),
  }).select("+passwordHash")
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )
  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      hotelId: user.hotelId,
    },
  })
  response.cookies.set("room_visit_session", await issueSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 604800,
    path: "/",
  })
  return response
}
