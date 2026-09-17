import type { RoomSummary } from "@/features/rooms/types"

export const demoRooms: RoomSummary[] = [
  { id: "101", number: "101", type: "Deluxe King", floor: "Level 1", lastVisit: "Today, 09:42", status: "OK", title: "Morning inspection", remarks: "Everything is in order.", photos: [] },
  { id: "102", number: "102", type: "Deluxe Twin", floor: "Level 1", lastVisit: "Today, 09:18", status: "ATTENTION", title: "Bathroom fixture", remarks: "Shower head has a minor leak.", photos: [] },
  { id: "103", number: "103", type: "Premier Suite", floor: "Level 1", lastVisit: "Yesterday, 16:20", status: "OK", title: "Turnover check", remarks: "Ready for arrival.", photos: [] },
  { id: "201", number: "201", type: "Deluxe King", floor: "Level 2", lastVisit: "Yesterday, 14:05", status: "URGENT", title: "Air conditioning", remarks: "AC not cooling. Engineering notified.", photos: [] },
  { id: "202", number: "202", type: "Executive Suite", floor: "Level 2", lastVisit: "12 Sep, 11:30", status: "OK", title: "Routine inspection", remarks: "All clear.", photos: [] },
  { id: "203", number: "203", type: "Deluxe Twin", floor: "Level 2", lastVisit: "11 Sep, 15:12", status: "ATTENTION", title: "Minibar", remarks: "Restock items before check-in.", photos: [] },
]
