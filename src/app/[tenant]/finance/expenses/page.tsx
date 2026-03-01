"use client"

import { useEffect, useState } from "react"

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

interface Category { _id: string; name: string; description?: string }
interface Expense {
  _id: string; expenseNumber: string; categoryId: string; categoryName: string;
  amount: number; description?: string; expenseDate: string; paymentMode: string;
  transactionId?: string; notes?: string; createdAt: string;
}

const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 0 })
const PAYMENT_MODES = ["Cash", "Online", "Credit", "Cheque"] as const

/* Category Manager Overlay */
function CategoryManager({ categories, onClose, onRefresh }: { categories: Category[]; onClose: () => void; onRefresh: () => void }) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch("/api/tenant/finance/expenses/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) return alert(data.error)
    setName(""); setDesc(""); onRefresh()
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    const res = await fetch(`/api/tenant/finance/expenses/categories/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || undefined }),
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    setEditId(null); onRefresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    const res = await fetch(`/api/tenant/finance/expenses/categories/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    onRefresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-blue-100 max-h-[85vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Manage</p>
            <h3 className="font-semibold text-slate-800 text-lg">Expense Categories</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-3">
            <input type="text" placeholder="Category name *" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400" />
            <input type="text" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400" />
            <button onClick={handleCreate} disabled={saving || !name.trim()}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>
              {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {saving ? "Creating…" : "+ Add Category"}
            </button>
          </div>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                {editId === cat._id ? (
                  <div className="flex-1 flex gap-2 items-center">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={() => handleUpdate(cat._id)} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600">Save</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-200 rounded-lg hover:bg-slate-300">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                      {cat.description && <p className="text-xs text-slate-400">{cat.description}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditId(cat._id); setEditName(cat.name); setEditDesc(cat.description || "") }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(cat._id)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && <p className="text-center text-sm text-slate-400 py-6">No categories yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Expense Detail Overlay */
function ExpenseDetail({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const modeColor: Record<string, string> = {
    Cash: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Online: "bg-blue-50 text-blue-700 border-blue-200",
    Credit: "bg-amber-50 text-amber-700 border-amber-200",
    Cheque: "bg-purple-50 text-purple-700 border-purple-200",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-blue-100">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Expense</p>
            <h3 className="font-semibold text-slate-800 text-lg">{expense.expenseNumber}</h3>
            <p className="text-xs text-slate-400 mt-1">{new Date(expense.expenseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ml-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="text-center py-4">
            <p className="text-xs text-slate-400 mb-1">Amount</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>{"₹"}{fmt(expense.amount)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Category</span><span className="font-medium text-slate-900">{expense.categoryName}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500">Payment</span><span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${modeColor[expense.paymentMode] || ""}`}>{expense.paymentMode}</span></div>
            {expense.description && <div className="flex justify-between"><span className="text-slate-500">Description</span><span className="font-medium text-slate-900 text-right max-w-[60%]">{expense.description}</span></div>}
            {expense.transactionId && <div className="flex justify-between"><span className="text-slate-500">Txn ID</span><span className="font-mono text-xs text-slate-700">{expense.transactionId}</span></div>}
            {expense.notes && <div className="flex justify-between"><span className="text-slate-500">Notes</span><span className="text-slate-700 text-right max-w-[60%]">{expense.notes}</span></div>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Main Page */
export default function ExpensesPage() {
  const [tab, setTab] = useState<"list" | "create">("list")
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [summary, setSummary] = useState<{ totalAmount: number; totalCount: number; byCategory: any[]; byPaymentMode: any[] }>({ totalAmount: 0, totalCount: 0, byCategory: [], byPaymentMode: [] })
  const [loading, setLoading] = useState(false)
  const [filterCat, setFilterCat] = useState("")
  const [filterMode, setFilterMode] = useState("")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({
    categoryId: "", categoryName: "", amount: "", description: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMode: "Cash" as string, transactionId: "", notes: "",
  })
  const [creating, setCreating] = useState(false)
  const [showCatManager, setShowCatManager] = useState(false)
  const [viewExpense, setViewExpense] = useState<Expense | null>(null)

  const fetchCategories = async () => {
    const res = await fetch("/api/tenant/finance/expenses/categories")
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
  }

  const fetchExpenses = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: "20" })
    if (filterCat) params.set("categoryId", filterCat)
    if (filterMode) params.set("paymentMode", filterMode)
    if (filterStart) params.set("startDate", filterStart)
    if (filterEnd) params.set("endDate", filterEnd)
    const res = await fetch(`/api/tenant/finance/expenses?${params}`)
    const data = await res.json()
    setExpenses(data.data || [])
    setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 })
    setLoading(false)
  }

  const fetchSummary = async () => {
    const params = new URLSearchParams()
    if (filterStart) params.set("startDate", filterStart)
    if (filterEnd) params.set("endDate", filterEnd)
    const res = await fetch(`/api/tenant/finance/expenses/summary?${params}`)
    const data = await res.json()
    setSummary(data)
  }

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchExpenses(1); setPage(1) }, [filterCat, filterMode, filterStart, filterEnd])
  useEffect(() => { fetchSummary() }, [filterStart, filterEnd])

  const handleCreate = async () => {
    if (!form.categoryId) return alert("Select a category")
    if (!form.amount || Number(form.amount) <= 0) return alert("Enter a valid amount")
    if (!form.expenseDate) return alert("Select expense date")
    setCreating(true)
    const res = await fetch("/api/tenant/finance/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: form.categoryId, categoryName: form.categoryName,
        amount: Number(form.amount), description: form.description || undefined,
        expenseDate: form.expenseDate, paymentMode: form.paymentMode,
        transactionId: form.transactionId || undefined, notes: form.notes || undefined,
      }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) return alert(data.error)
    alert("Expense created")
    setForm({ categoryId: "", categoryName: "", amount: "", description: "", expenseDate: new Date().toISOString().split("T")[0], paymentMode: "Cash", transactionId: "", notes: "" })
    setTab("list"); fetchExpenses(1); setPage(1); fetchSummary()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return
    const res = await fetch(`/api/tenant/finance/expenses/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    fetchExpenses(); fetchSummary()
  }

  const modeColor: Record<string, string> = {
    Cash: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Online: "bg-blue-50 text-blue-700 border-blue-200",
    Credit: "bg-amber-50 text-amber-700 border-amber-200",
    Cheque: "bg-purple-50 text-purple-700 border-purple-200",
  }

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Finance</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Expenses</h1>
            <p className="text-slate-500 text-sm mt-1">Track and manage your business expenses</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCatManager(true)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              {"⚙"} Categories
            </button>
            <button onClick={() => setTab(tab === "create" ? "list" : "create")}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm"
              style={{ background: tab === "create" ? "#64748B" : "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              {tab === "create" ? "← Back to List" : "+ New Expense"}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {tab === "list" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900">{"₹"}{fmt(summary.totalAmount)}</p>
              <p className="text-xs text-slate-400 mt-1">{summary.totalCount} transaction{summary.totalCount !== 1 ? "s" : ""}</p>
            </div>
            {summary.byPaymentMode.slice(0, 3).map((m: any) => (
              <div key={m._id} className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">{m._id}</p>
                <p className="text-2xl font-bold text-slate-900">{"₹"}{fmt(m.total)}</p>
                <p className="text-xs text-slate-400 mt-1">{m.count} transaction{m.count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}

        {/* Create tab */}
        {tab === "create" && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-slate-800 text-lg mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>New Expense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Category *</label>
                <select value={form.categoryId} onChange={e => {
                  const cat = categories.find(c => c._id === e.target.value)
                  setForm({ ...form, categoryId: e.target.value, categoryName: cat?.name || "" })
                }} className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Amount ({"₹"}) *</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Expense Date *</label>
                <input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Payment Mode *</label>
                <div className="flex gap-2 flex-wrap">
                  {(["Cash", "Online", "Credit", "Cheque"] as const).map(m => (
                    <button key={m} onClick={() => setForm({ ...form, paymentMode: m })}
                      className={`px-4 py-2 text-sm rounded-xl border transition-all ${form.paymentMode === m ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <input type="text" placeholder="What was this expense for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400" />
              </div>
              {(form.paymentMode === "Online" || form.paymentMode === "Cheque") && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">{form.paymentMode === "Cheque" ? "Cheque No." : "Transaction ID"}</label>
                  <input type="text" placeholder={form.paymentMode === "Cheque" ? "Cheque number" : "UPI / NEFT ref"} value={form.transactionId} onChange={e => setForm({ ...form, transactionId: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400" />
                </div>
              )}
              <div className={form.paymentMode === "Online" || form.paymentMode === "Cheque" ? "" : "md:col-span-2"}>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Notes</label>
                <input type="text" placeholder="Additional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={handleCreate} disabled={creating}
                className="px-8 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
                {creating && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {creating ? "Creating…" : "Create Expense"}
              </button>
              <button onClick={() => setTab("list")} className="px-6 py-3 text-sm font-medium text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* List tab */}
        {tab === "list" && (
          <>
            <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-5 shadow-sm flex items-center gap-4 flex-wrap">
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select value={filterMode} onChange={e => setFilterMode(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Modes</option>
                {(["Cash", "Online", "Credit", "Cheque"] as const).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">From</span>
                <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">To</span>
                <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {(filterCat || filterMode || filterStart || filterEnd) && (
                <button onClick={() => { setFilterCat(""); setFilterMode(""); setFilterStart(""); setFilterEnd("") }}
                  className="px-3 py-2 text-xs font-medium text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                  Clear Filters
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm mb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {["#", "Date", "Category", "Description", "Mode", "Amount", ""].map(h => (
                        <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "Amount" ? "text-right" : h === "" ? "text-center" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="py-16 text-center">
                        <svg className="w-8 h-8 animate-spin text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        <p className="text-sm text-slate-400 mt-3">Loading expenses…</p>
                      </td></tr>
                    ) : expenses.map(exp => (
                      <tr key={exp._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-blue-600 font-medium">{exp.expenseNumber}</td>
                        <td className="px-5 py-4 text-slate-500">{new Date(exp.expenseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td className="px-5 py-4 font-medium text-slate-900">{exp.categoryName}</td>
                        <td className="px-5 py-4 text-slate-500 max-w-[200px] truncate">{exp.description || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${modeColor[exp.paymentMode] || ""}`}>{exp.paymentMode}</span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-900">{"₹"}{fmt(exp.amount)}</td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setViewExpense(exp)}
                              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors" title="View">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(exp._id)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors" title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && expenses.length === 0 && (
                      <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm">No expenses found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-2xl border border-blue-100 px-5 py-3 shadow-sm">
                <p className="text-xs text-slate-400">Showing {expenses.length} of {pagination.total}</p>
                <div className="flex gap-2">
                  <button onClick={() => { const p = page - 1; setPage(p); fetchExpenses(p) }} disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors">Prev</button>
                  <span className="px-3 py-1.5 text-xs text-slate-500">{page} / {pagination.totalPages}</span>
                  <button onClick={() => { const p = page + 1; setPage(p); fetchExpenses(p) }} disabled={page >= pagination.totalPages}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}

            {summary.byCategory.length > 0 && (
              <div className="mt-5 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-semibold text-slate-800">Expenses by Category</h2>
                </div>
                <div className="p-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {summary.byCategory.map((c: any) => (
                    <div key={c._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c._id}</p>
                        <p className="text-xs text-slate-400">{c.count} expense{c.count !== 1 ? "s" : ""}</p>
                      </div>
                      <p className="font-semibold text-slate-900">{"₹"}{fmt(c.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {showCatManager && <CategoryManager categories={categories} onClose={() => setShowCatManager(false)} onRefresh={fetchCategories} />}
      {viewExpense && <ExpenseDetail expense={viewExpense} onClose={() => setViewExpense(null)} />}
    </div>
  )
}