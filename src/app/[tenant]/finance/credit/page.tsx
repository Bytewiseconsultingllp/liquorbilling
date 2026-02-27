"use client"

import { useEffect, useState } from "react"

interface Customer { _id: string; name: string; outstandingBalance: number }
interface CreditPayment { _id: string; amount: number; cashAmount: number; onlineAmount: number; status: string; creditDate: string; createdAt: string }
interface SaleItem { productName: string; quantity: number; pricePerUnit: number; discountValue?: number; discountAmount?: number; totalAmount: number }
interface Sale {
  _id: string; saleNumber: string; customerName: string; totalAmount: number; paidAmount: number; dueAmount: number;
  saleDate: string; paymentMode: string; cashAmount: number; onlineAmount: number; creditAmount: number;
  billDiscountAmount?: number; totalDiscount?: number; items: SaleItem[]; status: string; type: string
}

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"

function fmt(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── Bill Detail Modal ────────────────────────────────────── */
function BillDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden border border-blue-100 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">{sale.saleNumber}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(sale.saleDate).toLocaleString("en-IN")}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Products */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Products</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Disc.</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 text-slate-700">{item.productName}</td>
                    <td className="py-2 text-right text-slate-600 font-mono">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-600 font-mono">₹{fmt(item.pricePerUnit)}</td>
                    <td className="py-2 text-right text-emerald-600 font-mono">{(item.discountAmount || 0) > 0 ? `₹${fmt(item.discountAmount)}` : "—"}</td>
                    <td className="py-2 text-right text-slate-800 font-mono font-semibold">₹{fmt(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Discount Summary */}
          {((sale.billDiscountAmount || 0) > 0 || (sale.totalDiscount || 0) > 0) && (
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Bill Discount</span>
                <span className="font-mono font-semibold text-emerald-800">₹{fmt(sale.billDiscountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-emerald-700">Total Discount</span>
                <span className="font-mono font-semibold text-emerald-800">₹{fmt(sale.totalDiscount)}</span>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Total Amount</span>
              <span className="font-mono font-bold text-blue-900">₹{fmt(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Cash</span>
              <span className="font-mono text-slate-700">₹{fmt(sale.cashAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Online</span>
              <span className="font-mono text-slate-700">₹{fmt(sale.onlineAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Credit</span>
              <span className="font-mono text-slate-700">₹{fmt(sale.creditAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-blue-200 pt-1.5">
              <span className="text-slate-600">Paid</span>
              <span className="font-mono font-semibold text-emerald-700">₹{fmt(sale.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Due</span>
              <span className={`font-mono font-semibold ${sale.dueAmount > 0 ? "text-red-600" : "text-slate-400"}`}>₹{fmt(sale.dueAmount)}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full border font-medium ${sale.paymentMode === "credit" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
              {sale.paymentMode}
            </span>
            <span className={`px-2 py-1 rounded-full border font-medium ${sale.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {sale.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────── */
export default function CreditManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<Customer | null>(null)
  const [cashAmount, setCashAmount] = useState(0); const [onlineAmount, setOnlineAmount] = useState(0)
  const [creditDate, setCreditDate] = useState("")
  const [payments, setPayments] = useState<CreditPayment[]>([])
  const [customerSales, setCustomerSales] = useState<Sale[]>([])
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)
  const totalAmount = cashAmount + onlineAmount

  useEffect(() => {
    fetch("/api/tenant/customers?limit=all").then(r => r.json()).then(d => setCustomers(d.data))
  }, [])

  const refreshData = (customerId: string) => {
    if (!customerId) {
      setSelectedCustomerObj(null)
      setPayments([])
      setCustomerSales([])
      return
    }
    const customer = customers.find(c => c._id === customerId)
    setSelectedCustomerObj(customer || null)
    fetch(`/api/tenant/finance/credit/list?customerId=${customerId}`).then(r => r.json()).then(d => setPayments(d))
    fetch(`/api/tenant/sales/list?customerId=${customerId}`).then(r => r.json()).then(d => setCustomerSales(d))
  }

  useEffect(() => { refreshData(selectedCustomer) }, [selectedCustomer, customers])

  const collectPayment = async () => {
    if (!selectedCustomer) return alert("Select customer")
    if (totalAmount <= 0) return alert("Invalid amount")
    if (!selectedCustomerObj) return
    if (totalAmount > selectedCustomerObj.outstandingBalance) return alert("Amount exceeds outstanding balance")
    const res = await fetch("/api/tenant/finance/credit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: selectedCustomer, cashAmount, onlineAmount, note: "Manual credit collection", creditDate: creditDate || undefined }),
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    alert("Payment collected"); setCashAmount(0); setOnlineAmount(0); setCreditDate("")
    // Re-fetch customer list and refresh
    const cRes = await fetch("/api/tenant/customers?limit=all").then(r => r.json())
    setCustomers(cRes.data || [])
    refreshData(selectedCustomer)
  }

  const cancelPayment = async (id: string) => {
    if (!confirm("Cancel this payment?")) return
    const res = await fetch(`/api/tenant/finance/credit/${id}`, { method: "PATCH" })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    alert("Payment cancelled")
    const cRes = await fetch("/api/tenant/customers?limit=all").then(r => r.json())
    setCustomers(cRes.data || [])
    refreshData(selectedCustomer)
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {viewingSale && <BillDetailModal sale={viewingSale} onClose={() => setViewingSale(null)} />}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Finance</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Credit Management</h1>
          <p className="text-slate-500 text-sm mt-1">Collect outstanding payments and view customer sales history</p>
        </div>

        {/* Customer selector - full width */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 mb-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Customer</label>
          <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className={inputCls}>
            <option value="">Select customer</option>
            {customers.map(c => <option key={c._id} value={c._id}>{c.name} {c.outstandingBalance > 0 ? `(₹${fmt(c.outstandingBalance)} due)` : ""}</option>)}
          </select>
        </div>

        {/* Two column layout */}
        <div className="flex gap-6">
          {/* LEFT — Credit collection + payment history */}
          <div className="w-1/2 space-y-6">
            {/* Payment form */}
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-1">Collect Payment</h2>
              <p className="text-xs text-slate-400 mb-5">Enter the payment amount to collect</p>

              {selectedCustomerObj && (
                <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-between">
                  <span className="text-sm text-amber-700 font-medium">Outstanding Balance</span>
                  <span className="text-lg font-bold text-amber-800">₹ {fmt(selectedCustomerObj.outstandingBalance)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cash (₹)</label>
                  <input type="number" placeholder="0" value={cashAmount} onChange={e => setCashAmount(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Online (₹)</label>
                  <input type="number" placeholder="0" value={onlineAmount} onChange={e => setOnlineAmount(Number(e.target.value))} className={inputCls} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Date</label>
                <input type="date" value={creditDate} onChange={e => setCreditDate(e.target.value)} className={inputCls} />
                <p className="text-[11px] text-slate-400 mt-1">Leave blank for today</p>
              </div>

              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-slate-500">Total payment</span>
                <span className="font-semibold text-slate-900">₹ {fmt(totalAmount)}</span>
              </div>

              <button onClick={collectPayment} disabled={!selectedCustomer} className="w-full py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                Collect Payment →
              </button>
            </div>

            {/* Payment history */}
            {selectedCustomer && (
              <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-semibold text-slate-900">Payment History</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{payments.length} payment{payments.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-100">
                        {["Date", "Amount", "Status", "Action"].map(h => (
                          <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 ${h === "Action" ? "text-center" : h === "Amount" ? "text-right" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-3 text-slate-600 text-xs">{new Date(p.creditDate || p.createdAt).toLocaleString("en-IN")}</td>
                          <td className="px-5 py-3 text-right">
                            <span className="font-semibold text-slate-900">₹{fmt(p.amount)}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">Cash ₹{fmt(p.cashAmount)} · Online ₹{fmt(p.onlineAmount)}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${p.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{p.status}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {p.status === "active" && (
                              <button onClick={() => cancelPayment(p._id)} className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all">Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && <tr><td colSpan={4} className="text-center p-8 text-slate-400 text-sm">No payments found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Customer sales */}
          <div className="w-1/2">
            <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900">Customer Sales</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedCustomer ? `${customerSales.length} sale${customerSales.length !== 1 ? "s" : ""} found` : "Select a customer to view sales"}
                </p>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {!selectedCustomer ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <p className="text-sm">Select a customer</p>
                  </div>
                ) : customerSales.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">No sales found for this customer</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Invoice</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Date</th>
                        <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Amount</th>
                        <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">Due</th>
                        <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSales.map(s => (
                        <tr key={s._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-mono text-blue-600 text-xs">{s.saleNumber}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{s.items?.length || 0} item{(s.items?.length || 0) !== 1 ? "s" : ""}</span>
                          </td>
                          <td className="px-5 py-3 text-slate-600 text-xs">{new Date(s.saleDate).toLocaleDateString("en-IN")}</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-slate-800">₹{fmt(s.totalAmount)}</td>
                          <td className={`px-5 py-3 text-right font-mono font-semibold ${s.dueAmount > 0 ? "text-red-500" : "text-slate-400"}`}>₹{fmt(s.dueAmount)}</td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => setViewingSale(s)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-400 inline-flex items-center justify-center transition-colors" title="View bill details">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
