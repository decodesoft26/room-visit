"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react"

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

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(28,125,104,0.18),_transparent_20%),linear-gradient(180deg,#edf7f3_0%,#f9fbfa_100%)] p-4 text-[#12322d]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[rgba(18,52,46,0.08)] bg-white/80 shadow-[0_28px_60px_rgba(15,33,29,0.08)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-gradient-to-br from-[#153f39] via-[#1a5d52] to-[#1c7d68] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/80">Operations</p>
              <p className="text-2xl font-bold tracking-[-0.06em]">room<span className="text-emerald-200">visit</span></p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-emerald-50">
              <Sparkles size={15} />
              Smarter hotel monitoring
            </div>
            <div>
              <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.06em]">Keep every room inspection clear, fast and accountable.</h1>
              <p className="mt-4 max-w-sm text-sm text-emerald-50/80">Track visits, review evidence, and respond to issues before they become guest complaints.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/75">Coverage</p>
              <p className="mt-2 text-2xl font-bold">24/7</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/75">Security</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold"><ShieldCheck size={18} /> Safe</p>
            </div>
          </div>
        </section>

        <section className="p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#1c7d68] to-[#155c4e] text-white shadow-[0_12px_24px_rgba(28,125,104,0.25)]">
                <Building2 size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#789087]">Operations</p>
                <p className="text-xl font-bold tracking-[-0.05em] text-[#12322d]">room<span className="text-[#1f9b7b]">visit</span></p>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-md">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1f9b7b]">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.06em] text-[#12322d]">Sign in</h2>
              <p className="mt-2 text-sm text-[#67857d]">Manage room checks, visitor notes and hotel operations in one place.</p>
            </div>

            <form onSubmit={login} className="space-y-4">
              <label className="block text-sm font-medium text-[#45675b]">
                Email address
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#f8fbfa] px-3 shadow-[0_8px_20px_rgba(17,41,36,0.03)] focus-within:border-[#1c7d68] focus-within:ring-4 focus-within:ring-[#1c7d68]/10">
                  <Mail size={17} className="text-[#67857d]" />
                  <input required type="email" name="email" className="h-12 w-full bg-transparent text-sm text-[#12322d] outline-none placeholder:text-[#9bafa9]" placeholder="you@hotel.com" />
                </div>
              </label>

              <label className="block text-sm font-medium text-[#45675b]">
                Password
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[rgba(18,52,46,0.08)] bg-[#f8fbfa] px-3 shadow-[0_8px_20px_rgba(17,41,36,0.03)] focus-within:border-[#1c7d68] focus-within:ring-4 focus-within:ring-[#1c7d68]/10">
                  <LockKeyhole size={17} className="text-[#67857d]" />
                  <input required type="password" name="password" className="h-12 w-full bg-transparent text-sm text-[#12322d] outline-none placeholder:text-[#9bafa9]" placeholder="••••••••" />
                </div>
              </label>

              {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}

              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1c7d68] to-[#145d4f] py-3.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(28,125,104,0.25)] transition hover:-translate-y-0.5 disabled:opacity-70">
                {loading ? "Signing in…" : "Continue to dashboard"}
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
