import { NextResponse } from "next/server"
import { canAccess, currentUser } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Room } from "@/lib/models"
import { listRoomsWithLatestVisit } from "@/lib/services/room.service"
export async function GET(request: Request) {
  const user = await currentUser()
  const hotelId = new URL(request.url).searchParams.get("hotelId")
  if (!hotelId || !canAccess(user, hotelId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  await connectDb()
  return NextResponse.json(await listRoomsWithLatestVisit(hotelId))
}
export async function POST(request: Request) {
  const user = await currentUser()
  if (user?.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await request.json()
  await connectDb()
  return NextResponse.json(await Room.create(body), { status: 201 })
}
