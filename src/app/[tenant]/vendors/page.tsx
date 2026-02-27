"use client"

import { useEffect, useState, useCallback } from "react"
import Papa from "papaparse"

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
const errCls = "text-xs text-red-500 mt-1"

interface VForm {
  name: string; tin: string; cin: string; priority: number; gstin: string
  contactPerson: string; email: string; phone: string; address: string
  bankAccountName: string; bankName: string; accountNumber: string; ifscCode: string
}
const emptyForm: VForm = { name: "", tin: "", cin: "", priority: 1, gstin: "", contactPerson: "", email: "", phone: "", address: "", bankAccountName: "", bankName: "", accountNumber: "", ifscCode: "" }

function validate(f: VForm): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = "Vendor name is required"
  if (!f.tin.trim()) e.tin = "TIN is required"
  if (f.priority < 1) e.priority = "Priority must be at least 1"
  if (f.email && !/\S+@\S+\.\S+/.test(f.email)) e.email = "Invalid email"
  if (f.phone && !/^\+?\d{7,15}$/.test(f.phone.replace(/\s/g, ""))) e.phone = "Invalid phone"
  return e
}

function downloadTemplate() {
  const csv = "name,tin,cin,priority,gstin,contactPerson,email,phone,address,bankAccountName,bankName,accountNumber,ifscCode\nABC Suppliers,TIN123,CIN456,1,27AAACB1234F1ZT,Raj Kumar,raj@abc.com,9876543210,Mumbai,ABC Pvt Ltd,HDFC Bank,1234567890,HDFC0001234"
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "vendors_template.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function VendorPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [form, setForm] = useState<VForm>({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenant/vendors?q=${search}&page=${page}`)
      const data = await res.json()
      setVendors(data.data || []); setTotalPages(data.pagination?.totalPages || 1)
    } catch { console.error("Failed to fetch vendors") }
  }, [search, page])
  useEffect(() => { fetchVendors() }, [fetchVendors])

  const openCreate = () => { setForm({ ...emptyForm }); setErrors({}); setApiError(""); setEditId(null); setShowModal(true) }
  const openEdit = (v: any) => {
    setForm({
      name: v.name, tin: v.tin || "", cin: v.cin || "", priority: v.priority || 1, gstin: v.gstin || "",
      contactPerson: v.contactPerson || "", email: v.email || "", phone: v.phone || "", address: v.address || "",
      bankAccountName: v.bankDetails?.accountName || "", bankName: v.bankDetails?.bankName || "",
      accountNumber: v.bankDetails?.accountNumber || "", ifscCode: v.bankDetails?.ifscCode || "",
    })
    setErrors({}); setApiError(""); setEditId(v._id); setShowModal(true)
  }

  const handleCSVUpload = (file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as any[]).map(r => ({ ...r, priority: r.priority ? Number(r.priority) : 1 }))
        const res = await fetch("/api/tenant/vendors/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) })
        const data = await res.json()
        if (!res.ok) { alert(data.error) } else { alert(`Created ${data.created} vendors`); fetchVendors() }
      },
    })
  }

  const handleSubmit = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setApiError("")

    const payload: any = {
      name: form.name, tin: form.tin, cin: form.cin || undefined, priority: form.priority, gstin: form.gstin || undefined,
      contactPerson: form.contactPerson || undefined, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined,
      bankDetails: (form.bankAccountName || form.bankName || form.accountNumber || form.ifscCode) ? {
        accountName: form.bankAccountName || undefined, bankName: form.bankName || undefined,
        accountNumber: form.accountNumber || undefined, ifscCode: form.ifscCode || undefined,
      } : undefined,
    }

    const url = editId ? `/api/tenant/vendors/${editId}` : "/api/tenant/vendors"
    const method = editId ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) { setApiError(data.error || "Something went wrong"); return }
    setShowModal(false); fetchVendors()
  }

  const deleteVendor = async (id: string) => {
    if (!confirm("Delete vendor?")) return
    const res = await fetch(`/api/tenant/vendors/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchVendors()
  }

  const setField = (k: keyof VForm, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  const priorityStyle = (p: number) =>
    p === 1 ? { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" } :
    p <= 3  ? { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" } :
              { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {showModal && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">{editId ? "Edit Vendor" : "New Vendor"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editId ? "Update vendor details" : "Add a new supplier"}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {apiError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{apiError}</div>}

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Basic Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Vendor Name *</label>
                  <input className={`${inputCls} ${errors.name ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="Supplier Co." value={form.name} onChange={e => setField("name", e.target.value)} />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Priority *</label>
                  <input type="number" min={1} className={`${inputCls} ${errors.priority ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.priority} onChange={e => setField("priority", Number(e.target.value))} />
                  {errors.priority && <p className={errCls}>{errors.priority}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">TIN *</label>
                  <input className={`${inputCls} ${errors.tin ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="TIN12345" value={form.tin} onChange={e => setField("tin", e.target.value)} />
                  {errors.tin && <p className={errCls}>{errors.tin}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">CIN</label>
                  <input className={inputCls} placeholder="CIN number" value={form.cin} onChange={e => setField("cin", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">GSTIN</label>
                  <input className={inputCls} placeholder="27AAACB1234F1ZT" value={form.gstin} onChange={e => setField("gstin", e.target.value)} />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Contact Person</label>
                  <input className={inputCls} placeholder="Name" value={form.contactPerson} onChange={e => setField("contactPerson", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                  <input className={`${inputCls} ${errors.email ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="vendor@email.com" value={form.email} onChange={e => setField("email", e.target.value)} />
                  {errors.email && <p className={errCls}>{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Phone</label>
                  <input className={`${inputCls} ${errors.phone ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="9876543210" value={form.phone} onChange={e => setField("phone", e.target.value)} />
                  {errors.phone && <p className={errCls}>{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Address</label>
                  <input className={inputCls} placeholder="City, State" value={form.address} onChange={e => setField("address", e.target.value)} />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Bank Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Name</label>
                  <input className={inputCls} placeholder="Account holder" value={form.bankAccountName} onChange={e => setField("bankAccountName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Bank Name</label>
                  <input className={inputCls} placeholder="HDFC, SBI..." value={form.bankName} onChange={e => setField("bankName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Account Number</label>
                  <input className={inputCls} placeholder="Account number" value={form.accountNumber} onChange={e => setField("accountNumber", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">IFSC Code</label>
                  <input className={inputCls} placeholder="HDFC0001234" value={form.ifscCode} onChange={e => setField("ifscCode", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                {editId ? "Save Changes" : "Create Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Suppliers</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Vendors</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your supplier relationships</p>
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
              + Add Vendor
            </button>
          </div>
        </div>

        <div className="relative mb-5">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search vendors…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-72 shadow-sm" />
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Vendor Name", "TIN", "Priority", "Contact", "GSTIN", "Phone", ""].map(h => (
                    <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vendors.map(v => {
                  const ps = priorityStyle(v.priority)
                  return (
                    <tr key={v._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{v.name}</td>
                      <td className="px-5 py-4 text-sm font-mono text-slate-500">{v.tin || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full border" style={{ background: ps.bg, color: ps.text, borderColor: ps.border }}>P{v.priority}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{v.contactPerson || "—"}</td>
                      <td className="px-5 py-4 text-sm font-mono text-slate-500">{v.gstin || "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{v.phone || "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(v)} className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">Edit</button>
                          <button onClick={() => deleteVendor(v._id)} className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {vendors.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No vendors found</div>}
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
