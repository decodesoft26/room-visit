"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, History, LayoutDashboard, LogOut, Menu, X, Building as BuildingIcon } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type User = {
  name: string
  role: "SUPER_ADMIN" | "USER"
  hotelId: string | null
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init)
  if (!r.ok) {
    const b = await r.json().catch(() => ({}))
    throw new Error(b.error || "Request failed")
  }
  return r.json()
}

const navItems = [
  { href: "/", label: "Rooms", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
]

export function Navbar({ user, hotelName }: { user: User | null | undefined; hotelName?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const logout = useMutation({
    mutationFn: () => api("/api/auth/logout", { method: "POST" }),
    onSuccess: () => router.replace("/login"),
    onError: () => toast.error("Sign out failed"),
  })

  return (
    <>
      <nav className="hidden md:fixed md:top-0 md:left-0 md:right-0 md:z-50 md:block">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="flex items-center justify-between rounded-[26px] border border-[rgba(18,52,46,0.08)] bg-white/75 px-4 py-3 shadow-[0_18px_40px_rgba(17,38,33,0.08)] backdrop-blur-xl">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#1c7d68] to-[#155c4e] text-white shadow-[0_12px_24px_rgba(28,125,104,0.25)]">
                <Building2 size={18} />
              </span>
              <span className="text-lg font-bold tracking-[-0.04em] text-[#12322d]">
                room<span className="text-[#1f9b7b]">visit</span>
              </span>
            </Link>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 rounded-full border border-[rgba(18,52,46,0.08)] bg-[#f5faf7] p-1.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                      pathname === item.href
                        ? "bg-white text-[#155c4e] shadow-sm"
                        : "text-[#67857d] hover:text-[#12322d]"
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {user && (
                <div className="flex items-center gap-3">
                  {hotelName && (
                    <div className="hidden xl:flex items-center gap-2 rounded-full border border-[rgba(18,52,46,0.08)] bg-[#f4faf7] px-3 py-2">
                      <BuildingIcon size={14} className="text-[#1f9b7b]" />
                      <span className="max-w-[180px] truncate text-xs font-medium text-[#12322d]">{hotelName}</span>
                    </div>
                  )}
                  <div className="rounded-full border border-[rgba(18,52,46,0.08)] bg-[#f4faf7] px-3 py-2 text-xs font-medium text-[#45675b]">
                    {user.name}
                  </div>
                  <button
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(222,76,76,0.12)] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {logout.isPending ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[28px] border border-[rgba(18,52,46,0.08)] bg-white/85 p-2 shadow-[0_28px_50px_rgba(15,33,29,0.15)] backdrop-blur-2xl md:hidden">
        <div className="grid grid-cols-3 gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-[22px] px-2 py-2.5 transition-all ${
                pathname === item.href
                  ? "bg-[#eaf7f2] text-[#155c4e] shadow-sm"
                  : "text-[#6d8a83]"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 rounded-[22px] px-2 py-2.5 text-[#6d8a83]"
            >
              <Menu size={20} />
              <span className="text-[10px] font-semibold">More</span>
            </button>
          )}
        </div>
      </nav>

      {user && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-[#0d1f1b]/35" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white p-4 shadow-[0_-18px_40px_rgba(15,33,29,0.12)] animate-slide-up">
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-lg font-bold text-[#12322d]">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="grid size-9 place-items-center rounded-xl bg-[#f3f8f6] text-[#45675b]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 pb-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium ${
                    pathname === item.href
                      ? "bg-[#eaf7f2] text-[#155c4e]"
                      : "text-[#45675b] hover:bg-[#f5faf7]"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="space-y-2 border-t border-[rgba(18,52,46,0.08)] pt-3">
                {hotelName && (
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f4faf7] px-4 py-3">
                    <BuildingIcon size={18} className="text-[#1f9b7b]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[#789087]">Current hotel</p>
                      <p className="font-medium text-[#12322d]">{hotelName}</p>
                    </div>
                  </div>
                )}
                <div className="rounded-2xl bg-[#f4faf7] px-4 py-3 text-sm font-medium text-[#12322d]">{user.name}</div>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
                >
                  <LogOut size={18} />
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}