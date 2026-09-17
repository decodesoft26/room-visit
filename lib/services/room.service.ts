import { Room, Visit } from "@/lib/models"

export async function listRoomsWithLatestVisit(hotelId: string) {
  const rooms = await Room.find({ hotelId }).sort({ roomNo: 1 }).lean()
  const latestVisits = await Visit.aggregate([
    { $match: { roomId: { $in: rooms.map((room) => room._id) } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$roomId", lastVisit: { $first: "$$ROOT" } } },
  ])
  return rooms.map((room) => ({ ...room, lastVisit: latestVisits.find((visit) => String(visit._id) === String(room._id))?.lastVisit ?? null }))
}
