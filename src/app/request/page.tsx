"use client"

import { useState } from "react"
import Link from "next/link"

export default function RequestTenantPage() {
  const [form, setForm] = useState({ companyName: "", slug: "", email: "" })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/tenant-request", { method: "POST", body: JSON.stringify(form) })
    setSubmitted(true)
    setLoading(false)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl" style={{ background: "linear-gradient(135deg, #DBEAFE, #BAE6FD)" }}>✓</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900 mb-3">Request submitted!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Our team will review your request and reach out at <strong className="text-slate-700">{form.email}</strong> within 24 hours.
          </p>
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-800">← Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-blue-100 shadow-lg shadow-blue-100/30 p-10">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors">← Back</Link>
          <div className="mb-8">
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900 mb-1">Request a workspace</h1>
            <p className="text-sm text-slate-400">Tell us about your organization and we'll get you set up.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company name</label>
              <input placeholder="Acme Corp" required className={inputCls} onChange={e => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Desired URL slug</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                <span className="px-3 text-sm text-slate-400 select-none border-r border-slate-200 py-3 bg-slate-100">tenantify.com/</span>
                <input placeholder="acme" required className="flex-1 py-3 pr-4 pl-3 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm"
                  onChange={e => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your email</label>
              <input type="email" placeholder="you@company.com" required className={inputCls} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
              {loading ? "Submitting…" : "Submit request →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
