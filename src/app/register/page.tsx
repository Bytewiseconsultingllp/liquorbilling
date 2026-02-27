"use client"

import { useState } from "react"
import Link from "next/link"

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-slate-400">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-slate-400">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  )
}

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("")
  const [slug, setSlug] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSlugFromName = (name: string) => {
    setCompanyName(name)
    setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
  }

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch("/api/tenant-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, slug, email, password, phone, address }),
    })
    const data = await res.json()
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError(typeof data.error === "string" ? data.error : "Please check all fields and try again")
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-green-100 shadow-lg shadow-green-100/30 p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-slate-900 mb-2">Request Submitted!</h1>
            <p className="text-sm text-slate-500 mb-6">
              Your workspace request for <span className="font-semibold text-slate-700">{companyName}</span> has been submitted successfully. An admin will review your request and you&apos;ll be able to log in once approved.
            </p>
            <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
              Go to Login →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-blue-100 shadow-lg shadow-blue-100/30 p-10">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors">
            ← Back to home
          </Link>

          <div className="mb-8">
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900 mb-1">Request a Workspace</h1>
            <p className="text-sm text-slate-400">Submit your details — an admin will review and approve your workspace</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company name *</label>
              <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                placeholder="Acme Corp" value={companyName} onChange={e => handleSlugFromName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">URL slug *</label>
              <div className="flex items-center gap-2">
                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-mono"
                  placeholder="acme-corp" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
              </div>
              <p className="text-xs text-slate-400 mt-1">Your workspace will be at: <span className="font-mono text-blue-500">{slug || "your-slug"}.yourdomain.com</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
              <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:opacity-70 transition-opacity">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password *</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} className={`w-full px-4 py-3 pr-11 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm ${confirmPassword && confirmPassword !== password ? "border-red-300" : "border-slate-200"}`}
                  placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:opacity-70 transition-opacity">
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm resize-none"
                rows={2} placeholder="City, State" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <button onClick={handleSubmit} disabled={loading || !companyName || !slug || !email || !password || !confirmPassword || password !== confirmPassword}
              className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
              {loading ? "Submitting…" : "Submit Request →"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
