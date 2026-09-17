import { NextResponse } from "next/server"
import { canAccess, currentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Room } from "@/lib/models"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = await currentUser()
  const { roomId } = await params
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  await connectDb()
  const room = await Room.findById(roomId).lean()
  
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 })
  
  if (!canAccess(user, String(room.hotelId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  return NextResponse.json(room)
}