"use client"

import { useEffect, useState, useCallback } from "react"
import Papa from "papaparse"

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
const errCls = "text-xs text-red-500 mt-1"

const typeBadge: Record<string, { bg: string; text: string; border: string }> = {
  Retail: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  Wholesale: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  B2B: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
}

interface CForm { name: string; phone: string; email: string; type: string; address: string; gstin: string; creditLimit: number; openingBalance: number; maxDiscountPercentage: number; notes: string }
const emptyForm: CForm = { name: "", phone: "", email: "", type: "Retail", address: "", gstin: "", creditLimit: 0, openingBalance: 0, maxDiscountPercentage: 0, notes: "" }

function validate(f: CForm): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = "Customer name is required"
  if (!f.phone.trim()) e.phone = "Phone number is required"
  else if (!/^\+?\d{7,15}$/.test(f.phone.replace(/\s/g, ""))) e.phone = "Invalid phone number"
  if (f.email && !/\S+@\S+\.\S+/.test(f.email)) e.email = "Invalid email address"
  if (!["Retail", "Wholesale", "B2B"].includes(f.type)) e.type = "Invalid type"
  if (f.creditLimit < 0) e.creditLimit = "Cannot be negative"
  if (f.creditLimit > 1000000) e.creditLimit = "Maximum ₹10,00,000"
  if (f.openingBalance < 0) e.openingBalance = "Cannot be negative"
  if (f.maxDiscountPercentage < 0) e.maxDiscountPercentage = "Cannot be negative"
  if (f.maxDiscountPercentage > 100) e.maxDiscountPercentage = "Maximum 100%"
  return e
}

