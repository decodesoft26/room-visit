"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"

type Session = {
  name: string
  role: "SUPER_ADMIN" | "USER"
  hotelId: string | null
}
type Hotel = { _id: string; name: string }
type Visit = {
  _id: string
  title: string
  status: string
  remarks: string
  createdAt: string
  roomId: { roomNo: string; roomType: string }
  visitBy: { name: string }
  photos: { url: string }[]
}
type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

async function api<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Request failed")
  return response.json()
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(date))
}

export default function HistoryPage() {
  const router = useRouter()
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Visit | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => api<Session>("/api/auth/me"),
  })
  const hotels = useQuery({
    queryKey: ["hotels"],
    queryFn: () => api<Hotel[]>("/api/hotels"),
    enabled: !!session.data,
  })

  useEffect(() => {
    if (session.isError) router.replace("/login")
    if (session.data?.role === "USER") setHotelId(session.data.hotelId)
    if (session.data?.role === "SUPER_ADMIN" && hotels.data) {
      const saved = localStorage.getItem(
        `room-visit:selected-hotel:${session.data.name}`
      )
      if (saved) setHotelId(saved)
    }
  }, [session.data, session.isError, hotels.data, router])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const visitsQuery = useQuery({
    queryKey: ["visits", hotelId, page, debouncedSearch, statusFilter],
    queryFn: () =>
      api<{ visits: Visit[]; pagination: Pagination }>(
        `/api/visits?hotelId=${hotelId}&page=${page}&limit=10&search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}`
      ),
    enabled: !!hotelId,
  })

  if (session.isLoading || hotels.isLoading || visitsQuery.isLoading) {
    return (
      <>
        <Navbar user={session.data} />
        <main className="min-h-svh p-5 pt-20 md:pt-28">
          <div className="mx-auto max-w-6xl">
            <div className="soft-card h-64 animate-pulse bg-gradient-to-r from-[#eff5f3] via-white to-[#eff5f3]" />
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
      <main className="min-h-svh pt-3 pb-20 text-[#12322d] md:pt-28 md:pb-12">
        <section className="mx-auto max-w-6xl px-3 md:px-6">
          <div className="soft-card p-3 sm:p-4 md:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#6b8c82] uppercase">
                  Visit log
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-[-0.06em] text-[#12322d] md:text-3xl">
                  History overview
                </h1>
              </div>
              <div className="rounded-2xl bg-[#eef9f4] px-3 py-1.5 text-sm font-medium text-[#155c4e]">
                {hotel?.name || "Hotel selected"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[rgba(18,52,46,0.08)] bg-white/85 px-3 shadow-[0_8px_20px_rgba(17,41,36,0.03)] transition focus-within:border-[#1c7d68] focus-within:ring-4 focus-within:ring-[#1c7d68]/10">
              <Search className="shrink-0 text-[#7b918c]" size={15} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, remarks, room..."
                className="h-10 w-full bg-transparent text-sm text-[#12322d] outline-none placeholder:text-[#9bafa9]"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(18,52,46,0.08)] bg-white/85 px-3 shadow-[0_8px_20px_rgba(17,41,36,0.03)] transition focus-within:border-[#1c7d68] focus-within:ring-4 focus-within:ring-[#1c7d68]/10 md:w-[220px]">
              <Filter className="shrink-0 text-[#7b918c]" size={15} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full appearance-none bg-transparent pr-2 text-sm text-[#12322d] outline-none"
              >
                <option value="">All status</option>
                <option value="OK">OK</option>
                <option value="ATTENTION">Attention</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="soft-card mt-4 overflow-hidden">
            <div className="md:hidden">
              <div className="space-y-3 p-3">
                {visits.map((visit) => (
                  <button
                    key={visit._id}
                    type="button"
                    onClick={() => setSelected(visit)}
                    className="w-full rounded-2xl border border-[rgba(18,52,46,0.06)] bg-[#f9fbfa] p-3 text-left shadow-[0_8px_18px_rgba(17,41,36,0.02)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#12322d]">
                          {visit.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#67857d]">
                          {visit.roomId?.roomNo || "—"} ·{" "}
                          {formatDate(visit.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${visit.status === "URGENT" ? "bg-rose-50 text-rose-700" : visit.status === "ATTENTION" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {visit.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#567167]">
                      <span className="truncate">
                        by {visit.visitBy?.name || "Unknown"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#155c4e]">
                        View <Eye size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-[rgba(18,52,46,0.08)] bg-[#f6faf8] text-[10px] tracking-[0.18em] text-[#67857d] uppercase">
                  <tr>
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Room</th>
                    <th className="px-3 py-3">Timestamp</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => (
                    <tr
                      key={visit._id}
                      className="border-b border-[rgba(18,52,46,0.06)] last:border-0 hover:bg-[#f8fbf9]"
                    >
                      <td className="px-3 py-3 font-semibold text-[#12322d]">
                        {visit.title}
                        <span className="mt-1 block text-[11px] font-normal text-[#729088]">
                          by {visit.visitBy?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#12322d]">
                        {visit.roomId?.roomNo || "—"}
                      </td>
                      <td className="px-3 py-3 text-[11px] text-[#5f7f76]">
                        {formatDate(visit.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${visit.status === "URGENT" ? "bg-rose-50 text-rose-700" : visit.status === "ATTENTION" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                        >
                          {visit.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => setSelected(visit)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#eaf7f2] px-3 py-2 text-[11px] font-semibold text-[#155c4e]"
                        >
                          <Eye size={13} /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hotelId && visits.length === 0 && (
              <p className="p-8 text-center text-sm text-[#67857d] md:p-10">
                No visits recorded for this hotel yet.
              </p>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[rgba(18,52,46,0.08)] bg-[#f8fbfa] px-3 py-2.5 md:px-4 md:py-3">
                <p className="text-xs text-[#67857d] md:text-sm">
                  Page {pagination.page} of {pagination.totalPages} ·{" "}
                  {pagination.total} visits
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="rounded-xl border border-[rgba(18,52,46,0.08)] bg-white px-2.5 py-1.5 text-sm font-semibold text-[#155c4e] disabled:opacity-40 md:px-3"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="rounded-xl border border-[rgba(18,52,46,0.08)] bg-white px-2.5 py-1.5 text-sm font-semibold text-[#155c4e] disabled:opacity-40 md:px-3"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {selected && (
          <DetailsDialog visit={selected} close={() => setSelected(null)} />
        )}
      </main>
    </>
  )
}

function DetailsDialog({ visit, close }: { visit: Visit; close: () => void }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-[#0d1f1b]/40 sm:place-items-center sm:p-4">
      <div className="relative max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-[#fbfdfc] p-5 shadow-[0_30px_80px_rgba(15,33,29,0.2)] sm:rounded-[30px]">
        <button
          onClick={close}
          aria-label="Close visit details"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl bg-[#f3f8f6] text-[#45675b]"
        >
          <X size={18} />
        </button>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-[#1f9b7b] uppercase">
          Room {visit.roomId?.roomNo || "—"}
        </p>
        <h2 className="mt-2 pr-10 text-2xl font-bold tracking-[-0.06em] text-[#12322d]">
          {visit.title}
        </h2>
        <p className="mt-2 text-xs text-[#67857d]">
          {formatDate(visit.createdAt)} ·{" "}
          {visit.visitBy?.name || "Unknown user"}
        </p>

        <div className="mt-5 rounded-2xl bg-[#f4faf7] p-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#67857d] uppercase">
            Remarks
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#45675b]">
            {visit.remarks || "No remarks provided."}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#67857d] uppercase">
            Uploaded photos
          </p>
          {visit.photos?.length ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {visit.photos.map((photo, index) => (
                <a
                  key={photo.url}
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={photo.url}
                    alt={`Visit evidence ${index + 1}`}
                    className="aspect-square w-full rounded-2xl object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm text-[#67857d]">
              <ImageIcon size={16} /> No photos attached
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
