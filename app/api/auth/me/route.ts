import { NextResponse } from "next/server"
import { currentUser } from "@/lib/auth"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ id: String(user._id), name: user.name, role: user.role, hotelId: user.hotelId ? String(user.hotelId) : null })
}
