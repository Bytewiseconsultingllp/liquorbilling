"use client"

import { useEffect, useState } from "react"

interface SaleItem { productName: string; quantity: number; pricePerUnit: number; discountAmount?: number; totalAmount: number }
interface SubBill { items: SaleItem[]; subTotalAmount: number; totalDiscountAmount: number; totalAmount: number; paymentMode: string; cashPaidAmount: number; onlinePaidAmount: number; creditPaidAmount: number }
interface Sale { _id: string; saleNumber: string; saleDate: string; customerName: string; subtotal?: number; totalAmount: number; paidAmount: number; dueAmount: number; billDiscountAmount?: number; totalDiscount?: number; paymentStatus: string; paymentMode?: string; cashAmount?: number; onlineAmount?: number; creditAmount?: number; type: string; isReturned: boolean; status: string; items?: SaleItem[]; subBills?: SubBill[] }
const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`

const INR = (n: number | undefined | null) => `${(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

function thermalCSS(): string {
  return `
    @page { size: 80mm auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 80mm; padding: 4mm; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .line { border-top: 1px dashed #000; margin: 4px 0; }
    .dbl-line { border-top: 2px solid #000; margin: 6px 0; }
    .shop { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
    .sub-title { font-size: 11px; margin-top: 2px; }
    .meta { font-size: 11px; margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    th, td { font-size: 11px; padding: 2px 0; vertical-align: top; }
    th { text-align: left; font-weight: 700; border-bottom: 1px solid #000; }
    .r { text-align: right; }
    .summary-row { display: flex; justify-content: space-between; font-size: 12px; padding: 1px 0; }
    .summary-row.total { font-size: 14px; font-weight: 900; }
    .footer-msg { font-size: 10px; margin-top: 8px; }
  `
}

function buildItemsTableHtml(items: SaleItem[]): string {
  let html = `<table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead><tbody>`
  for (const it of items) {
    html += `<tr><td>${it.productName}</td><td class="r">${it.quantity}</td><td class="r">${INR(it.pricePerUnit)}</td><td class="r">${INR(it.totalAmount)}</td></tr>`
    if ((it.discountAmount || 0) > 0) html += `<tr><td colspan="3" style="font-size:10px;color:#555;padding-left:8px">Disc</td><td class="r" style="font-size:10px;color:#555">-${INR(it.discountAmount)}</td></tr>`
  }
  html += `</tbody></table>`
  return html
}

function buildSummaryHtml(label: string, subtotal: number, discount: number, total: number, cash: number, online: number, credit: number, due: number): string {
  let html = `<div class="dbl-line"></div>`
  if (label) html += `<div class="center bold" style="margin-bottom:4px">${label}</div>`
  html += `<div class="summary-row"><span>Subtotal</span><span>${INR(subtotal)}</span></div>`
  if (discount > 0) html += `<div class="summary-row"><span>Discount</span><span>-${INR(discount)}</span></div>`
  html += `<div class="line"></div><div class="summary-row total"><span>TOTAL</span><span>${INR(total)}</span></div><div class="line"></div>`
  if (cash > 0) html += `<div class="summary-row"><span>Cash</span><span>${INR(cash)}</span></div>`
  if (online > 0) html += `<div class="summary-row"><span>Online</span><span>${INR(online)}</span></div>`
  if (credit > 0) html += `<div class="summary-row"><span>Credit</span><span>${INR(credit)}</span></div>`
  if (due > 0) html += `<div class="summary-row" style="color:red"><span>Due</span><span>${INR(due)}</span></div>`
  return html
}

function thermalPrint(html: string) {
  const w = window.open("", "_blank", "width=320,height=600")
  if (!w) { alert("Popup blocked. Please allow popups."); return }
  w.document.write(html)
  w.document.close()
  w.onload = () => { w.focus(); w.print() }
}

function printFullBill(sale: Sale) {
  const items = sale.items || []
  const allItems = sale.subBills && sale.subBills.length > 0 ? sale.subBills.flatMap(sb => sb.items) : items
  const subtotal = allItems.reduce((a, b) => a + b.quantity * b.pricePerUnit, 0)
  const totalDisc = allItems.reduce((a, b) => a + (b.discountAmount || 0), 0) + (sale.billDiscountAmount || 0)
  const html = `<!DOCTYPE html><html><head><style>${thermalCSS()}</style></head><body>
    <div class="center shop">LIQUOR BILL</div>
    <div class="center sub-title">Tax Invoice</div>
    <div class="dbl-line"></div>
    <div class="meta"><b>Bill:</b> ${sale.saleNumber}</div>
    <div class="meta"><b>Date:</b> ${fmtDt(sale.saleDate)}</div>
    <div class="meta"><b>Customer:</b> ${sale.customerName}</div>
    <div class="line"></div>
    ${buildItemsTableHtml(allItems)}
    ${buildSummaryHtml("", subtotal, totalDisc, sale.totalAmount, sale.cashAmount || 0, sale.onlineAmount || 0, sale.creditAmount || 0, sale.dueAmount || 0)}
    ${sale.subBills && sale.subBills.length > 1 ? `<div style="margin-top:4px;font-size:10px;text-align:center;color:#555">(Split into ${sale.subBills.length} sub-bills)</div>` : ""}
    <div class="dbl-line"></div>
    <div class="center footer-msg">Thank you for your purchase!</div>
    <div class="center footer-msg" style="margin-top:2px">--- End of Bill ---</div>
  </body></html>`
  thermalPrint(html)
}

function printSubBill(sale: Sale, sb: SubBill, idx: number) {
  const subtotal = sb.items.reduce((a, b) => a + b.quantity * b.pricePerUnit, 0)
  const html = `<!DOCTYPE html><html><head><style>${thermalCSS()}</style></head><body>
    <div class="center shop">LIQUOR BILL</div>
    <div class="center sub-title">Sub-Bill ${idx + 1} of ${(sale.subBills || []).length}</div>
    <div class="dbl-line"></div>
    <div class="meta"><b>Bill:</b> ${sale.saleNumber}</div>
    <div class="meta"><b>Date:</b> ${fmtDt(sale.saleDate)}</div>
    <div class="meta"><b>Customer:</b> ${sale.customerName}</div>
    <div class="line"></div>
    ${buildItemsTableHtml(sb.items)}
    ${buildSummaryHtml(`Sub-Bill ${idx + 1}`, subtotal, sb.totalDiscountAmount || 0, sb.totalAmount, sb.cashPaidAmount || 0, sb.onlinePaidAmount || 0, sb.creditPaidAmount || 0, 0)}
    <div class="dbl-line"></div>
    <div class="center footer-msg">Thank you for your purchase!</div>
    <div class="center footer-msg" style="margin-top:2px">--- End of Sub-Bill ---</div>
  </body></html>`
  thermalPrint(html)
}

export default function ManageSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [viewSale, setViewSale] = useState<Sale | null>(null)
  const [minReturnDate, setMinReturnDate] = useState<string>("")
  const [paymentPopover, setPaymentPopover] = useState<string | null>(null)

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
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }} onClick={() => paymentPopover && setPaymentPopover(null)}>
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
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-slate-600">₹{(sb.totalAmount || 0).toLocaleString("en-IN")} · Cash: ₹{(sb.cashPaidAmount || 0).toLocaleString("en-IN")} · Online: ₹{(sb.onlinePaidAmount || 0).toLocaleString("en-IN")}{sb.creditPaidAmount > 0 && ` · Credit: ₹${sb.creditPaidAmount.toLocaleString("en-IN")}`}</span>
                            <button onClick={() => printSubBill(viewSale, sb, sbIdx)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-all" title="Print this sub-bill">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                              Print
                            </button>
                          </div>
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
                <div className="flex items-center gap-2">
                  <button onClick={() => printFullBill(viewSale)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all bg-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Full Bill
                  </button>
                  {viewSale.subBills && viewSale.subBills.length > 1 && (
                    <button onClick={() => viewSale.subBills!.forEach((sb, i) => setTimeout(() => printSubBill(viewSale, sb, i), i * 600))} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all bg-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                      Print All Sub-Bills
                    </button>
                  )}
                  <button onClick={() => setViewSale(null)} className="px-6 py-2 text-sm font-semibold text-white rounded-xl" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Sale No", "Date", "Customer", "Total", "Payment", "Due", "Type", "Status", "Action"].map(h => (
                  <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "Action" ? "text-center" : ["Total", "Due"].includes(h) ? "text-right" : h === "Payment" ? "text-center" : "text-left"}`}>{h}</th>
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
                  <td className="px-5 py-4 text-center">
                    <div className="relative inline-block">
                      <button onClick={(e) => { e.stopPropagation(); setPaymentPopover(paymentPopover === sale._id ? null : sale._id) }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${paymentPopover === sale._id ? "bg-blue-100 text-blue-600" : "bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-400"}`}
                        title="View payment breakdown">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {paymentPopover === sale._id && (
                        <div className="absolute z-40 top-full mt-1.5 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[180px] text-left">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Breakdown</div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className={`font-medium capitalize ${sale.paymentMode === "credit" ? "text-amber-700" : "text-emerald-700"}`}>{sale.paymentMode || "cash"}</span></div>
                            {(sale.cashAmount || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">Cash</span><span className="font-mono font-medium text-slate-700">₹{sale.cashAmount!.toLocaleString("en-IN")}</span></div>}
                            {(sale.onlineAmount || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">Online</span><span className="font-mono font-medium text-slate-700">₹{sale.onlineAmount!.toLocaleString("en-IN")}</span></div>}
                            {(sale.creditAmount || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">Credit</span><span className="font-mono font-medium text-slate-700">₹{sale.creditAmount!.toLocaleString("en-IN")}</span></div>}
                            {(sale.cashAmount || 0) === 0 && (sale.onlineAmount || 0) === 0 && (sale.creditAmount || 0) === 0 && <div className="text-slate-400 text-center">—</div>}
                          </div>
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45"></div>
                        </div>
                      )}
                    </div>
                  </td>
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
                      <button onClick={() => printFullBill(sale)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-colors" title="Print bill">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
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
