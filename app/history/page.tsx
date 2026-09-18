"use client"

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type SyntheticEvent,
} from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Menu,
  Search,
  X,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"

const FALLBACK_IMAGE = "/placeholder-room-visit.svg"
const MAX_REMARK_LENGTH = 180

const statusClasses: Record<string, string> = {
  URGENT: "bg-rose-50 text-rose-700",
  ATTENTION: "bg-amber-50 text-amber-700",
  OK: "bg-emerald-50 text-emerald-700",
  default: "bg-[#edf7f4] text-[#1f6f5e]",
}

type Session = {
  name: string
  role: "SUPER_ADMIN" | "USER"
  hotelId: string | null
}
type Hotel = { _id: string; name: string }
type RoomSummary = {
  _id: string
  roomNo: string
  roomType: string
  roomFloor: string
}
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

function getStatusClass(status: string) {
  return statusClasses[status] || statusClasses.default
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
}

function withFallbackImage(event: SyntheticEvent<HTMLImageElement>) {
  const target = event.currentTarget
  const fallbackUrl = new URL(FALLBACK_IMAGE, window.location.origin).toString()
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl
  }
}

function ExpandableRemarks({ remarks }: { remarks: string }) {
  const trimmed = remarks?.trim() || "No remarks provided."
  const isLong = trimmed.length > MAX_REMARK_LENGTH
  const [expanded, setExpanded] = useState(false)

  const text =
    expanded || !isLong
      ? trimmed
      : `${trimmed.slice(0, MAX_REMARK_LENGTH).trim()}...`

  return (
    <p className="mt-2 text-sm leading-relaxed text-[#45675b]">
      {text}
      {isLong && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setExpanded((value) => !value)
          }}
          className="ml-1 font-semibold text-[#0d9488] hover:text-[#0f766e]"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </p>
  )
}

