"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

interface Product { _id: string; name: string; brand?: string; category?: string; volumeML?: number; morningStock: number; currentStock: number }
type DashboardPeriod = "daily" | "weekly" | "monthly"

interface DashStats {
  activePeriod?: DashboardPeriod
  todaySales: { count: number; total: number; paid: number; due: number; cash: number; online: number; credit: number; discount: number }
  todayPurchases: { count: number; total: number; subtotal: number; tax: number; paid: number; due: number }
  todayB2B: { count: number; total: number; paid: number; due: number; cash: number; online: number }
  todayExpenses: { count: number; total: number }
  todayCredit: { count: number; total: number; cash: number; online: number }
  users: { total: number; active: number }
  products: { total: number; lowStock: number; outOfStock: number }
  customers: { total: number; withDues: number; totalOutstanding: number }
  vendors: { total: number; totalDues: number }
  monthly: {
    sales: { total: number; cash: number; online: number; credit: number; discount: number; count: number }
    purchases: { total: number; paid: number; due: number; count: number }
    expenses: { total: number; count: number }
  }
  weeklyChart: {
    sales: { date: string; total: number; count: number }[]
    purchases: { date: string; total: number; count: number }[]
  }
  topProducts: { id: string; name: string; qty: number; amount: number }[]
  topCustomers: { id: string; name: string; amount: number; count: number }[]
  topVendors: { id: string; name: string; amount: number; paid: number; due: number; count: number }[]
  lowStockList: { id: string; name: string; brand: string; volumeML: number; currentStock: number; reorderLevel: number }[]
  stockValue: { retailValue: number; totalItems: number; productCount: number }
  recentSales: { id: string; number: string; customer: string; total: number; cash: number; online: number; credit: number; date: string; status: string }[]
  recentPurchases: { id: string; number: string; vendor: string; total: number; paid: number; due: number; date: string; status: string }[]
  lastClosing: { date: string; diffValue: number; cash: number; online: number } | null
}

const INR = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const INR0 = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const shortDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })

