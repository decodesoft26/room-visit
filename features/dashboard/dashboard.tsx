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
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init)
  if (!r.ok) {
    const b = await r.json().catch(() => ({}))
    throw new Error(b.error || "Request failed")
  }
  return r.json()
}
export function Dashboard() {
  const router = useRouter(),
    qc = useQueryClient()
  const [hotelId, setHotelId] = useState<string | null>(null),
    [picker, setPicker] = useState(false),
    [roomModal, setRoomModal] = useState(false),
    [userModal, setUserModal] = useState(false),
    [visit, setVisit] = useState<Room | null>(null)
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
    if (session.data?.role === "USER" && session.data.hotelId)
      setHotelId(session.data.hotelId)
    if (session.data?.role === "SUPER_ADMIN" && hotels.isSuccess && !hotelId) {
      const saved = localStorage.getItem(`room-visit:selected-hotel:${session.data.name}`)
      if (saved && hotels.data?.some((hotel) => hotel._id === saved)) setHotelId(saved)
      else setPicker(true)
    }
  }, [session.data, hotels.isSuccess, hotels.data, hotelId])
  function selectHotel(id: string) {
    setHotelId(id)
    if (session.data?.role === "SUPER_ADMIN") localStorage.setItem(`room-visit:selected-hotel:${session.data.name}`, id)
    setPicker(false)
  }
  if (session.isLoading || hotels.isLoading) return (
    <>
      <Navbar user={session.data} />
      <Skeleton />
    </>
  )
  if (!session.data) return <Navbar user={null} />
  const hotel = hotels.data?.find((h) => h._id === hotelId)
  return (
    <>
      <Navbar user={session.data} hotelName={hotel?.name} />
      <main className="min-h-svh bg-[#f5f7f5] text-[#18332b] pt-16 md:pt-20 pb-20 md:pb-0">
        <section className="mx-auto max-w-5xl p-4">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-[#789087]">Malaysia time · MYT</p>
            <h1 className="text-2xl font-bold">Room visits</h1>
            <Link
              href="/history"
              className="mt-1 inline-block text-xs font-bold text-[#18715d]"
            >
              View visit history →
            </Link>
          </div>
          {session.data.role === "SUPER_ADMIN" && (
            <div className="flex gap-2">
              <button
                disabled={!hotelId}
                onClick={() => setUserModal(true)}
                className="rounded-xl border bg-white px-3 text-sm font-bold disabled:opacity-40"
              >
                User
              </button>
              <button
                disabled={!hotelId}
                onClick={() => setRoomModal(true)}
                className="rounded-xl bg-[#186f5b] px-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Plus className="inline" size={16} /> Room
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => session.data.role === "SUPER_ADMIN" && setPicker(true)}
          className="mt-5 flex w-full gap-2 rounded-2xl border bg-white p-4 text-left"
        >
          <MapPin className="text-[#1f9b7b]" />
          <span>
            <small className="block text-[#789087]">Selected hotel</small>
            <b>{hotel?.name || "Choose a hotel"}</b>
          </span>
        </button>
        {rooms.isLoading ? (
          <Skeleton />
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.data?.map((r) => (
              <article
                key={r._id}
                className="relative rounded-2xl border bg-white p-4"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-2xl">{r.roomNo}</b>
                      {r.lastVisit && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          {r.lastVisit.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#789087]">
                      {r.roomType} · {r.roomFloor}
                    </p>
                  </div>
                  <Link
                    href={`/room-history/${r._id}`}
                    className="absolute top-4 right-4 grid size-8 place-items-center rounded-xl text-[#789087] hover:bg-emerald-50 hover:text-[#18715d]"
                    aria-label={`View history for room ${r.roomNo}`}
                  >
                    <Info size={16} />
                  </Link>
                </div>
                <p className="mt-4 flex gap-1 text-xs text-[#789087]">
                  <Clock3 size={14} />
                  {r.lastVisit
                    ? new Intl.DateTimeFormat("en-MY", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Kuala_Lumpur",
                      }).format(new Date(r.lastVisit.createdAt))
                    : "Not visited"}
                </p>
                <button
                  onClick={() => setVisit(r)}
                  className="mt-3 w-full rounded-xl bg-[#e9f5f0] py-2 text-xs font-bold text-[#18715d]"
                >
                  Visit now
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      {picker && (
        <HotelPicker hotels={hotels.data || []} select={selectHotel} />
      )}
      {roomModal && hotelId && (
        <RoomForm hotelId={hotelId} close={() => setRoomModal(false)} />
      )}{" "}
      {userModal && hotelId && (
        <UserForm hotelId={hotelId} hotels={hotels.data || []} close={() => setUserModal(false)} />
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
  const [name, setName] = useState(""),
    [address, setAddress] = useState("")
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
      <h2 className="text-xl font-bold">Select a hotel</h2>
      <p className="text-sm text-[#789087]">
        You must select a hotel to continue.
      </p>
      <div className="mt-4 space-y-2">
        {hotels.map((h) => (
          <button
            key={h._id}
            onClick={() => select(h._id)}
            className="w-full rounded-xl border p-3 text-left"
          >
            <b>{h.name}</b>
            <small className="block text-[#789087]">{h.address}</small>
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          m.mutate()
        }}
        className="mt-5 border-t pt-4"
      >
        <b className="text-sm">Create hotel profile</b>
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
        <button
          disabled={m.isPending}
          className="mt-3 w-full rounded-xl bg-[#186f5b] py-3 text-sm font-bold text-white"
        >
          {m.isPending ? "Creating…" : "Create & select"}
        </button>
      </form>
    </Modal>
  )
}
function RoomForm({ hotelId, close }: { hotelId: string; close: () => void }) {
  const qc = useQueryClient()
  const [roomNo, setNo] = useState(""),
    [roomType, setType] = useState(""),
    [roomFloor, setFloor] = useState("")
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
      <h2 className="text-xl font-bold">Add room</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          m.mutate()
        }}
        className="mt-4 space-y-2"
      >
        {[
          [roomNo, setNo, "Room number"],
          [roomType, setType, "Room type"],
          [roomFloor, setFloor, "Floor"],
        ].map(([v, s, p]) => (
          <input
            key={String(p)}
            required
            value={v as string}
            onChange={(e) => (s as (v: string) => void)(e.target.value)}
            className="input"
            placeholder={p as string}
          />
        ))}
      </form>
      <button
        onClick={() => m.mutate()}
        disabled={m.isPending}
        className="mt-3 w-full rounded-xl bg-[#186f5b] py-3 text-sm font-bold text-white"
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
      <h2 className="text-xl font-bold">Visit room {room.roomNo}</h2>
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
        <label className="flex cursor-pointer gap-2 rounded-xl border border-dashed p-3 text-sm font-bold text-[#287d67]">
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
                  className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-[#18332b] text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          disabled={m.isPending}
          className="w-full rounded-xl bg-[#186f5b] py-3 text-sm font-bold text-white"
        >
          {m.isPending ? "Uploading & saving…" : "Save visit"}
        </button>
      </form>
    </Modal>
  )
}
function UserForm({ hotelId, hotels, close }: { hotelId: string | null; hotels: Hotel[]; close: () => void }) {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [selectedHotelId, setSelectedHotelId] = useState<string>("")
  const mutation = useMutation({
    mutationFn: () =>
      api("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, hotelId: selectedHotelId || hotelId }),
      }),
    onSuccess: () => {
      toast.success("Team user created")
      close()
    },
    onError: (error: Error) => toast.error(error.message),
  })
  return (
    <Modal close={close}>
      <h2 className="pr-10 text-xl font-bold">Create team user</h2>
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
            <label className="block text-xs font-medium text-[#789087] mb-1">Hotel</label>
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
        <button
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-[#186f5b] py-3 text-sm font-bold text-white"
        >
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
    <div className="fixed inset-0 z-20 grid place-items-end bg-black/30 sm:place-items-center">
      <div className="relative w-full max-w-md rounded-t-3xl bg-[#f9fbf9] p-5 sm:rounded-3xl">
        {close && (
          <button
            type="button"
            aria-label="Close dialog"
            onClick={close}
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl text-[#45675b] hover:bg-emerald-50"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
function Skeleton() {
  return <div className="m-5 h-40 animate-pulse rounded-2xl bg-white" />
}
