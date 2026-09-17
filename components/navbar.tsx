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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const logout = useMutation({
    mutationFn: () => api("/api/auth/logout", { method: "POST" }),
    onSuccess: () => router.replace("/login"),
    onError: () => toast.error("Sign out failed"),
  })

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:fixed top-0 left-0 right-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-[#186f5b] text-white">
              <Building2 size={18} />
            </span>
            <span className="font-bold text-[#18332b]">
              room<span className="text-[#1f9b7b]">visit</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l pl-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "text-[#18715d]"
                      : "text-[#789087] hover:text-[#18332b]"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {user && (
              <div className="flex items-center gap-3">
                {hotelName && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f0f7f4]">
                    <BuildingIcon size={14} className="text-[#1f9b7b]" />
                    <span className="text-xs font-medium text-[#18332b] truncate max-w-[160px]">{hotelName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f0f7f4]">
                  <span className="text-xs text-[#789087]">{user?.name || "Loading..."}</span>
                </div>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="text-sm font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                >
                  <LogOut className="mr-1 inline" size={16} />
                  {logout.isPending ? "Signing out…" : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Tabbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-white shadow-lg">
        <div className="grid grid-cols-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 transition-colors ${
                pathname === item.href
                  ? "text-[#18715d]"
                  : "text-[#789087]"
              }`}
            >
              <item.icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-2.5 text-[#789087]"
            >
              <Menu size={22} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {user && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="grid size-10 place-items-center rounded-xl text-[#789087] hover:bg-emerald-50">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                    pathname === item.href
                      ? "bg-[#e9f5f0] text-[#18715d]"
                      : "text-[#45675b] hover:bg-[#f5f7f5]"
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="border-t pt-4">
                {hotelName && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f0f7f4] mb-3">
                    <BuildingIcon size={20} className="text-[#1f9b7b]" />
                    <div>
                      <p className="text-xs text-[#789087]">Current Hotel</p>
                      <p className="font-medium text-[#18332b] truncate">{hotelName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f0f7f4] mb-3">
                  <span className="text-[#18332b] font-medium">{user.name}</span>
                </div>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-rose-600 font-bold hover:bg-rose-50 disabled:opacity-50"
                >
                  <LogOut size={20} />
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