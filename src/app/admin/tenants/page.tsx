"use client"

import { useEffect, useState } from "react"

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)

  const fetchTenants = async () => {
    const res = await fetch(`/api/admin/tenants?q=${search}&page=${page}&limit=10`)
    const data = await res.json(); setTenants(data.data); setTotalPages(data.pagination.totalPages)
  }
  useEffect(() => { fetchTenants() }, [page, search])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/tenants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    fetchTenants()
  }

  const deleteTenant = async (id: string) => {
    if (!confirm("Delete tenant permanently?")) return
    await fetch(`/api/admin/tenants/${id}`, { method: "DELETE" })
    fetchTenants()
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Admin</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Tenant Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage all organizations on the platform</p>
          </div>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input placeholder="Search tenants…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64 shadow-sm" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Name</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Slug</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Users</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.map(tenant => (
                <tr key={tenant._id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{tenant.name}</td>
                  <td className="px-6 py-4 text-sm text-blue-500 font-mono">/{tenant.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tenant.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === "active" ? "bg-emerald-500" : "bg-red-500"}`}></span>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tenant.userCount}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => updateStatus(tenant._id, tenant.status === "active" ? "suspended" : "active")}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all bg-white">
                        {tenant.status === "active" ? "Suspend" : "Activate"}
                      </button>
                      <button onClick={() => deleteTenant(tenant._id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No tenants found</div>}
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
