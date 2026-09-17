export type VisitStatus = "OK" | "ATTENTION" | "URGENT"

export type RoomVisit = { title?: string; remarks?: string; photos?: string[] }

export type RoomSummary = {
  id: string
  number: string
  type: string
  floor: string
  lastVisit: string
  status: VisitStatus
} & RoomVisit
