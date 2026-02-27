"use client"

import { useEffect, useState } from "react"

interface SaleItem { productName: string; quantity: number; pricePerUnit: number; discountAmount?: number; totalAmount: number }
interface SubBill { items: SaleItem[]; subTotalAmount: number; totalDiscountAmount: number; totalAmount: number; paymentMode: string; cashPaidAmount: number; onlinePaidAmount: number; creditPaidAmount: number }
interface Sale { _id: string; saleNumber: string; saleDate: string; customerName: string; totalAmount: number; paidAmount: number; dueAmount: number; paymentStatus: string; paymentMode?: string; cashAmount?: number; onlineAmount?: number; creditAmount?: number; type: string; isReturned: boolean; status: string; items?: SaleItem[]; subBills?: SubBill[] }
const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`

export default function ManageSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [viewSale, setViewSale] = useState<Sale | null>(null)
  const [minReturnDate, setMinReturnDate] = useState<string>("")

  const fetchSales = async () => {
    const res = await fetch("/api/tenant/sales/list")
    const data = await res.json(); setSales(data)
  }
  useEffect(() => {
    fetchSales()
    fetch("/api/tenant/products?limit=0").then(r => r.json()).then(d => {
      const dates = (d.data || []).map((p: any) => p.morningStockLastUpdatedDate).filter(Boolean).map((dt: string) => new Date(dt).getTime())
      if (dates.length > 0) setMinReturnDate(new Date(Math.max(...dates)).toISOString())
    })
  }, [])

  const handleReturn = async (id: string) => {
    if (!confirm("Are you sure you want to return this sale?")) return
    setLoading(true)
    const res = await fetch(`/api/tenant/sales/return/${id}`, { method: "POST" })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { alert(data.error); return }
    alert("Sale Returned Successfully"); fetchSales()
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Sales</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Manage Sales</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage all transactions</p>
        </div>

        {/* Items overlay */}
        {viewSale && (
          <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setViewSale(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">Sale Items</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{viewSale.saleNumber} &middot; {viewSale.customerName} &middot; {new Date(viewSale.saleDate).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setViewSale(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {viewSale.subBills && viewSale.subBills.length > 0 ? (
                  <div>
                    {viewSale.subBills.map((sb, sbIdx) => (
                      <div key={sbIdx}>
                        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Sub-Bill {sbIdx + 1}</span>
                          <span className="text-xs font-mono text-slate-600">₹{(sb.totalAmount || 0).toLocaleString("en-IN")} · Cash: ₹{(sb.cashPaidAmount || 0).toLocaleString("en-IN")} · Online: ₹{(sb.onlinePaidAmount || 0).toLocaleString("en-IN")}{sb.creditPaidAmount > 0 && ` · Credit: ₹${sb.creditPaidAmount.toLocaleString("en-IN")}`}</span>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                              {["Product", "Qty", "Price", "Discount", "Total"].map(h => (
                                <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3 ${h === "Product" ? "text-left" : "text-right"}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(sb.items || []).map((item, idx) => (
                              <tr key={idx} className="border-t border-slate-50 hover:bg-blue-50/20">
                                <td className="px-6 py-3 font-medium text-slate-900">{item.productName}</td>
                                <td className="px-6 py-3 text-right text-slate-600">{item.quantity}</td>
                                <td className="px-6 py-3 text-right font-mono text-slate-600">₹{item.pricePerUnit?.toLocaleString("en-IN")}</td>
                                <td className="px-6 py-3 text-right font-mono text-emerald-600">{(item.discountAmount || 0) > 0 ? `₹${item.discountAmount!.toLocaleString("en-IN")}` : "—"}</td>
                                <td className="px-6 py-3 text-right font-mono font-semibold text-slate-900">₹{item.totalAmount?.toLocaleString("en-IN")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {["Product", "Qty", "Price", "Discount", "Total"].map(h => (
                        <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3 ${h === "Product" ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(viewSale.items || []).map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-50 hover:bg-blue-50/20">
                        <td className="px-6 py-3 font-medium text-slate-900">{item.productName}</td>
                        <td className="px-6 py-3 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-6 py-3 text-right font-mono text-slate-600">₹{item.pricePerUnit?.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-3 text-right font-mono text-emerald-600">{(item.discountAmount || 0) > 0 ? `₹${item.discountAmount!.toLocaleString("en-IN")}` : "—"}</td>
                        <td className="px-6 py-3 text-right font-mono font-semibold text-slate-900">₹{item.totalAmount?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">Total: <span className="font-mono font-bold text-slate-900">₹{viewSale.totalAmount?.toLocaleString("en-IN")}</span></span>
                <button onClick={() => setViewSale(null)} className="px-6 py-2 text-sm font-semibold text-white rounded-xl" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Sale No", "Date", "Customer", "Total", "Mode", "Cash", "Online", "Credit", "Due", "Type", "Status", "Action"].map(h => (
                  <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "Action" ? "text-center" : ["Total", "Cash", "Online", "Credit", "Due"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-blue-600 font-medium">{sale.saleNumber}</td>
                  <td className="px-5 py-4 text-slate-500">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{sale.customerName}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900 text-right font-mono">₹{(sale.totalAmount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${sale.paymentMode === "credit" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{sale.paymentMode || "cash"}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-slate-600">{(sale.cashAmount || 0) > 0 ? `₹${sale.cashAmount!.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-slate-600">{(sale.onlineAmount || 0) > 0 ? `₹${sale.onlineAmount!.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-slate-600">{(sale.creditAmount || 0) > 0 ? `₹${sale.creditAmount!.toLocaleString("en-IN")}` : "—"}</td>
                  <td className={`px-5 py-4 text-right font-mono text-xs ${(sale.dueAmount || 0) > 0 ? "text-red-500 font-semibold" : "text-slate-400"}`}>{(sale.dueAmount || 0) > 0 ? `₹${sale.dueAmount!.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${sale.type === "return" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>{sale.type}</span>
                  </td>
                  <td className="px-5 py-4">
                    {sale.status === "voided" ? (
                      <span className="text-xs text-slate-400 font-medium">Voided</span>
                    ) : sale.isReturned ? (
                      <span className="text-xs text-red-500 font-medium">Returned</span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setViewSale(sale)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-colors" title="View items">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {sale.type === "sale" && !sale.isReturned && sale.status === "active" && (() => {
                        const isBefore = minReturnDate && new Date(sale.saleDate) < new Date(minReturnDate)
                        return (
                          <button onClick={() => handleReturn(sale._id)} disabled={loading || !!isBefore}
                            title={isBefore ? "Cannot return: sale is before morning stock date" : "Return this sale"}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50">
                            Return
                          </button>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {sales.length === 0 && <div className="py-16 text-center text-slate-400">No sales found</div>}
        </div>
      </div>
    </div>
  )
}
