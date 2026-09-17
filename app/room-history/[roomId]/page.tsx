"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Image as ImageIcon, X, Search, Filter, ChevronLeft, ChevronRight, Building2, Eye } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"

type Session = { name: string; role: "SUPER_ADMIN" | "USER"; hotelId: string | null }
type Hotel = { _id: string; name: string; address: string }
type Room = { _id: string; roomNo: string; roomType: string; roomFloor: string }
type Visit = { _id: string; title: string; status: string; remarks: string; createdAt: string; roomId: { roomNo: string; roomType: string }; visitBy: { name: string }; photos: { url: string }[] }
type Pagination = { page: number; limit: number; total: number; totalPages: number }

async function api<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Request failed")
  return response.json()
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(date))
}

export default function RoomHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)

  const session = useQuery({ queryKey: ["session"], queryFn: () => api<Session>("/api/auth/me") })
  const hotels = useQuery({ queryKey: ["hotels"], queryFn: () => api<Hotel[]>("/api/hotels"), enabled: !!session.data })

  useEffect(() => {
    if (session.isError) router.replace("/login")
    if (session.data?.role === "USER") setHotelId(session.data.hotelId)
    if (session.data?.role === "SUPER_ADMIN" && hotels.data) {
      const saved = localStorage.getItem(`room-visit:selected-hotel:${session.data.name}`)
      if (saved) setHotelId(saved)
    }
  }, [session.data, session.isError, hotels.data, router])

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => api<Room>(`/api/rooms/${roomId}`),
    enabled: !!roomId && !!hotelId,
  })

  useEffect(() => {
    if (roomQuery.data) setRoom(roomQuery.data)
  }, [roomQuery.data])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const visitsQuery = useQuery({
    queryKey: ["room-visits", roomId, page, debouncedSearch, statusFilter],
    queryFn: () => api<{ visits: Visit[]; pagination: Pagination }>(`/api/visits?hotelId=${hotelId}&roomId=${roomId}&page=${page}&limit=10&search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}`),
    enabled: !!hotelId && !!roomId,
  })

  if (session.isLoading || hotels.isLoading || roomQuery.isLoading || visitsQuery.isLoading) {
    return (
      <>
        <Navbar user={session.data} />
        <main className="min-h-svh bg-[#f5f7f5] p-5 pt-16 md:pt-20">
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        </main>
      </>
    )
  }

  if (!room) {
    return (
      <>
        <Navbar user={session.data} />
        <main className="min-h-svh bg-[#f5f7f5] p-5 pt-16 md:pt-20">
          <div className="mx-auto max-w-5xl text-center py-20">
            <Building2 className="mx-auto h-16 w-16 text-[#789087]" />
            <p className="mt-4 text-lg text-[#789087]">Loading room...</p>
          </div>
        </main>
      </>
    )
  }

  const visits = visitsQuery.data?.visits || []
  const pagination = visitsQuery.data?.pagination
  const hotel = hotels.data?.find((h) => h._id === hotelId)

  return (
    <>
      <Navbar user={session.data} hotelName={hotel?.name} />
      <main className="min-h-svh bg-[#f5f7f5] p-4 text-[#18332b] pt-16 md:pt-20 pb-20 md:pb-0">
        <section className="mx-auto max-w-5xl">

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#789087] size-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, remarks..."
              className="input w-full pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#789087] size-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-10 w-[180px]"
            >
              <option value="">All Status</option>
              <option value="OK">OK</option>
              <option value="ATTENTION">Attention</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-950/8 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="border-b bg-[#f7faf8] text-xs uppercase tracking-wide text-[#789087]">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Visited by</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit._id} className="border-b border-emerald-950/6 last:border-0 hover:bg-[#f8fbf9]">
                    <td className="px-4 py-3 font-semibold">{visit.title}</td>
                    <td className="px-4 py-3 text-sm text-[#45675b]">{visit.visitBy?.name || "Unknown"}</td>
                    <td className="px-4 py-3 text-xs text-[#607970]">{formatDate(visit.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{visit.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedVisit(visit)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#e9f5f0] px-2.5 py-1.5 text-xs font-bold text-[#18715d]"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visits.length === 0 && (
            <p className="p-10 text-center text-sm text-[#789087]">No visits recorded for this room yet.</p>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-[#f7faf8]">
              <p className="text-sm text-[#789087]">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} visits
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm font-bold text-[#18715d] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  className="rounded-lg border px-3 py-1.5 text-sm font-bold text-[#18715d] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedVisit && (
        <DetailsDialog visit={selectedVisit} close={() => setSelectedVisit(null)} />
      )}
    </main>
  </>
)
}

function DetailsDialog({ visit, close }: { visit: Visit; close: () => void }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-black/35 sm:place-items-center sm:p-4">
      <div className="relative max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#f9fbf9] p-5 shadow-2xl sm:rounded-3xl">
        <button onClick={close} aria-label="Close visit details" className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl hover:bg-emerald-50">
          <X size={20} />
        </button>
        <p className="text-xs font-bold text-[#18715d]">ROOM {visit.roomId?.roomNo || "—"}</p>
        <h2 className="mt-1 pr-10 text-xl font-bold">{visit.title}</h2>
        <p className="mt-1 text-xs text-[#789087]">{formatDate(visit.createdAt)} · {visit.visitBy?.name || "Unknown user"}</p>
        
        <div className="mt-5 rounded-2xl bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#789087]">Status</p>
          <p className="mt-2">
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{visit.status}</span>
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#789087]">Remarks</p>
          <p className="mt-2 text-sm leading-relaxed text-[#45675b]">{visit.remarks || "No remarks provided."}</p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#789087]">Uploaded photos</p>
          {visit.photos?.length ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {visit.photos.map((photo, index) => (
                <a key={photo.url} href={photo.url} target="_blank" rel="noreferrer">
                  <img src={photo.url} alt={`Visit evidence ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 flex items-center gap-1 text-sm text-[#789087]">
              <ImageIcon size={16} /> No photos attached
            </p>
          )}
        </div>
      </div>
    </div>
  )
}