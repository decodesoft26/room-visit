import { NextResponse } from "next/server"
import { currentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { HotelProfile } from "@/lib/models"
export async function GET() {
  const user = await currentUser()
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await connectDb()
  return NextResponse.json(
    await HotelProfile.find(
      user.role === "SUPER_ADMIN" ? {} : { _id: user.hotelId }
    )
      .sort({ name: 1 })
      .lean()
  )
}
export async function POST(request: Request) {
  const user = await currentUser()
  if (user?.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { name, address } = await request.json()
  await connectDb()
  return NextResponse.json(await HotelProfile.create({ name, address }), {
    status: 201,
  })
}
