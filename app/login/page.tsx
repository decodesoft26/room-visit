"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, LockKeyhole, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("")
    const form = new FormData(event.currentTarget)
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) })
    if (!response.ok) { setError("Email or password is incorrect."); setLoading(false); return }
    router.replace("/")
  }
  return <main className="grid min-h-svh place-items-center bg-[#f5f7f5] p-4 text-[#18332b]"><form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-emerald-950/8 bg-white p-6 shadow-xl shadow-emerald-950/5"><div className="grid size-12 place-items-center rounded-2xl bg-[#186f5b] text-white"><Building2 size={23}/></div><p className="mt-5 text-xl font-bold">Welcome back</p><p className="mt-1 text-sm text-[#789087]">Sign in to manage your room visits.</p><div className="mt-6 space-y-4"><label className="block text-xs font-bold text-[#45675b]">Email<div className="input mt-1.5 flex items-center gap-2"><Mail size={16}/><input required type="email" name="email" className="w-full outline-none" placeholder="you@hotel.com"/></div></label><label className="block text-xs font-bold text-[#45675b]">Password<div className="input mt-1.5 flex items-center gap-2"><LockKeyhole size={16}/><input required type="password" name="password" className="w-full outline-none" placeholder="••••••••"/></div></label></div>{error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-[#186f5b] py-3 text-sm font-bold text-white disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button></form></main>
}
