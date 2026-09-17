import { NextResponse } from "next/server"
import { canAccess, currentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Room, Visit } from "@/lib/models"
import { createVisit } from "@/lib/services/visit.service"

function normalizeFilter(value: string) {
  return value.trim()
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const form = await request.formData()
  const roomId = String(form.get("roomId"))
  await connectDb()
  const room = await Room.findById(roomId)
  if (!room || !canAccess(user, String(room.hotelId)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const files = form
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
  const result = await createVisit({
    roomId,
    userId: user._id,
    title: form.get("title"),
    status: form.get("status"),
    remarks: form.get("remarks"),
    files,
  })
  return NextResponse.json(result?.visit, { status: 201 })
}

export async function GET(request: Request) {
  const user = await currentUser()
  const url = new URL(request.url)
  const hotelId = url.searchParams.get("hotelId")
  const roomId = url.searchParams.get("roomId")
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "10")
  const search = normalizeFilter(url.searchParams.get("search") || "")
  const status = normalizeFilter(url.searchParams.get("status") || "")
  const roomType = normalizeFilter(url.searchParams.get("roomType") || "")
  const roomNo = normalizeFilter(url.searchParams.get("roomNo") || "")
  const sort = url.searchParams.get("sort") || "newest"

  if (!hotelId || !canAccess(user, hotelId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await connectDb()

  const query: Record<string, unknown> = { hotelId }
  const escapedSearch = search ? escapeRegex(search) : ""
  const textSearch = search ? { $regex: escapedSearch, $options: "i" } : null

  if (roomId) {
    query.roomId = roomId
  }

  const roomMatchCriteria: Record<string, unknown> = { hotelId }
  if (roomType) roomMatchCriteria.roomType = roomType
  if (roomNo) roomMatchCriteria.roomNo = roomNo
  if (search) {
    roomMatchCriteria.$or = [
      { roomNo: { $regex: escapedSearch, $options: "i" } },
      { roomType: { $regex: escapedSearch, $options: "i" } },
    ]
  }

  const matchingRoomIds = await Room.find(roomMatchCriteria)
    .select("_id")
    .lean()
  const matchingRoomObjectIds = matchingRoomIds.map((room) => room._id)
  const hasRoomMatchFilter = Boolean(
    roomType || roomNo || (search && matchingRoomObjectIds.length > 0)
  )

  if (hasRoomMatchFilter) {
    query.roomId = { $in: matchingRoomObjectIds }
  } else if ((roomType || roomNo) && matchingRoomObjectIds.length === 0) {
    query.roomId = { $in: [] }
  }

  if (status) {
    query.status = status
  }

  if (search || roomType || roomNo) {
    const textConditions: Record<string, unknown>[] = []
    if (textSearch) {
      textConditions.push({ title: textSearch }, { remarks: textSearch })
    }
    if (matchingRoomObjectIds.length && hasRoomMatchFilter) {
      textConditions.push({ roomId: { $in: matchingRoomObjectIds } })
    }
    if (textConditions.length) {
      query.$or = textConditions
    }
  }

  const skip = (page - 1) * limit
  const sortValue: Record<string, 1 | -1> =
    sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 }

  const [visits, total] = await Promise.all([
    Visit.find(query)
      .sort(sortValue)
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
