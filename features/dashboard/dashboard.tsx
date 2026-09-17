"use client"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  Clock3,
  ImagePlus,
  Info,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"

type Hotel = { _id: string; name: string; address: string }
type User = {
  name: string
  role: "SUPER_ADMIN" | "USER"
  hotelId: string | null
}
type Status = "OK" | "ATTENTION" | "URGENT"
type Room = {
  _id: string
  roomNo: string
  roomType: string
  roomFloor: string
  lastVisit: { status: Status; createdAt: string } | null
}

const badgeStyles: Record<Status, string> = {
  OK: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  ATTENTION: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  URGENT: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init)
  if (!r.ok) {
    const b = await r.json().catch(() => ({}))
    throw new Error(b.error || "Request failed")
  }
  return r.json()
}

export function Dashboard() {
  const router = useRouter()
  const qc = useQueryClient()
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [picker, setPicker] = useState(false)
  const [roomModal, setRoomModal] = useState(false)
  const [userModal, setUserModal] = useState(false)
  const [visit, setVisit] = useState<Room | null>(null)
  const [roomSearch, setRoomSearch] = useState("")

  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => api<User>("/api/auth/me"),
  })
  const hotels = useQuery({
    queryKey: ["hotels"],
    queryFn: () => api<Hotel[]>("/api/hotels"),
    enabled: !!session.data,
  })
  const rooms = useQuery({
    queryKey: ["rooms", hotelId],
    queryFn: () => api<Room[]>(`/api/rooms?hotelId=${hotelId}`),
    enabled: !!hotelId,
  })

  useEffect(() => {
    if (session.isError) router.replace("/login")
  }, [session.isError, router])

  useEffect(() => {
    if (session.data?.role === "USER" && session.data.hotelId) {
      setHotelId(session.data.hotelId)
    }
    if (session.data?.role === "SUPER_ADMIN" && hotels.isSuccess && !hotelId) {
      const saved = localStorage.getItem(
        `room-visit:selected-hotel:${session.data.name}`
      )
      if (saved && hotels.data?.some((hotel) => hotel._id === saved))
        setHotelId(saved)
      else setPicker(true)
    }
  }, [session.data, hotels.isSuccess, hotels.data, hotelId])

  function selectHotel(id: string) {
    setHotelId(id)
    if (session.data?.role === "SUPER_ADMIN")
      localStorage.setItem(`room-visit:selected-hotel:${session.data.name}`, id)
    setPicker(false)
  }

  if (session.isLoading || hotels.isLoading)
    return (
      <>
        <Navbar user={session.data} />
        <Skeleton />
      </>
    )

  if (!session.data) return <Navbar user={null} />

  const hotel = hotels.data?.find((h) => h._id === hotelId)
  const totalRooms = rooms.data?.length ?? 0
  const urgentRooms =
    rooms.data?.filter((room) => room.lastVisit?.status === "URGENT").length ??
    0
  const dueAttention =
    rooms.data?.filter((room) => room.lastVisit?.status === "ATTENTION")
      .length ?? 0
  const filteredRooms =
    rooms.data?.filter((room) =>
      room.roomNo.toLowerCase().includes(roomSearch.trim().toLowerCase())
    ) ?? []

  return (
    <>
      <Navbar user={session.data} hotelName={hotel?.name} />
      <main className="min-h-svh bg-transparent pt-3 pb-20 text-[#12322d] md:pt-24 md:pb-12">
        <section className="mx-auto max-w-6xl px-3 md:px-6">
          <header className="soft-card overflow-hidden p-3 sm:p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#6b8c82] uppercase">
                  Malaysia time · MYT
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-[-0.06em] text-[#12322d] md:text-3xl">
                  Room visits dashboard
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      session.data.role === "SUPER_ADMIN" && setPicker(true)
                    }
                    className="secondary-button gap-2"
                  >
                    <MapPin size={16} className="text-[#1f9b7b]" />
                    <span>{hotel?.name || "Choose hotel"}</span>
                  </button>
                  <Link
                    href="/history"
                    className="secondary-button text-[#155c4e]"
                  >
                    View history
                  </Link>
                </div>
              </div>

              {session.data.role === "SUPER_ADMIN" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={!hotelId}
                    onClick={() => setUserModal(true)}
                    className="secondary-button disabled:opacity-40"
                  >
                    Create user
                  </button>
                  <button
                    disabled={!hotelId}
                    onClick={() => setRoomModal(true)}
                    className="primary-button disabled:opacity-40"
                  >
                    <Plus size={16} />
                    Add room
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="mt-4 grid grid-cols-3 gap-2 md:gap-4">
            <div className="metric-card p-3 md:p-4">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase md:text-xs">
                Rooms
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-2xl font-bold tracking-[-0.06em] md:text-3xl">
                  {totalRooms}
                </span>
                <div className="rounded-xl bg-[#eaf7f2] p-1.5 text-[#155c4e] md:p-2">
                  <Building2 size={16} className="md:h-[18px] md:w-[18px]" />
                </div>
              </div>
            </div>

            <div className="metric-card p-3 md:p-4">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase md:text-xs">
                Urgent
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-2xl font-bold tracking-[-0.06em] text-rose-600 md:text-3xl">
                  {urgentRooms}
                </span>
                <div className="rounded-xl bg-rose-50 p-1.5 text-rose-600 md:p-2">
                  <ShieldCheck size={16} className="md:h-[18px] md:w-[18px]" />
                </div>
              </div>
            </div>

            <div className="metric-card p-3 md:p-4">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#6b8c82] uppercase md:text-xs">
                Needs attention
              </p>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-2xl font-bold tracking-[-0.06em] text-amber-600 md:text-3xl">
                  {dueAttention}
                </span>
                <div className="rounded-xl bg-amber-50 p-1.5 text-amber-600 md:p-2">
                  <Sparkles size={16} className="md:h-[18px] md:w-[18px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(18,52,46,0.08)] bg-white/85 px-3 shadow-[0_8px_20px_rgba(17,41,36,0.03)] transition focus-within:border-[#1c7d68] focus-within:ring-4 focus-within:ring-[#1c7d68]/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-[#7b918c]"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search room number"
                className="h-10 w-full bg-transparent text-sm text-[#12322d] outline-none placeholder:text-[#9bafa9]"
              />
            </div>
          </div>

          {rooms.isLoading ? (
            <div className="mt-5">
              <Skeleton />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.length === 0 ? (
                <div className="soft-card col-span-full p-6 text-center text-sm text-[#67857d]">
                  No rooms found for room number "{roomSearch}".
                </div>
              ) : (
                filteredRooms.map((r) => (
                  <article
                    key={r._id}
                    className="soft-card group relative p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(17,38,33,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold tracking-[-0.07em] text-[#12322d]">
                            {r.roomNo}
                          </span>
                          {r.lastVisit && (
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${badgeStyles[r.lastVisit.status]}`}
                            >
                              {r.lastVisit.status}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#718f87]">
                          {r.roomType} · {r.roomFloor}
                        </p>
                      </div>
                      <Link
                        href={`/room-history/${r._id}`}
                        className="grid size-9 place-items-center rounded-2xl bg-[#f4faf7] text-[#1f9b7b] transition group-hover:bg-[#eaf7f2]"
                        aria-label={`View history for room ${r.roomNo}`}
                      >
                        <Info size={16} />
                      </Link>
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#f4faf7] p-3">
                      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#5f7f76] uppercase">
                        <Clock3 size={14} />
                        Last visit
                      </div>
                      <p className="mt-2 text-sm font-medium text-[#12322d]">
                        {r.lastVisit
                          ? new Intl.DateTimeFormat("en-MY", {
                              dateStyle: "medium",
                              timeStyle: "short",
                              timeZone: "Asia/Kuala_Lumpur",
                            }).format(new Date(r.lastVisit.createdAt))
                          : "Not visited yet"}
                      </p>
                    </div>

                    <button
                      onClick={() => setVisit(r)}
                      className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#1c7d68] to-[#145d4f] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(28,125,104,0.22)] transition hover:-translate-y-0.5"
                    >
                      Visit now
                    </button>
                  </article>
                ))
              )}
            </div>
          )}
        </section>

        {picker && (
          <HotelPicker hotels={hotels.data || []} select={selectHotel} />
        )}
        {roomModal && hotelId && (
          <RoomForm hotelId={hotelId} close={() => setRoomModal(false)} />
        )}
        {userModal && hotelId && (
          <UserForm
            hotelId={hotelId}
            hotels={hotels.data || []}
            close={() => setUserModal(false)}
          />
        )}
        {visit && <VisitForm room={visit} close={() => setVisit(null)} />}
      </main>
    </>
  )
}

function HotelPicker({
  hotels,
  select,
}: {
  hotels: Hotel[]
  select: (id: string) => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")

  const m = useMutation({
    mutationFn: () =>
      api<Hotel>("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      }),
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: ["hotels"] })
      toast.success("Hotel profile created")
      select(h._id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Modal>
      <h2 className="text-xl font-bold tracking-[-0.04em] text-[#12322d]">
        Select a hotel
      </h2>
      <p className="mt-1 text-sm text-[#67857d]">
        Choose the property you want to manage.
      </p>
      <div className="mt-4 space-y-2">
        {hotels.map((h) => (
          <button
            key={h._id}
            onClick={() => select(h._id)}
            className="w-full rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#f7faf8] p-3 text-left transition hover:bg-[#edf7f3]"
          >
            <b className="text-[#12322d]">{h.name}</b>
            <small className="mt-1 block text-[#67857d]">{h.address}</small>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          m.mutate()
        }}
        className="mt-5 border-t border-[rgba(18,52,46,0.08)] pt-4"
      >
        <b className="text-sm font-semibold tracking-[0.14em] text-[#67857d] uppercase">
          Create hotel profile
        </b>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input mt-2"
          placeholder="Hotel name"
        />
        <input
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input mt-2"
          placeholder="Address"
        />
        <button disabled={m.isPending} className="primary-button mt-3 w-full">
          {m.isPending ? "Creating…" : "Create & select"}
        </button>
      </form>
    </Modal>
  )
}

function RoomForm({ hotelId, close }: { hotelId: string; close: () => void }) {
  const qc = useQueryClient()
  const [roomNo, setNo] = useState("")
  const [roomType, setType] = useState("")
  const [roomFloor, setFloor] = useState("")

  const m = useMutation({
    mutationFn: () =>
      api("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, roomNo, roomType, roomFloor }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", hotelId] })
      toast.success("Room created")
      close()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Modal close={close}>
      <h2 className="text-xl font-bold tracking-[-0.04em] text-[#12322d]">
        Add room
      </h2>
      <div className="mt-4 space-y-2">
        <input
          required
          value={roomNo}
          onChange={(e) => setNo(e.target.value)}
          className="input"
          placeholder="Room number"
        />
        <input
          required
          value={roomType}
          onChange={(e) => setType(e.target.value)}
          className="input"
          placeholder="Room type"
        />
        <input
          required
          value={roomFloor}
          onChange={(e) => setFloor(e.target.value)}
          className="input"
          placeholder="Floor"
        />
      </div>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="primary-button mt-4 w-full"
      >
        {m.isPending ? "Saving…" : "Create room"}
      </button>
    </Modal>
  )
}

function VisitForm({ room, close }: { room: Room; close: () => void }) {
  const qc = useQueryClient()
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])

  const m = useMutation({
    mutationFn: (f: FormData) =>
      api("/api/visits", { method: "POST", body: f }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] })
      toast.success("Visit saved")
      close()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Modal close={close}>
      <h2 className="text-xl font-bold tracking-[-0.04em] text-[#12322d]">
        Visit room {room.roomNo}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const f = new FormData(e.currentTarget)
          f.set("roomId", room._id)
          photos.forEach(({ file }) => f.append("photos", file))
          m.mutate(f)
        }}
        className="mt-4 space-y-2"
      >
        <input
          required
          name="title"
          className="input"
          placeholder="Visit title"
        />
        <select name="status" className="input">
          <option value="OK">OK — all clear</option>
          <option value="ATTENTION">Attention needed</option>
          <option value="URGENT">Urgent issue</option>
        </select>
        <textarea
          name="remarks"
          className="input min-h-24 py-3"
          placeholder="Remarks"
        />
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#bfe1d6] bg-[#f3faf7] p-3 text-sm font-semibold text-[#1d7d67]">
          <ImagePlus size={18} />
          {photos.length ? `${photos.length} photo(s) selected` : "Add photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const additions = Array.from(e.target.files || []).slice(
                0,
                6 - photos.length
              )
              setPhotos((current) => [
                ...current,
                ...additions.map((file) => ({
                  file,
                  url: URL.createObjectURL(file),
                })),
              ])
              e.currentTarget.value = ""
            }}
          />
        </label>
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <div key={photo.url} className="relative aspect-square">
                <img
                  src={photo.url}
                  alt={`Selected photo ${index + 1}`}
                  className="size-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => {
                    URL.revokeObjectURL(photo.url)
                    setPhotos((current) =>
                      current.filter((item) => item.url !== photo.url)
                    )
                  }}
                  className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-[#12322d] text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button disabled={m.isPending} className="primary-button w-full">
          {m.isPending ? "Uploading & saving…" : "Save visit"}
        </button>
      </form>
    </Modal>
  )
}

function UserForm({
  hotelId,
  hotels,
  close,
}: {
  hotelId: string | null
  hotels: Hotel[]
  close: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedHotelId, setSelectedHotelId] = useState<string>("")

  const mutation = useMutation({
    mutationFn: () =>
      api("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          hotelId: selectedHotelId || hotelId,
        }),
      }),
    onSuccess: () => {
      toast.success("Team user created")
      close()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Modal close={close}>
      <h2 className="pr-10 text-xl font-bold tracking-[-0.04em] text-[#12322d]">
        Create team user
      </h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
        className="mt-4 space-y-2"
      >
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="input"
          placeholder="Full name"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input"
          placeholder="Email address"
        />
        <input
          required
          minLength={8}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input"
          placeholder="Temporary password"
        />
        {hotels.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-semibold tracking-[0.14em] text-[#67857d] uppercase">
              Hotel
            </label>
            <select
              required
              value={selectedHotelId}
              onChange={(event) => setSelectedHotelId(event.target.value)}
              className="input"
            >
              <option value="">Select hotel</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button disabled={mutation.isPending} className="primary-button w-full">
          {mutation.isPending ? "Creating…" : "Create user"}
        </button>
      </form>
    </Modal>
  )
}

function Modal({
  children,
  close,
}: {
  children: React.ReactNode
  close?: () => void
}) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-end bg-[#0c1c1a]/40 p-2 sm:place-items-center sm:p-6">
      <div className="relative w-full max-w-md rounded-[30px] border border-[rgba(18,52,46,0.08)] bg-[#fbfdfc] p-5 shadow-[0_32px_60px_rgba(15,33,29,0.12)] sm:rounded-[28px]">
        {close && (
          <button
            type="button"
            aria-label="Close dialog"
            onClick={close}
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl bg-[#f2f8f5] text-[#45675b]"
          >
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="soft-card h-40 animate-pulse bg-gradient-to-r from-[#eff5f3] via-white to-[#eff5f3]" />
  )
}