function downloadTemplate() {
  const csv = "name,type,phone,email,address,gstin,creditLimit,openingBalance,notes\nJohn Doe,Retail,9876543210,john@email.com,123 Main St,,50000,0,Regular customer\nABC Corp,B2B,9123456780,abc@corp.com,Business Park,27AAACB1234F1ZT,500000,10000,Monthly billing"
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "customers_template.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function TenantCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState<CForm>({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenant/customers?q=${search}&page=${page}`)
      const data = await res.json()
      setCustomers(data.data || []); setTotalPages(data.pagination?.totalPages || 1)
    } catch { console.error("Failed to fetch customers") }
  }, [search, page])
  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const openCreate = () => { setForm({ ...emptyForm }); setErrors({}); setApiError(""); setEditId(null); setShowModal(true) }
  const openEdit = (c: any) => {
    setForm({
      name: c.name, phone: c.contactInfo?.phone || "", email: c.contactInfo?.email || "", type: c.type,
      address: c.contactInfo?.address || "", gstin: c.contactInfo?.gstin || "",
      creditLimit: c.creditLimit || 0, openingBalance: c.openingBalance || 0,
      maxDiscountPercentage: c.maxDiscountPercentage || 0, notes: c.notes || "",
    })
    setErrors({}); setApiError(""); setEditId(c._id); setShowModal(true)
  }

  const handleCSVUpload = (file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as any[]).map(r => ({
          ...r,
          creditLimit: r.creditLimit ? Number(r.creditLimit) : 0,
          openingBalance: r.openingBalance ? Number(r.openingBalance) : 0,
        }))
        const res = await fetch("/api/tenant/customers/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) })
        const data = await res.json()
        if (!res.ok) { alert(data.error) } else { alert(`Created ${data.created} customers`); fetchCustomers() }
      },
    })
  }

  const handleSubmit = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setApiError("")

    const payload: any = {
      name: form.name, type: form.type, creditLimit: form.creditLimit,
      openingBalance: form.openingBalance, maxDiscountPercentage: form.maxDiscountPercentage || undefined, notes: form.notes || undefined,
      contactInfo: { phone: form.phone, email: form.email || undefined, address: form.address || undefined, gstin: form.gstin || undefined },
    }

    const url = editId ? `/api/tenant/customers/${editId}` : "/api/tenant/customers"
    const method = editId ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) { setApiError(data.error || "Something went wrong"); return }
    setShowModal(false); fetchCustomers()
  }

  const deleteCustomer = async (id: string) => {
    if (!confirm("Delete this customer?")) return
    const res = await fetch(`/api/tenant/customers/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchCustomers()
  }

  const setField = (k: keyof CForm, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {showModal && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">{editId ? "Edit Customer" : "New Customer"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editId ? "Update customer details" : "Fill in the details below"}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {apiError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{apiError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Customer Name *</label>
                  <input className={`${inputCls} ${errors.name ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="John Doe" value={form.name} onChange={e => setField("name", e.target.value)} />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Type *</label>
                  <select className={inputCls} value={form.type} onChange={e => setField("type", e.target.value)}>
                    <option>Retail</option><option>Wholesale</option><option>B2B</option>
                  </select>
                  {errors.type && <p className={errCls}>{errors.type}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone *</label>
                  <input className={`${inputCls} ${errors.phone ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="9876543210" value={form.phone} onChange={e => setField("phone", e.target.value)} />
                  {errors.phone && <p className={errCls}>{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                  <input className={`${inputCls} ${errors.email ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="customer@email.com" value={form.email} onChange={e => setField("email", e.target.value)} />
                  {errors.email && <p className={errCls}>{errors.email}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                  <input className={inputCls} placeholder="123 Main Street, City" value={form.address} onChange={e => setField("address", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">GSTIN</label>
                  <input className={inputCls} placeholder="27AAACB1234F1ZT" value={form.gstin} onChange={e => setField("gstin", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Credit Limit (₹)</label>
                  <input type="number" min={0} max={1000000} className={`${inputCls} ${errors.creditLimit ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.creditLimit || ""} onChange={e => setField("creditLimit", Number(e.target.value))} placeholder="Max ₹10,00,000" />
                  {errors.creditLimit && <p className={errCls}>{errors.creditLimit}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Max Discount (%)</label>
                  <input type="number" min={0} max={100} className={`${inputCls} ${errors.maxDiscountPercentage ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.maxDiscountPercentage || ""} onChange={e => setField("maxDiscountPercentage", Number(e.target.value))} placeholder="e.g. 10" />
                  {errors.maxDiscountPercentage && <p className={errCls}>{errors.maxDiscountPercentage}</p>}
                </div>
                {!editId && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Opening Balance (₹)</label>
                    <input type="number" min={0} className={`${inputCls} ${errors.openingBalance ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.openingBalance || ""} onChange={e => setField("openingBalance", Number(e.target.value))} />
                    {errors.openingBalance && <p className={errCls}>{errors.openingBalance}</p>}
                  </div>
                )}
                <div className={editId ? "col-span-2" : ""}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
                  <input className={inputCls} placeholder="Optional notes" value={form.notes} onChange={e => setField("notes", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                {editId ? "Save Changes" : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">CRM</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your customer relationships</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Bulk Upload
              <input type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleCSVUpload(e.target.files[0]); e.target.value = "" }} />
            </label>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              + Add Customer
            </button>
          </div>
        </div>

        <div className="relative mb-5">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search customers…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-72 shadow-sm" />
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Name", "Type", "Phone", "Email", "Max Disc.", "Credit Limit", "Outstanding", ""].map(h => (
                    <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map(c => {
                  const badge = typeBadge[c.type] || typeBadge["Retail"]
                  return (
                    <tr key={c._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{c.name}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full border" style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}>{c.type}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{c.contactInfo?.phone || "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{c.contactInfo?.email || "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{c.maxDiscountPercentage ? `${c.maxDiscountPercentage}%` : "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">₹{(c.creditLimit || 0).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-red-500">₹{(c.outstandingBalance || 0).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(c)} className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">Edit</button>
                          <button onClick={() => deleteCustomer(c._id)} className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {customers.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No customers found</div>}
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