function VisitCard({ visit, onOpen }: { visit: Visit; onOpen: () => void }) {
  const photos = visit.photos?.length ? visit.photos : [{ url: FALLBACK_IMAGE }]
  const primaryPhoto = photos[0]?.url || FALLBACK_IMAGE
  const extraPhotos = photos.slice(1, 4)

  return (
    <article
      onClick={onOpen}
      className="w-full cursor-pointer overflow-hidden rounded-[28px] border border-[rgba(18,52,46,0.08)] bg-white shadow-[0_16px_40px_rgba(17,41,36,0.04)] transition hover:shadow-[0_18px_44px_rgba(17,41,36,0.06)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#0d9488] via-[#2ca88f] to-[#dff7f1] text-sm font-bold text-white shadow-sm">
            {getInitials(visit.visitBy?.name || "Unknown user")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#12322d]">
              {visit.visitBy?.name || "Unknown user"}
            </p>
            <p className="text-[11px] text-[#67857d]">
              {formatDate(visit.createdAt)} · Room {visit.roomId?.roomNo || "—"}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(visit.status)}`}
        >
          {visit.status}
        </span>
      </div>

      <div className="px-4 pb-3">
        <h2 className="text-xl font-bold tracking-[-0.04em] text-[#12322d]">
          {visit.title}
        </h2>
        <ExpandableRemarks remarks={visit.remarks} />
      </div>

      <div className="px-4 pb-3">
        <img
          src={primaryPhoto}
          alt={visit.title}
          className="h-72 w-full rounded-[22px] object-cover"
          onClick={(event) => {
            event.stopPropagation()
            onOpen()
          }}
          onError={withFallbackImage}
        />

        {extraPhotos.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {extraPhotos.map((photo, index) => (
              <img
                key={`${photo.url}-${index}`}
                src={photo.url || FALLBACK_IMAGE}
                alt={`${visit.title} photo ${index + 1}`}
                className="h-20 w-full rounded-2xl object-cover"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen()
                }}
                onError={withFallbackImage}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[rgba(18,52,46,0.07)] px-4 py-3">
        <div className="flex items-center gap-1.5 text-[12px] text-[#567167]">
          <span>
            {photos.length} photo{photos.length > 1 ? "s" : ""}
          </span>
        </div>
        <span className="rounded-full bg-[#eef9f4] px-2.5 py-1 text-[10px] font-semibold text-[#155c4e]">
          Open album
        </span>
      </div>
    </article>
  )
}

function HistoryPageSkeleton() {
  return (
    <>
      <Navbar user={undefined} />
      <main className="min-h-svh bg-[#f4f8f6] p-5 pt-20 md:pt-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="soft-card h-64 animate-pulse bg-gradient-to-r from-[#eff5f3] via-white to-[#eff5f3]" />
        </div>
      </main>
    </>
  )
}

function HistoryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Visit | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || ""
  )
  const [roomTypeFilter, setRoomTypeFilter] = useState(
    searchParams.get("roomType") || ""
  )
  const [selectedRoomNo, setSelectedRoomNo] = useState(
    searchParams.get("roomNo") || ""
  )
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sort") || "newest"
  )
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || ""
  )
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => api<Session>("/api/auth/me"),
  })
  const hotels = useQuery({
    queryKey: ["hotels"],
    queryFn: () => api<Hotel[]>("/api/hotels"),
    enabled: !!session.data,
  })

  const roomsQuery = useQuery({
    queryKey: ["rooms", hotelId],
    queryFn: () => api<RoomSummary[]>(`/api/rooms?hotelId=${hotelId}`),
    enabled: !!hotelId,
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

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, roomTypeFilter, selectedRoomNo, sortOrder])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set("search", search.trim())
    if (statusFilter) params.set("status", statusFilter)
    if (roomTypeFilter) params.set("roomType", roomTypeFilter)
    if (selectedRoomNo) params.set("roomNo", selectedRoomNo)
    if (sortOrder !== "newest") params.set("sort", sortOrder)
    const nextUrl = params.toString()
      ? `/history?${params.toString()}`
      : "/history"
    router.replace(nextUrl, { scroll: false })
  }, [search, statusFilter, roomTypeFilter, selectedRoomNo, sortOrder, router])

  const visitsQuery = useQuery({
    queryKey: [
      "visits",
      hotelId,
      page,
      debouncedSearch,
      statusFilter,
      roomTypeFilter,
      selectedRoomNo,
      sortOrder,
    ],
    queryFn: () =>
      api<{ visits: Visit[]; pagination: Pagination }>(
        `/api/visits?hotelId=${hotelId}&page=${page}&limit=10&search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&roomType=${encodeURIComponent(roomTypeFilter)}&roomNo=${encodeURIComponent(selectedRoomNo)}&sort=${sortOrder}`
      ),
    enabled: !!hotelId,
  })

  const roomOptions = useMemo(() => {
    return roomsQuery.data
      ? Array.from(
          new Map(roomsQuery.data.map((room) => [room.roomNo, room])).values()
        ).sort((a, b) =>
          a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true })
        )
      : []
  }, [roomsQuery.data])

  const roomTypes = useMemo(() => {
    const values =
      roomsQuery.data?.map((room) => room.roomType).filter(Boolean) || []
    return Array.from(new Set(values)).sort()
  }, [roomsQuery.data])

  if (session.isLoading || hotels.isLoading || roomsQuery.isLoading) {
    return (
      <>
        <Navbar user={session.data} />
        <main className="min-h-svh bg-[#f4f8f6] p-5 pt-20 md:pt-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="soft-card h-64 animate-pulse bg-gradient-to-r from-[#eff5f3] via-white to-[#eff5f3]" />
          </div>
        </main>
      </>
    )
  }

  const visits = visitsQuery.data?.visits || []
  const pagination = visitsQuery.data?.pagination
  const hotel = hotels.data?.find((h) => h._id === hotelId)
  const isPostsLoading = visitsQuery.isLoading || visitsQuery.isFetching
  const hasActiveDialog = Boolean(selected)

  return (
    <>
      <Navbar
        user={session.data}
        hotelName={hotel?.name}
        hideMobileTabs={hasActiveDialog || mobileFiltersOpen}
      />
      <main className="min-h-svh overflow-y-auto bg-[#f4f8f6] pt-4 pb-20 text-[#12322d] md:h-[calc(100vh-6.5rem)] md:overflow-hidden md:pt-28 md:pb-4">
        <div className="mx-auto max-w-6xl px-3 md:h-full md:px-6">
          <div className="grid gap-6 md:h-full xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="hidden h-auto xl:sticky xl:top-24 xl:block xl:h-full xl:overflow-y-auto">
              <HistoryFilters
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                roomTypeFilter={roomTypeFilter}
                setRoomTypeFilter={setRoomTypeFilter}
                selectedRoomNo={selectedRoomNo}
                setSelectedRoomNo={setSelectedRoomNo}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                roomTypes={roomTypes}
                roomOptions={roomOptions}
                onClear={() => {
                  setSearch("")
                  setStatusFilter("")
                  setRoomTypeFilter("")
                  setSelectedRoomNo("")
                  setSortOrder("newest")
                  setPage(1)
                }}
              />
            </aside>

            <section className="min-w-0 md:h-full">
              <div className="mb-4 flex flex-col gap-3 rounded-[28px] border border-[rgba(18,52,46,0.08)] bg-white px-4 py-4 shadow-[0_16px_40px_rgba(17,41,36,0.04)] md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-[#6b8c82] uppercase">
                    Visit log
                  </p>
                  <h2 className="mt-1 text-2xl font-bold tracking-[-0.06em] text-[#12322d] md:text-3xl">
                    History overview
                  </h2>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-[#eef9f4] px-3 py-1.5 text-sm font-medium text-[#155c4e]">
                    {hotel?.name || "Hotel selected"}
                  </div>
                  <button
                    type="button"
                    aria-label="Open filters"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="grid size-10 place-items-center rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#f4faf7] text-[#155c4e] md:hidden"
                  >
                    <Menu size={18} />
                  </button>
                </div>
              </div>

              <div className="history-scrollbar overflow-visible pr-1 md:h-[calc(100vh-220px)] md:overflow-y-auto">
                {isPostsLoading &&
                (!visits.length || visitsQuery.isFetching) ? (
                  <div className="space-y-4 pb-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="animate-pulse overflow-hidden rounded-[28px] border border-[rgba(18,52,46,0.08)] bg-white shadow-[0_16px_40px_rgba(17,41,36,0.04)]"
                      >
                        <div className="flex items-center gap-3 px-4 py-4">
                          <div className="h-10 w-10 rounded-full bg-[#edf4f2]" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-28 rounded-full bg-[#edf4f2]" />
                            <div className="h-2.5 w-36 rounded-full bg-[#edf4f2]" />
                          </div>
                          <div className="h-6 w-16 rounded-full bg-[#edf4f2]" />
                        </div>
                        <div className="space-y-3 px-4 pb-3">
                          <div className="h-5 w-3/5 rounded-full bg-[#edf4f2]" />
                          <div className="h-3 w-full rounded-full bg-[#edf4f2]" />
                          <div className="h-3 w-4/5 rounded-full bg-[#edf4f2]" />
                        </div>
                        <div className="px-4 pb-4">
                          <div className="h-72 w-full rounded-[22px] bg-[#edf4f2]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hotelId && visits.length === 0 ? (
                  <div className="soft-card p-8 text-center text-sm text-[#67857d] md:p-12">
                    No visits recorded for{" "}
                    {selectedRoomNo ? `room ${selectedRoomNo}` : "this filter"}{" "}
                    yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-2">
                    {visits.map((visit) => (
                      <VisitCard
                        key={visit._id}
                        visit={visit}
                        onOpen={() => setSelected(visit)}
                      />
                    ))}
                  </div>
                )}

                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-[rgba(18,52,46,0.08)] bg-white px-3 py-2.5 shadow-[0_8px_16px_rgba(17,41,36,0.02)] md:px-4 md:py-3">
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
          </div>
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-40 bg-[#0d1f1b]/35 md:hidden">
            <div
              className="absolute inset-0"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute top-0 right-0 h-full w-[86%] max-w-sm overflow-y-auto bg-[#f4f8f6] p-3 shadow-[0_20px_50px_rgba(15,33,29,0.22)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#12322d]">Filters</h3>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="grid size-8 place-items-center rounded-xl bg-white text-[#45675b]"
                >
                  <X size={16} />
                </button>
              </div>
              <HistoryFilters
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                roomTypeFilter={roomTypeFilter}
                setRoomTypeFilter={setRoomTypeFilter}
                selectedRoomNo={selectedRoomNo}
                setSelectedRoomNo={setSelectedRoomNo}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                roomTypes={roomTypes}
                roomOptions={roomOptions}
                onClear={() => {
                  setSearch("")
                  setStatusFilter("")
                  setRoomTypeFilter("")
                  setSelectedRoomNo("")
                  setSortOrder("newest")
                  setPage(1)
                  setMobileFiltersOpen(false)
                }}
                onClose={() => setMobileFiltersOpen(false)}
              />
            </div>
          </div>
        )}

        {selected && (
          <DetailsDialog visit={selected} close={() => setSelected(null)} />
        )}
      </main>
    </>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryPageSkeleton />}>
      <HistoryPageContent />
    </Suspense>
  )
}

function HistoryFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  roomTypeFilter,
  setRoomTypeFilter,
  selectedRoomNo,
  setSelectedRoomNo,
  sortOrder,
  setSortOrder,
  roomTypes,
  roomOptions,
  onClear,
  onClose,
}: {
  search: string
  setSearch: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  roomTypeFilter: string
  setRoomTypeFilter: (value: string) => void
  selectedRoomNo: string
  setSelectedRoomNo: (value: string) => void
  sortOrder: string
  setSortOrder: (value: string) => void
  roomTypes: string[]
  roomOptions: Array<{ _id: string; roomNo: string }>
  onClear: () => void
  onClose?: () => void
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(18,52,46,0.08)] bg-white p-3 shadow-[0_12px_28px_rgba(17,41,36,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.18em] text-[#6b8c82] uppercase">
            Filters
          </p>
          <h1 className="mt-1 text-lg font-bold tracking-[-0.05em] text-[#12322d]">
            History
          </h1>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl bg-[#eef9f4] px-2 py-1 text-[10px] font-semibold text-[#155c4e]"
        >
          Clear
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <div className="rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#f7faf9] px-2.5 py-2">
          <label className="mb-1.5 block text-[9px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase">
            Search
          </label>
          <div className="flex items-center gap-2 rounded-xl bg-white px-2.5">
            <Search className="text-[#7b918c]" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Room no or title"
              className="h-9 w-full bg-transparent text-sm text-[#12322d] outline-none placeholder:text-[#9bafa9]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase">
            Status
          </label>
          <div className="flex items-center gap-1 rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#fafcfb] px-2.5">
            <Filter className="text-[#7b918c]" size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full appearance-none bg-transparent px-2 text-sm text-[#12322d] outline-none"
            >
              <option value="">All status</option>
              <option value="OK">OK</option>
              <option value="ATTENTION">Attention</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase">
            Room type
          </label>
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="h-10 w-full rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#fafcfb] px-2.5 text-sm text-[#12322d] outline-none"
          >
            <option value="">All room types</option>
            {roomTypes.map((roomType) => (
              <option key={roomType} value={roomType}>
                {roomType}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase">
            Room number
          </label>
          <select
            value={selectedRoomNo}
            onChange={(e) => setSelectedRoomNo(e.target.value)}
            className="h-10 w-full rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#fafcfb] px-2.5 text-sm text-[#12322d] outline-none"
          >
            <option value="">All rooms</option>
            {roomOptions.map((room) => (
              <option key={room._id} value={room.roomNo}>
                {room.roomNo}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[9px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase">
            Sort
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-10 w-full rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#fafcfb] px-2.5 text-sm text-[#12322d] outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-1 h-10 w-full rounded-2xl bg-[#155c4e] text-sm font-semibold text-white"
          >
            Apply filters
          </button>
        )}
      </div>
    </div>
  )
}

function DetailsDialog({ visit, close }: { visit: Visit; close: () => void }) {
  const photos = visit.photos?.length ? visit.photos : [{ url: FALLBACK_IMAGE }]
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [visit._id])

  return (
    <div className="fixed inset-0 z-[70] bg-[#0d1f1b]/40 p-3 sm:p-5 md:pt-24 md:pb-8">
      <div className="mx-auto flex h-full max-w-3xl items-center justify-center">
        <div className="relative max-h-[calc(100vh-8rem)] w-full overflow-hidden rounded-[30px] bg-[#fbfdfc] shadow-[0_30px_80px_rgba(15,33,29,0.2)]">
          <button
            onClick={close}
            aria-label="Close visit details"
            className="absolute top-4 right-4 z-20 grid size-9 place-items-center rounded-xl bg-[#f3f8f6] text-[#45675b]"
          >
            <X size={18} />
          </button>

          <div className="thin-scrollbar max-h-[calc(100vh-8rem)] overflow-y-auto p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#1f9b7b] uppercase">
                  Room {visit.roomId?.roomNo || "—"}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.06em] text-[#12322d]">
                  {visit.title}
                </h2>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClass(visit.status)}`}
              >
                {visit.status}
              </span>
            </div>

            <p className="mt-2 text-xs text-[#67857d]">
              {formatDate(visit.createdAt)} ·{" "}
              {visit.visitBy?.name || "Unknown user"}
            </p>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-[rgba(18,52,46,0.05)] bg-[#f4faf7]">
              <img
                src={photos[activeIndex]?.url || FALLBACK_IMAGE}
                alt={visit.title}
                className="h-72 w-full object-cover sm:h-80"
                onError={withFallbackImage}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo, index) => (
                <button
                  key={`${photo.url}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`overflow-hidden rounded-2xl border ${activeIndex === index ? "border-[#1f9b7b] ring-2 ring-[#1f9b7b]/20" : "border-[rgba(18,52,46,0.08)]"}`}
                >
                  <img
                    src={photo.url || FALLBACK_IMAGE}
                    alt={`Visit evidence ${index + 1}`}
                    className="aspect-square w-full object-cover"
                    onError={withFallbackImage}
                  />
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#f4faf7] p-4">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[#67857d] uppercase">
                Remarks
              </p>
              <ExpandableRemarks remarks={visit.remarks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
