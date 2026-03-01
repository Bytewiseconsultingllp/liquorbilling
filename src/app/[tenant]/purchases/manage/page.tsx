"use client"

import { useEffect, useState } from "react"

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

interface PurchaseItem {
  productName: string; brand: string; volumeML: number; bottlesPerCaret: number;
  carets: number; bottles: number; totalBottles: number; purchasePricePerCaret: number; amount: number;
}
interface Purchase {
  _id: string; purchaseNumber: string; vendorName: string; purchaseDate: string;
  subtotal: number; vatRate: number; vatAmount: number; tcsRate: number; tcsAmount: number;
  taxAmount: number; totalAmount: number; paymentStatus: string; paidAmount: number; dueAmount: number;
  items: PurchaseItem[]; createdAt: string; notes?: string; isReturned?: boolean;
}

/* ──── Detail Overlay ──── */
function DetailOverlay({ purchase, onClose, onReturn }: { purchase: Purchase; onClose: () => void; onReturn: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-blue-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Purchase Detail</p>
            <h3 className="font-semibold text-slate-800 text-lg">{purchase.purchaseNumber}</h3>
            <p className="text-xs text-slate-400 mt-1">{purchase.vendorName} · {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
            {purchase.isReturned && <span className="inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-200">RETURNED</span>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-3 mt-0.5 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Items table */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Product", "Carets", "Bottles", "Total Btl", "Price/Crt", "Amount"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchase.items?.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800 text-sm">{item.productName}</p>
                      <p className="text-xs text-slate-400">{item.brand} · {item.volumeML}ml</p>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{item.carets ?? "-"}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{item.bottles ?? 0}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{item.totalBottles ?? "-"}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">₹{(item.purchasePricePerCaret ?? 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">₹{(item.amount ?? 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-900">₹{(purchase.subtotal || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">VAT ({purchase.vatRate || 35}%)</span><span className="font-medium text-slate-900">₹{(purchase.vatAmount || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">TCS ({purchase.tcsRate || 1}%)</span><span className="font-medium text-slate-900">₹{(purchase.tcsAmount || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Total Tax</span><span className="font-semibold text-orange-600">₹{(purchase.taxAmount || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold text-slate-800">Grand Total</span><span className="font-bold text-blue-700">₹{(purchase.totalAmount || 0).toLocaleString("en-IN")}</span></div>
          </div>

          {/* Payment */}
          <div className="flex gap-4 text-sm">
            <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Paid</p>
              <p className="text-lg font-bold text-emerald-700">₹{(purchase.paidAmount || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-red-500 font-medium mb-1">Due</p>
              <p className="text-lg font-bold text-red-600">₹{(purchase.dueAmount || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 font-medium mb-1">Status</p>
              <p className="text-lg font-bold text-blue-700 capitalize">{purchase.paymentStatus}</p>
            </div>
          </div>

          {/* Return Button */}
          {!purchase.isReturned && (
            <button onClick={() => onReturn(purchase._id)} className="w-full py-3 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-all">
              ↩ Return This Purchase
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ──── Main Page ──── */
export default function ManagePurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [search, setSearch] = useState("")
  const [returning, setReturning] = useState(false)

  const fetchPurchases = (signal?: AbortSignal) => {
    fetch("/api/tenant/purchases", { signal }).then(r => r.json()).then(d => setPurchases(d.data || [])).catch(() => {})
  }

  useEffect(() => { const ac = new AbortController(); fetchPurchases(ac.signal); return () => ac.abort() }, [])

  const filtered = purchases.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.purchaseNumber.toLowerCase().includes(q) || p.vendorName?.toLowerCase().includes(q)
  })

  const handleReturn = async (id: string) => {
    if (!confirm("Return this purchase? This will reverse stock changes.")) return
    setReturning(true)
    const res = await fetch(`/api/tenant/purchases/${id}/return`, { method: "POST" })
    const data = await res.json()
    setReturning(false)
    if (!res.ok) { alert(data.error || "Failed to return purchase"); return }
    alert("Purchase returned successfully")
    setSelectedPurchase(null)
    fetchPurchases()
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      partial: "bg-amber-50 text-amber-700 border-amber-200",
      pending: "bg-red-50 text-red-600 border-red-200",
    }
    return map[s] || map.pending
  }

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Procurement</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Manage Purchases</h1>
          <p className="text-slate-500 text-sm mt-1">View all purchase records and process returns</p>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input type="text" placeholder="Search by purchase number or vendor..." value={search} onChange={e => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm w-full max-w-md" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Purchase #", "Date", "Vendor", "Items", "Subtotal", "Tax", "Total", "Status", ""].map(h => (
                    <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} className={`border-t border-slate-50 hover:bg-blue-50/20 transition-colors ${p.isReturned ? "opacity-60" : ""}`}>
                    <td className="px-5 py-4 font-mono text-xs text-blue-600 font-medium">
                      {p.purchaseNumber}
                      {p.isReturned && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-100 text-red-500">RET</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{new Date(p.purchaseDate || p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{p.vendorName}</td>
                    <td className="px-5 py-4 text-slate-500">{p.items?.length || 0}</td>
                    <td className="px-5 py-4 text-slate-700">₹{(p.subtotal || 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 text-orange-600 font-medium">₹{(p.taxAmount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">₹{(p.totalAmount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${statusBadge(p.paymentStatus)}`}>{p.paymentStatus}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setSelectedPurchase(p)}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors" title="View Detail">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {!p.isReturned && (
                          <button onClick={() => handleReturn(p._id)} disabled={returning}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-40" title="Return Purchase">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No purchases found</div>}
        </div>
      </div>

      {/* Detail overlay */}
      {selectedPurchase && <DetailOverlay purchase={selectedPurchase} onClose={() => setSelectedPurchase(null)} onReturn={handleReturn} />}
    </div>
  )
}