/* ──────────────── Section Card ──────────────── */
function Section({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-blue-100 p-6 shadow-sm ${className}`}>
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

/* ──────────────── Mini Stat Pill ──────────────── */
function Pill({ label, value, color, bg, border }: { label: string; value: string; color: string; bg: string; border: string }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: bg, borderColor: border }}>
      <p className="text-[11px] font-medium mb-0.5" style={{ color }}>{label}</p>
      <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
    </div>
  )
}

export default function TenantDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<DashboardPeriod>("daily")
  const [showStockReceipt, setShowStockReceipt] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "activity">("overview")

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/tenant/dashboard?period=${period}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))

    return () => controller.abort()
  }, [period])

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

  /* ---------- Weekly chart data ---------- */
  const weeklyData = useMemo(() => {
    if (!stats) return []
    const days: { label: string; date: string; sales: number; purchases: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString("en-IN", { weekday: "short" })
      const saleDay = stats.weeklyChart.sales.find(s => s.date === dateStr)
      const purchDay = stats.weeklyChart.purchases.find(p => p.date === dateStr)
      days.push({ label, date: dateStr, sales: saleDay?.total || 0, purchases: purchDay?.total || 0 })
    }
    return days
  }, [stats])

  const weeklyMax = useMemo(() => Math.max(1, ...weeklyData.map(d => Math.max(d.sales, d.purchases))), [weeklyData])

  const periodMeta = useMemo(() => {
    const labels: Record<DashboardPeriod, { title: string; possessive: string }> = {
      daily: { title: "Daily", possessive: "Today's" },
      weekly: { title: "Weekly", possessive: "This week's" },
      monthly: { title: "Monthly", possessive: "This month's" },
    }
    return labels[period]
  }, [period])

  /* ---------- Selected period net cash flow ---------- */
  const selectedNetCash = useMemo(() => {
    if (!stats) return 0
    const inflow = stats.todaySales.cash + stats.todaySales.online + stats.todayB2B.cash + stats.todayB2B.online + stats.todayCredit.total
    const outflow = stats.todayPurchases.paid + stats.todayExpenses.total
    return inflow - outflow
  }, [stats])

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
      .center { text-align: center; } .bold { font-weight: 700; } .mono { font-family: 'Courier New', monospace; }
      .r { text-align: right; } .line { border-top: 1px dashed #000; margin: 4px 0; }
      .dbl-line { border-top: 2px solid #000; margin: 5px 0; }
      .shop { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
      .sub { font-size: 9px; color: #555; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin: 3px 0; }
      th { font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 3px 2px; border-bottom: 1px solid #000; text-align: left; }
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
      <table><thead><tr><th class="r" style="width:18px">#</th><th>Product</th><th class="r">Open</th><th class="r">Curr</th><th style="text-align:center">Close</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <div class="dbl-line"></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin:4px 0"><span><b>Verified By:</b> ____________</span></div>
      <div style="display:flex;justify-content:space-between;font-size:10px;margin:4px 0"><span><b>Signature:</b> ____________</span></div>
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
    a.href = url; a.download = `stock-check-${new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  const s = stats

  const quickActions = [
    { label: "New Sale", href: "sales", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z", color: "#F0FDF4" },
    { label: "Purchase", href: "purchases", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", color: "#EFF6FF" },
    { label: "Inventory", href: "inventory", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "#FDF4FF" },
    { label: "Products", href: "products", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "#F0F9FF" },
    { label: "Customers", href: "customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "#FFFBEB" },
    { label: "Reports", href: "reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "#FFF7ED" },
  ]

  /* ─── Skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="h-3 w-20 bg-blue-200 rounded mb-3 animate-pulse" />
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="grid grid-cols-4 gap-5 mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            <div className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 pb-20" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">Overview</p>
          <div className="flex items-end justify-between">
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
                {(["overview", "analytics", "activity"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
                {(["daily", "weekly", "monthly"] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => setPeriod(option)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${period === option ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
        {activeTab === "overview" && (
          <>
            {/* ──── Top-line KPIs ──── */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { label: `${periodMeta.title} Sales`, value: s ? INR(s.todaySales.total) : "—", sub: s ? `${s.todaySales.count} bills` : "", color: "#047857", bg: "#ECFDF5", border: "#A7F3D0", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
                { label: `${periodMeta.title} Purchases`, value: s ? INR(s.todayPurchases.total) : "—", sub: s ? `${s.todayPurchases.count} orders` : "", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" },
                { label: `${periodMeta.title} B2B`, value: s ? INR(s.todayB2B.total) : "—", sub: s ? `${s.todayB2B.count} invoices` : "", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { label: `${periodMeta.title} Expenses`, value: s ? INR(s.todayExpenses.total) : "—", sub: s ? `${s.todayExpenses.count} entries` : "", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                { label: `${periodMeta.title} Net Flow`, value: s ? INR(selectedNetCash) : "—", sub: s ? (selectedNetCash >= 0 ? "Positive" : "Negative") : "", color: selectedNetCash >= 0 ? "#047857" : "#DC2626", bg: selectedNetCash >= 0 ? "#ECFDF5" : "#FEF2F2", border: selectedNetCash >= 0 ? "#A7F3D0" : "#FECACA", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-2xl p-4 border flex flex-col justify-between" style={{ borderColor: kpi.border }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-medium text-slate-500">{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke={kpi.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={kpi.icon} /></svg>
                    </div>
                  </div>
                  <p className="text-lg font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: kpi.color + "99" }}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* ──── Today Sales Breakdown + Today Purchases Breakdown ──── */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <Section title="Sales Breakdown" subtitle={`${periodMeta.possessive} collection split`}>
                <div className="grid grid-cols-4 gap-3">
                  <Pill label="Cash" value={s ? INR(s.todaySales.cash) : "—"} color="#047857" bg="#ECFDF5" border="#A7F3D0" />
                  <Pill label="Online" value={s ? INR(s.todaySales.online) : "—"} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
                  <Pill label="Credit" value={s ? INR(s.todaySales.credit) : "—"} color="#D97706" bg="#FFFBEB" border="#FDE68A" />
                  <Pill label="Discount" value={s ? INR(s.todaySales.discount) : "—"} color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" />
                </div>
              </Section>
              <Section title="Purchase Breakdown" subtitle={`${periodMeta.possessive} purchase details`}>
                <div className="grid grid-cols-3 gap-3">
                  <Pill label="Subtotal" value={s ? INR(s.todayPurchases.subtotal) : "—"} color="#0369A1" bg="#F0F9FF" border="#BAE6FD" />
                  <Pill label="Paid" value={s ? INR(s.todayPurchases.paid) : "—"} color="#047857" bg="#ECFDF5" border="#A7F3D0" />
                  <Pill label="Due" value={s ? INR(s.todayPurchases.due) : "—"} color="#DC2626" bg="#FEF2F2" border="#FECACA" />
                </div>
              </Section>
            </div>

            {/* ──── Credit Collections + B2B ──── */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <Section title="Credit Collections" subtitle={`${periodMeta.possessive} due payments received`}>
                <div className="grid grid-cols-3 gap-3">
                  <Pill label="Total Collected" value={s ? INR(s.todayCredit.total) : "—"} color="#047857" bg="#ECFDF5" border="#A7F3D0" />
                  <Pill label="Cash" value={s ? INR(s.todayCredit.cash) : "—"} color="#B45309" bg="#FFFBEB" border="#FDE68A" />
                  <Pill label="Online" value={s ? INR(s.todayCredit.online) : "—"} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
                </div>
                {s && <p className="text-[11px] text-slate-400 mt-3">{s.todayCredit.count} payment(s) received in selected period</p>}
              </Section>
              <Section title="B2B Sales" subtitle={`${periodMeta.possessive} wholesale transactions`}>
                <div className="grid grid-cols-3 gap-3">
                  <Pill label="Total" value={s ? INR(s.todayB2B.total) : "—"} color="#7C3AED" bg="#F5F3FF" border="#DDD6FE" />
                  <Pill label="Cash" value={s ? INR(s.todayB2B.cash) : "—"} color="#047857" bg="#ECFDF5" border="#A7F3D0" />
                  <Pill label="Online" value={s ? INR(s.todayB2B.online) : "—"} color="#2563EB" bg="#EFF6FF" border="#BFDBFE" />
                </div>
                {s && <p className="text-[11px] text-slate-400 mt-3">{s.todayB2B.count} B2B invoice(s) in selected period</p>}
              </Section>
            </div>

            {/* ──── Entity Summary Cards ──── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Users", value: s?.users.total ?? "—", sub: s ? `${s.users.active} active` : "", color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
                { label: "Products", value: s?.products.total ?? "—", sub: s ? `${s.products.outOfStock} out, ${s.products.lowStock} low` : "", color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD" },
                { label: "Customers", value: s?.customers.total ?? "—", sub: s ? `${s.customers.withDues} with dues` : "", color: "#047857", bg: "#F0FDF4", border: "#A7F3D0" },
                { label: "Vendors", value: s?.vendors.total ?? "—", sub: s?.vendors.totalDues ? `${INR0(s.vendors.totalDues)} dues` : "No dues", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 border" style={{ borderColor: stat.border }}>
                  <p className="text-[11px] font-medium text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: stat.color + "99" }}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* ──── Outstanding + Stock Value + Last Closing ──── */}
            <div className="grid grid-cols-3 gap-5 mb-6">
              <Section title="Customer Outstanding">
                <p className="text-2xl font-bold text-red-600 font-mono" style={{ fontFamily: "'Playfair Display', serif" }}>{s ? INR(s.customers.totalOutstanding) : "—"}</p>
                <p className="text-xs text-slate-400 mt-1">{s ? `${s.customers.withDues} customers with pending dues` : ""}</p>
              </Section>
              <Section title="Stock Value">
                <p className="text-2xl font-bold text-blue-700 font-mono" style={{ fontFamily: "'Playfair Display', serif" }}>{s ? INR(s.stockValue.retailValue) : "—"}</p>
                <p className="text-xs text-slate-400 mt-1">{s ? `${s.stockValue.totalItems} units across ${s.stockValue.productCount} products` : ""}</p>
              </Section>
              <Section title="Last Closing">
                {s?.lastClosing ? (
                  <>
                    <p className="text-lg font-semibold text-slate-800">{shortDate(s.lastClosing.date)}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-slate-500">Diff: <span className="font-mono font-semibold text-slate-800">{INR(s.lastClosing.diffValue)}</span></span>
                      <span className="text-slate-500">Cash: <span className="font-mono font-semibold text-green-700">{INR(s.lastClosing.cash)}</span></span>
                      <span className="text-slate-500">Online: <span className="font-mono font-semibold text-blue-700">{INR(s.lastClosing.online)}</span></span>
                    </div>
                  </>
                ) : <p className="text-sm text-slate-400">No closing recorded yet</p>}
              </Section>
            </div>

            {/* ──── Quick Actions ──── */}
            <Section title="Quick Actions" subtitle="Navigate to key areas" className="mb-6">
              <div className="grid grid-cols-6 gap-3">
                {quickActions.map(action => (
                  <a key={action.label} href={action.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group text-center"
                    style={{ background: action.color }}>
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <svg width="16" height="16" fill="none" stroke="#2563EB" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} viewBox="0 0 24 24"><path d={action.icon} /></svg>
                    </div>
                    <p className="text-xs font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{action.label}</p>
                  </a>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
        {activeTab === "analytics" && (
          <>
            {/* ──── Weekly Chart ──── */}
            <Section title="Weekly Trend" subtitle="Sales vs Purchases — Last 7 days" className="mb-6">
              <div className="flex items-end gap-3 h-48 mt-2">
                {weeklyData.map(day => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: "140px" }}>
                      <div className="w-[45%] rounded-t-md transition-all relative group" style={{ height: `${Math.max(4, (day.sales / weeklyMax) * 140)}px`, background: "linear-gradient(to top, #2563EB, #60A5FA)" }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">{INR0(day.sales)}</div>
                      </div>
                      <div className="w-[45%] rounded-t-md transition-all relative group" style={{ height: `${Math.max(4, (day.purchases / weeklyMax) * 140)}px`, background: "linear-gradient(to top, #F59E0B, #FCD34D)" }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">{INR0(day.purchases)}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{day.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-3 justify-center">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "#2563EB" }} /><span className="text-[11px] text-slate-500">Sales</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "#F59E0B" }} /><span className="text-[11px] text-slate-500">Purchases</span></div>
              </div>
            </Section>

            {/* ──── 30-Day Summary ──── */}
            <Section title="30-Day Summary" subtitle="Monthly totals at a glance" className="mb-6">
              <div className="grid grid-cols-3 gap-5">
                <div className="rounded-xl p-4 border border-green-200 bg-green-50">
                  <p className="text-xs font-medium text-green-700 mb-1">Sales (30d)</p>
                  <p className="text-xl font-bold text-green-800 font-mono">{s ? INR(s.monthly.sales.total) : "—"}</p>
                  <div className="flex gap-3 mt-2 text-[10px] text-green-600">
                    <span>{s?.monthly.sales.count} bills</span>
                    <span>Cash: {s ? INR0(s.monthly.sales.cash) : "—"}</span>
                    <span>Online: {s ? INR0(s.monthly.sales.online) : "—"}</span>
                  </div>
                </div>
                <div className="rounded-xl p-4 border border-blue-200 bg-blue-50">
                  <p className="text-xs font-medium text-blue-700 mb-1">Purchases (30d)</p>
                  <p className="text-xl font-bold text-blue-800 font-mono">{s ? INR(s.monthly.purchases.total) : "—"}</p>
                  <div className="flex gap-3 mt-2 text-[10px] text-blue-600">
                    <span>{s?.monthly.purchases.count} orders</span>
                    <span>Paid: {s ? INR0(s.monthly.purchases.paid) : "—"}</span>
                    <span>Due: {s ? INR0(s.monthly.purchases.due) : "—"}</span>
                  </div>
                </div>
                <div className="rounded-xl p-4 border border-red-200 bg-red-50">
                  <p className="text-xs font-medium text-red-700 mb-1">Expenses (30d)</p>
                  <p className="text-xl font-bold text-red-800 font-mono">{s ? INR(s.monthly.expenses.total) : "—"}</p>
                  <div className="flex gap-3 mt-2 text-[10px] text-red-600">
                    <span>{s?.monthly.expenses.count} entries</span>
                    <span>P&L: {s ? INR(s.monthly.sales.total - s.monthly.purchases.total - s.monthly.expenses.total) : "—"}</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* ──── Top Products ──── */}
            <Section title="Top 10 Products" subtitle="By quantity sold — last 30 days" className="mb-6">
              {s && s.topProducts.length > 0 ? (
                <div className="space-y-2">
                  {s.topProducts.map((p, i) => {
                    const maxQty = s.topProducts[0]?.qty || 1
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 w-5 text-right font-mono">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-slate-700 truncate max-w-[60%]">{p.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">{p.qty} qty &middot; {INR0(p.amount)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%`, background: "linear-gradient(to right, #2563EB, #60A5FA)" }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <p className="text-sm text-slate-400">No sales data</p>}
            </Section>

            {/* ──── Top Customers + Top Vendors ──── */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <Section title="Top Customers" subtitle="By spend — 30 days">
                {s && s.topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {s.topCustomers.map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</div>
                          <span className="text-xs font-medium text-slate-700">{c.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-semibold text-slate-800">{INR0(c.amount)}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{c.count} bills</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">No customer data</p>}
              </Section>
              <Section title="Top Vendors" subtitle="By purchase volume — 30 days">
                {s && s.topVendors.length > 0 ? (
                  <div className="space-y-3">
                    {s.topVendors.map((v, i) => (
                      <div key={v.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</div>
                          <span className="text-xs font-medium text-slate-700">{v.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-semibold text-slate-800">{INR0(v.amount)}</span>
                          {v.due > 0 && <span className="text-[10px] text-red-500 ml-2">({INR0(v.due)} due)</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">No vendor data</p>}
              </Section>
            </div>

            {/* ──── Low Stock Alert ──── */}
            <Section title="Low Stock Alerts" subtitle="Products that need restocking" className="mb-6">
              {s && s.lowStockList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-3 text-left text-[10px] font-semibold uppercase text-slate-500">Product</th>
                        <th className="py-2 px-3 text-left text-[10px] font-semibold uppercase text-slate-500">Brand</th>
                        <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase text-slate-500">Volume</th>
                        <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase text-slate-500">Stock</th>
                        <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase text-slate-500">Reorder</th>
                        <th className="py-2 px-3 text-center text-[10px] font-semibold uppercase text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.lowStockList.map(p => (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{p.name}</td>
                          <td className="py-2 px-3 text-slate-500">{p.brand || "—"}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">{p.volumeML || "—"}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold" style={{ color: p.currentStock <= 0 ? "#DC2626" : "#D97706" }}>{p.currentStock}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500">{p.reorderLevel}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.currentStock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                              {p.currentStock <= 0 ? "Out" : "Low"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-slate-400">All products are well-stocked</p>}
            </Section>
          </>
        )}

        {/* ═══════════════ ACTIVITY TAB ═══════════════ */}
        {activeTab === "activity" && (
          <>
            {/* ──── Recent Sales + Recent Purchases ──── */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <Section title="Recent Sales" subtitle="Last 5 transactions">
                {s && s.recentSales.length > 0 ? (
                  <div className="space-y-2">
                    {s.recentSales.map(sale => (
                      <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{sale.number}</p>
                          <p className="text-[10px] text-slate-400">{sale.customer || "Walk-in"} &middot; {shortDate(sale.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-slate-800">{INR(sale.total)}</p>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${sale.status === "paid" ? "bg-green-100 text-green-700" : sale.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {sale.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">No recent sales</p>}
              </Section>
              <Section title="Recent Purchases" subtitle="Last 5 orders">
                {s && s.recentPurchases.length > 0 ? (
                  <div className="space-y-2">
                    {s.recentPurchases.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{p.number}</p>
                          <p className="text-[10px] text-slate-400">{p.vendor} &middot; {shortDate(p.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-slate-800">{INR(p.total)}</p>
                          {p.due > 0 && <p className="text-[9px] font-mono text-red-500">{INR(p.due)} due</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">No recent purchases</p>}
              </Section>
            </div>

            {/* ──── Stock Check Receipt ──── */}
            <Section title="Stock Check Receipt" subtitle="Print a thermal receipt for physical stock counting" className="mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowStockReceipt(!showStockReceipt) }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${showStockReceipt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                  {showStockReceipt ? "Hide Preview" : "Generate Receipt"}
                </button>
                {showStockReceipt && (
                  <>
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
                  </>
                )}
              </div>

              {showStockReceipt && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto bg-white mt-4">
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
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
