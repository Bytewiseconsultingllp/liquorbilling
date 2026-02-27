"use client"

import { useEffect, useState } from "react"

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState("")
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)

  // Fetch tenants for filter dropdown
  useEffect(() => {
    fetch("/api/admin/tenants?limit=100").then(r => r.json()).then(data => {
      if (data.data && Array.isArray(data.data)) setTenants(data.data)
    })
  }, [])

  const fetchProducts = async () => {
    const params = new URLSearchParams({ q: search, page: String(page) })
    if (selectedTenant) params.set("tenantId", selectedTenant)
    const res = await fetch(`/api/admin/products?${params}`)
    const data = await res.json(); setProducts(data.data); setTotalPages(data.pagination.totalPages)
  }
  useEffect(() => { fetchProducts() }, [page, search, selectedTenant])

  const stockStyle = (n: number) =>
    n > 10 ? { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" } :
    n > 0  ? { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" } :
             { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Admin</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">All Products</h1>
            <p className="text-slate-500 text-sm mt-1">Platform-wide product overview</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTenant}
              onChange={e => { setSelectedTenant(e.target.value); setPage(1) }}
              className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            >
              <option value="">All Tenants</option>
              {tenants.map((t: any) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input placeholder="Search products…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64 shadow-sm" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Product", "Brand", "Category", "Tenant", "Stock"].map(h => (
                  <th key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map(p => {
                const ss = stockStyle(p.currentStock)
                return (
                  <tr key={p._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{p.brand}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs rounded-full">{p.category}</span></td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{p.organizationId?.name || "—"}</td>
                    <td className="px-6 py-4"><span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ background: ss.bg, color: ss.text, borderColor: ss.border }}>{p.currentStock} units</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {products.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No products found</div>}
        </div>

        <div className="flex items-center justify-between mt-5 px-1">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white">← Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
