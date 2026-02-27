"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface Product { _id: string; name: string; category?: string; morningStock: number; currentStock: number }

export default function TenantDashboard() {
  const [showStockReceipt, setShowStockReceipt] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

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

  const handlePrint = () => {
    if (!receiptRef.current) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Stock Check Receipt</title><style>
      @page { size: A4; margin: 12mm 10mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
      .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 10px; }
      .header h1 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
      .header p { font-size: 10px; color: #555; margin-top: 3px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #f0f0f0; border: 1px solid #bbb; padding: 5px 8px; text-align: left; font-weight: 600; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; }
      td { border: 1px solid #ccc; padding: 4px 8px; }
      tr:nth-child(even) { background: #fafafa; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .closing-col { min-width: 80px; }
      .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 6px; }
    </style></head><body>${receiptRef.current.innerHTML}<div class="footer">Generated on ${new Date().toLocaleString("en-IN")} &middot; Stock Check Receipt</div></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
  }

  const handleDownload = () => {
    if (!receiptRef.current) return
    const html = `<!DOCTYPE html><html><head><title>Stock Check Receipt</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
      .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 10px; }
      .header h1 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
      .header p { font-size: 10px; color: #555; margin-top: 3px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #f0f0f0; border: 1px solid #bbb; padding: 5px 8px; text-align: left; font-weight: 600; font-size: 9.5px; text-transform: uppercase; }
      td { border: 1px solid #ccc; padding: 4px 8px; }
      tr:nth-child(even) { background: #fafafa; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .closing-col { min-width: 80px; }
      .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 6px; }
    </style></head><body>${receiptRef.current.innerHTML}<div class="footer">Generated on ${new Date().toLocaleString("en-IN")}</div></body></html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stock-check-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
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

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">Overview</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome to your workspace overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: "Total users", value: "—", bg: "#EEF2FF", border: "#C7D2FE", text: "#4338CA" },
            { label: "Active members", value: "—", bg: "#F0FDF4", border: "#A7F3D0", text: "#047857" },
            { label: "Admins", value: "—", bg: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 border" style={{ borderColor: stat.border }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: stat.bg, color: stat.text }}>{stat.value}</div>
              </div>
              <div className="h-1 rounded-full" style={{ background: stat.bg }}><div className="h-1 rounded-full w-2/3" style={{ background: stat.border }}></div></div>
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
            {quickActions.map((action) => (
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
              <p className="text-xs text-slate-400 mt-0.5">Print a receipt for physical stock counting</p>
            </div>
            <button onClick={() => setShowStockReceipt(!showStockReceipt)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${showStockReceipt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
              {showStockReceipt ? "Hide Preview" : "Generate Receipt"}
            </button>
          </div>

          {showStockReceipt && (
            <div>
              {/* Action buttons */}
              <div className="flex items-center gap-3 mb-4">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download
                </button>
                <button onClick={loadProducts} disabled={loadingProducts} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-500 hover:border-blue-300 transition-all disabled:opacity-50">
                  <svg className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
                <span className="text-xs text-slate-400 ml-auto">{products.length} products</span>
              </div>

              {/* Receipt preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto bg-white">
                <div ref={receiptRef}>
                  <div className="header" style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: 8, margin: "16px 16px 10px 16px" }}>
                    <h1 style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Stock Check Receipt</h1>
                    <p style={{ fontSize: 10, color: "#555", marginTop: 3 }}>Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} &middot; {products.length} Products</p>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th style={{ background: "#f0f0f0", border: "1px solid #bbb", padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3, width: 40 }}>#</th>
                        <th style={{ background: "#f0f0f0", border: "1px solid #bbb", padding: "6px 10px", textAlign: "left", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3 }}>Product Name</th>
                        <th style={{ background: "#f0f0f0", border: "1px solid #bbb", padding: "6px 10px", textAlign: "right", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3, width: 90 }}>Opening Stock</th>
                        <th style={{ background: "#f0f0f0", border: "1px solid #bbb", padding: "6px 10px", textAlign: "right", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3, width: 90 }}>Current Stock</th>
                        <th style={{ background: "#f0f0f0", border: "1px solid #bbb", padding: "6px 10px", textAlign: "center", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3, width: 110 }}>Closing Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, idx) => (
                        <tr key={p._id} style={{ background: idx % 2 === 1 ? "#fafafa" : "white" }}>
                          <td style={{ border: "1px solid #ccc", padding: "4px 10px", color: "#888", fontSize: 10 }}>{idx + 1}</td>
                          <td style={{ border: "1px solid #ccc", padding: "4px 10px", fontWeight: 500 }}>{p.name}</td>
                          <td style={{ border: "1px solid #ccc", padding: "4px 10px", textAlign: "right", fontFamily: "monospace" }}>{p.morningStock ?? "—"}</td>
                          <td style={{ border: "1px solid #ccc", padding: "4px 10px", textAlign: "right", fontFamily: "monospace" }}>{p.currentStock ?? "—"}</td>
                          <td style={{ border: "1px solid #ccc", padding: "4px 10px", textAlign: "center", fontFamily: "monospace", color: "#bbb", letterSpacing: 3 }}>________</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
