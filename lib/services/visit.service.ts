import { Room, Visit } from "@/lib/models"
import { uploadVisitImage } from "@/lib/cloudinary"

type CreateVisitInput = { roomId: string; userId: unknown; title: FormDataEntryValue | null; status: FormDataEntryValue | null; remarks: FormDataEntryValue | null; files: File[] }

export async function createVisit({ roomId, userId, title, status, remarks, files }: CreateVisitInput) {
  const room = await Room.findById(roomId)
  if (!room) return null
  const photos = await Promise.all(files.map(uploadVisitImage))
  const visit = await Visit.create({ roomId, hotelId: room.hotelId, visitBy: userId, title, status, remarks, photos })
  room.lastVisitAt = new Date()
  await room.save()
  return { room, visit }
}
