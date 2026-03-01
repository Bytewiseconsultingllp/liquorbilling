"use client"

import { useCallback, useEffect, useState } from "react"

interface Product { _id: string; name: string; brand?: string; category?: string; volumeML?: number; morningStock: number; currentStock: number }
interface DashStats {
  users: { total: number; active: number }
  products: { total: number; lowStock: number }
  customers: { total: number; withDues: number; totalOutstanding: number }
  todaySales: { count: number; totalAmount: number; totalPaid: number; totalDue: number; totalCash: number; totalOnline: number; totalCredit: number }
}

const INR = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function TenantDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [showStockReceipt, setShowStockReceipt] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    fetch("/api/tenant/dashboard").then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch("/api/tenant/products?limit=0")
      const data = await res.json()
      setProducts((data.data || []).sort((a: Product, b: Product) => a.name.localeCompare(b.name)))
    } catch { /* ignore */ }
    setLoadingProducts(false)
  }, [])

  useEffect(() => {
    if (showStockReceipt && products.length === 0) loadProducts()
  }, [showStockReceipt, products.length, loadProducts])

  /* ---------- Thermal Stock Receipt Print (80mm, dynamic-length) ---------- */
  const handlePrint = () => {
    if (products.length === 0) return
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

    let rows = ""
    products.forEach((p, i) => {
      rows += `<tr${i % 2 === 1 ? ' style="background:#f9f9f9"' : ""}>
        <td class="r" style="color:#888;font-size:9px">${i + 1}</td>
        <td>${p.name}${p.volumeML ? ` <span style="font-size:8px;color:#888">${p.volumeML}ml</span>` : ""}</td>
        <td class="r mono">${p.morningStock ?? "—"}</td>
        <td class="r mono">${p.currentStock ?? "—"}</td>
        <td class="closing">________</td>
      </tr>`
    })

    const html = `<!DOCTYPE html><html><head><style>
      @page { size: 80mm auto; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; width: 80mm; padding: 3mm; }
      .center { text-align: center; }
      .bold { font-weight: 700; }
      .mono { font-family: 'Courier New', monospace; }
      .r { text-align: right; }
      .line { border-top: 1px dashed #000; margin: 4px 0; }
      .dbl-line { border-top: 2px solid #000; margin: 5px 0; }
      .shop { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
      .sub { font-size: 9px; color: #555; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin: 3px 0; }
      th { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; padding: 3px 2px; border-bottom: 1px solid #000; text-align: left; }
      th.r { text-align: right; }
      td { font-size: 10px; padding: 2px; vertical-align: top; }
      .closing { text-align: center; font-family: 'Courier New', monospace; color: #aaa; letter-spacing: 2px; min-width: 50px; }
      .footer { font-size: 8px; color: #888; margin-top: 6px; text-align: center; }
      .summary { font-size: 10px; margin: 2px 0; display: flex; justify-content: space-between; }
    </style></head><body>
      <div class="center shop">Stock Check</div>
      <div class="center sub">Physical Stock Verification Receipt</div>
      <div class="dbl-line"></div>
      <div class="summary"><span><b>Date:</b> ${dateStr}</span><span><b>Time:</b> ${timeStr}</span></div>
      <div class="summary"><span><b>Total Items:</b> ${products.length}</span></div>
      <div class="line"></div>
      <table>
        <thead>
          <tr><th class="r" style="width:18px">#</th><th>Product</th><th class="r">Open</th><th class="r">Curr</th><th style="text-align:center">Close</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="dbl-line"></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin:4px 0">
        <span><b>Verified By:</b> ____________</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin:4px 0">
        <span><b>Signature:</b> ____________</span>
      </div>
      <div class="line"></div>
      <div class="footer">Generated ${dateStr} ${timeStr}</div>
      <div class="footer" style="margin-top:2px">--- End of Stock Check ---</div>
    </body></html>`

    const w = window.open("", "_blank", "width=320,height=600")
    if (!w) { alert("Popup blocked. Please allow popups."); return }
    w.document.write(html)
    w.document.close()
    w.onload = () => { w.focus(); w.print() }
  }

  const handleDownload = () => {
    if (products.length === 0) return
    const now = new Date()
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

    let rows = ""
    products.forEach((p, i) => {
      rows += `<tr${i % 2 === 1 ? ' style="background:#fafafa"' : ""}>
        <td style="border:1px solid #ccc;padding:4px 6px;color:#888;font-size:10px">${i + 1}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;font-weight:500">${p.name}${p.volumeML ? ` (${p.volumeML}ml)` : ""}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;text-align:right;font-family:monospace">${p.morningStock ?? "—"}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;text-align:right;font-family:monospace">${p.currentStock ?? "—"}</td>
        <td style="border:1px solid #ccc;padding:4px 6px;text-align:center;font-family:monospace;color:#bbb;letter-spacing:3px">________</td>
      </tr>`
    })

    const html = `<!DOCTYPE html><html><head><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',Arial,sans-serif; font-size:11px; padding:20px; color:#1a1a1a; }
      h1 { font-size:16px; text-align:center; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
      .meta { text-align:center; font-size:10px; color:#555; margin-bottom:12px; }
      table { width:100%; border-collapse:collapse; font-size:10px; }
      th { background:#f0f0f0; border:1px solid #bbb; padding:5px 8px; text-align:left; font-weight:600; font-size:9.5px; text-transform:uppercase; }
      .footer { margin-top:20px; text-align:center; font-size:9px; color:#999; border-top:1px solid #ddd; padding-top:6px; }
    </style></head><body>
      <h1>Stock Check Receipt</h1>
      <p class="meta">Date: ${dateStr} &middot; ${products.length} Products</p>
      <table><thead><tr>
        <th style="width:30px">#</th><th>Product Name</th><th style="text-align:right">Opening</th><th style="text-align:right">Current</th><th style="text-align:center;min-width:80px">Closing</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">Generated on ${new Date().toLocaleString("en-IN")}</div>
    </body></html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `stock-check-${new Date().toISOString().slice(0, 10)}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  const quickActions = [
    { label: "Manage users", desc: "Add, remove, or update user roles", href: "users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", color: "#EEF2FF" },
    { label: "Products", desc: "View and manage your product catalog", href: "products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "#F0F9FF" },
    { label: "New sale", desc: "Create a sale at the POS", href: "sales", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "#F0FDF4" },
    { label: "Customers", desc: "Manage customer relationships", href: "customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "#FFFBEB" },
    { label: "Vendors", desc: "Track your supplier relationships", href: "vendors", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "#FDF4FF" },
    { label: "Purchases", desc: "Record and track vendor purchases", href: "purchases", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", color: "#FFF7ED" },
  ]

  const s = stats

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">Overview</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome to your workspace overview</p>
        </div>

        {/* Today's Sales Summary */}
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Today&apos;s Sales</h2>
              <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>{s ? INR(s.todaySales.totalAmount) : "—"}</p>
              <p className="text-xs text-slate-400">{s ? `${s.todaySales.count} transactions` : ""}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Cash Collection", value: s ? INR(s.todaySales.totalCash) : "—", color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
              { label: "Online Collection", value: s ? INR(s.todaySales.totalOnline) : "—", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
              { label: "Credit Given", value: s ? INR(s.todaySales.totalCredit) : "—", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
              { label: "Due Amount", value: s ? INR(s.todaySales.totalDue) : "—", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
            ].map(c => (
              <div key={c.label} className="rounded-xl p-4 border" style={{ background: c.bg, borderColor: c.border }}>
                <p className="text-xs font-medium mb-1" style={{ color: c.color }}>{c.label}</p>
                <p className="text-sm font-bold font-mono" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-5 mb-6">
          {[
            { label: "Total Users", value: s ? String(s.users.total) : "—", sub: s ? `${s.users.active} active` : "", bg: "#EEF2FF", border: "#C7D2FE", text: "#4338CA" },
            { label: "Products", value: s ? String(s.products.total) : "—", sub: s && s.products.lowStock > 0 ? `${s.products.lowStock} low stock` : "All stocked", bg: "#F0F9FF", border: "#BAE6FD", text: "#0369A1" },
            { label: "Customers", value: s ? String(s.customers.total) : "—", sub: s && s.customers.withDues > 0 ? `${s.customers.withDues} with dues` : "No dues", bg: "#F0FDF4", border: "#A7F3D0", text: "#047857" },
            { label: "Outstanding", value: s ? INR(s.customers.totalOutstanding) : "—", sub: s && s.customers.withDues > 0 ? `${s.customers.withDues} customers` : "Clear", bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border" style={{ borderColor: stat.border }}>
              <p className="text-xs font-medium text-slate-500 mb-2">{stat.label}</p>
              <p className="text-xl font-bold mb-1" style={{ color: stat.text }}>{stat.value}</p>
              <p className="text-[11px]" style={{ color: stat.text + "99" }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-900">Quick actions</h2>
            <span className="text-xs text-slate-400">{quickActions.length} shortcuts</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(action => (
              <a key={action.label} href={action.href}
                className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                style={{ background: action.color }}>
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg width="16" height="16" fill="none" stroke="#2563EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d={action.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{action.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Stock Check Receipt */}
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Stock Check Receipt</h2>
              <p className="text-xs text-slate-400 mt-0.5">Print a thermal receipt for physical stock counting</p>
            </div>
            <button onClick={() => setShowStockReceipt(!showStockReceipt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${showStockReceipt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
              {showStockReceipt ? "Hide Preview" : "Generate Receipt"}
            </button>
          </div>

          {showStockReceipt && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print Thermal
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download A4
                </button>
                <button onClick={loadProducts} disabled={loadingProducts} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-500 hover:border-blue-300 transition-all disabled:opacity-50">
                  <svg className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
                <span className="text-xs text-slate-400 ml-auto">{products.length} products</span>
              </div>

              {/* Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto bg-white">
                <div className="p-4">
                  <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider">Stock Check Receipt</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} &middot; {products.length} Products</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-300">
                        <th className="py-1.5 pr-2 text-right text-[10px] font-bold uppercase text-slate-500 w-6">#</th>
                        <th className="py-1.5 px-2 text-left text-[10px] font-bold uppercase text-slate-500">Product</th>
                        <th className="py-1.5 px-2 text-right text-[10px] font-bold uppercase text-slate-500 w-16">Open</th>
                        <th className="py-1.5 px-2 text-right text-[10px] font-bold uppercase text-slate-500 w-16">Curr</th>
                        <th className="py-1.5 pl-2 text-center text-[10px] font-bold uppercase text-slate-500 w-20">Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={p._id} className={i % 2 === 1 ? "bg-slate-50" : ""}>
                          <td className="py-1 pr-2 text-right text-[10px] text-slate-400">{i + 1}</td>
                          <td className="py-1 px-2 font-medium text-slate-800">{p.name}{p.volumeML ? <span className="text-[9px] text-slate-400 ml-1">{p.volumeML}ml</span> : null}</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-600">{p.morningStock ?? "—"}</td>
                          <td className="py-1 px-2 text-right font-mono text-slate-600">{p.currentStock ?? "—"}</td>
                          <td className="py-1 pl-2 text-center font-mono text-slate-300 tracking-widest">________</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">Loading products...</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
