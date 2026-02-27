"use client";

import { useEffect, useState, useCallback } from "react";
import Papa from "papaparse";

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
const errCls = "text-xs text-red-500 mt-1"

interface UserForm { name: string; email: string; password: string; role: string; employmentType: string; salary: number }
const emptyForm: UserForm = { name: "", email: "", password: "", role: "member", employmentType: "employee", salary: 0 }

function validate(f: UserForm, isEdit: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = "Name is required"
  if (!f.email.trim()) e.email = "Email is required"
  else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Invalid email address"
  if (!isEdit && !f.password) e.password = "Password is required"
  else if (!isEdit && f.password.length < 6) e.password = "Min 6 characters"
  if (f.employmentType === "employee" && (!f.salary || f.salary <= 0)) e.salary = "Salary is required for employees"
  if (f.salary < 0) e.salary = "Salary cannot be negative"
  return e
}

function downloadTemplate() {
  const csv = "name,email,password,role,employmentType,salary\nJohn Doe,john@example.com,pass1234,member,employee,25000\nJane Smith,jane@example.com,pass1234,admin,non-employee,"
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "users_template.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function TenantUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState<UserForm>({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenant/users?q=${search}&page=${page}&limit=10`)
      const data = await res.json()
      setUsers(data.data || []); setTotalPages(data.pagination?.totalPages || 1)
    } catch { console.error("Failed to fetch users") }
  }, [search, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openCreate = () => { setForm({ ...emptyForm }); setErrors({}); setApiError(""); setEditId(null); setShowModal(true) }
  const openEdit = (u: any) => {
    setForm({ name: u.name || "", email: u.email, password: "", role: u.role, employmentType: u.employmentType || "employee", salary: u.salary || 0 })
    setErrors({}); setApiError(""); setEditId(u._id); setShowModal(true)
  }

  const handleCSVUpload = (file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as any[]).map(r => ({ ...r, salary: r.salary ? Number(r.salary) : undefined }))
        const res = await fetch("/api/tenant/users/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) })
        const data = await res.json()
        if (!res.ok) { alert(data.error) } else { alert(`Created ${data.created} users`); fetchUsers() }
      },
    })
  }

  const handleSubmit = async () => {
    const isEdit = !!editId
    const errs = validate(form, isEdit)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setApiError("")
    const payload: any = { name: form.name, email: form.email, role: form.role, employmentType: form.employmentType, salary: form.employmentType === "employee" ? form.salary : 0 }
    if (!isEdit) payload.password = form.password

    const url = isEdit ? `/api/tenant/users/${editId}` : "/api/tenant/users"
    const method = isEdit ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) { setApiError(data.error || "Something went wrong"); return }
    setShowModal(false); fetchUsers()
  }

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return
    const res = await fetch(`/api/tenant/users/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchUsers()
  }

  const setField = (k: keyof UserForm, v: any) => {
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
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">{editId ? "Edit User" : "Add User"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editId ? "Update user details" : "Invite a new team member"}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {apiError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{apiError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name *</label>
                  <input className={`${inputCls} ${errors.name ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="John Doe" value={form.name} onChange={e => setField("name", e.target.value)} />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Email *</label>
                  <input className={`${inputCls} ${errors.email ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="user@company.com" value={form.email} onChange={e => setField("email", e.target.value)} />
                  {errors.email && <p className={errCls}>{errors.email}</p>}
                </div>
              </div>
              {!editId && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Password *</label>
                  <input type="password" className={`${inputCls} ${errors.password ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="••••••••" value={form.password} onChange={e => setField("password", e.target.value)} />
                  {errors.password && <p className={errCls}>{errors.password}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Role *</label>
                  <select className={inputCls} value={form.role} onChange={e => setField("role", e.target.value)}>
                    <option value="member">Member</option><option value="admin">Admin</option><option value="owner">Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Employment Type *</label>
                  <select className={inputCls} value={form.employmentType} onChange={e => { setField("employmentType", e.target.value); if (e.target.value === "non-employee") setField("salary", 0) }}>
                    <option value="employee">Employee</option><option value="non-employee">Non-Employee</option>
                  </select>
                </div>
              </div>
              {form.employmentType === "employee" && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Salary (₹) *</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.salary ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.salary || ""} onChange={e => setField("salary", Number(e.target.value))} placeholder="25000" />
                  {errors.salary && <p className={errCls}>{errors.salary}</p>}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>{editId ? "Save Changes" : "Create User"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Team</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Manage Users</h1>
            <p className="text-slate-500 text-sm mt-1">Add, edit, and manage user roles</p>
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
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              + Add User
            </button>
          </div>
        </div>

        <div className="relative mb-5">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-72 shadow-sm" />
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Name", "Email", "Role", "Type", "Salary", "Status", ""].map(h => (
                    <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{u.name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${u.role === "owner" ? "bg-amber-50 text-amber-700 border-amber-200" : u.role === "admin" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 capitalize">{u.employmentType || "—"}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{u.employmentType === "employee" && u.salary ? `₹${u.salary.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${u.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(u)} className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">Edit</button>
                        <button onClick={() => deleteUser(u._id)} className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No users found</div>}
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
