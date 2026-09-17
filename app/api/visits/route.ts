import { NextResponse } from "next/server"
import { canAccess, currentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Room, Visit } from "@/lib/models"
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
  const url = new URL(request.url)
  const hotelId = url.searchParams.get("hotelId")
  const roomId = url.searchParams.get("roomId")
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "10")
  const search = url.searchParams.get("search") || ""
  const status = url.searchParams.get("status") || ""
  
  if (!hotelId || !canAccess(user, hotelId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  
  await connectDb()
  
  const query: Record<string, unknown> = { hotelId }
  
  if (roomId) {
    query.roomId = roomId
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { remarks: { $regex: search, $options: "i" } },
      { "roomId.roomNo": { $regex: search, $options: "i" } },
    ]
  }
  
  if (status) {
    query.status = status
  }
  
  const skip = (page - 1) * limit
  
  const [visits, total] = await Promise.all([
    Visit.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("roomId", "roomNo roomType")
      .populate("visitBy", "name")
      .lean(),
    Visit.countDocuments(query),
  ])
  
  return NextResponse.json({
    visits,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
