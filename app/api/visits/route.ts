import { NextResponse } from "next/server"
import { canAccess, currentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Room } from "@/lib/models"
import { createVisit } from "@/lib/services/visit.service"

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const form = await request.formData()
  const roomId = String(form.get("roomId"))
  await connectDb()
  const room = await Room.findById(roomId)
  if (!room || !canAccess(user, String(room.hotelId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const files = form.getAll("photos").filter((entry): entry is File => entry instanceof File && entry.size > 0)
  const result = await createVisit({ roomId, userId: user._id, title: form.get("title"), status: form.get("status"), remarks: form.get("remarks"), files })
  return NextResponse.json(result?.visit, { status: 201 })
}

export async function GET(request: Request) {
  const user = await currentUser()
  const hotelId = new URL(request.url).searchParams.get("hotelId")
  if (!hotelId || !canAccess(user, hotelId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDb()
  const { Visit } = await import("@/lib/models")
  return NextResponse.json(await Visit.find({ hotelId }).sort({ createdAt: -1 }).populate("roomId", "roomNo roomType").populate("visitBy", "name").lean())
}
