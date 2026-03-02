"use client"

import Image from "next/image"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"

/** Extract actual image URL from Google Images / redirector wrapper URLs */
function extractImageUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith("http")) return trimmed
  try {
    const u = new URL(trimmed)
    const imgurl = u.searchParams.get("imgurl")
    if (imgurl) return imgurl
    if (u.hostname.includes("google") && (u.searchParams.get("url") || u.searchParams.get("q"))) {
      const target = u.searchParams.get("url") || u.searchParams.get("q") || ""
      if (target.startsWith("http")) return target
    }
  } catch { /* not a valid URL, return as-is */ }
  return trimmed
}

interface Product { _id: string; name: string; pricePerUnit: number; purchasePricePerCaret?: number; bottlesPerCaret?: number; currentStock: number; volumeML: number; category?: string; brand?: string; imageUrl?: string; morningStockLastUpdatedDate?: string; barcodes?: { code: string }[] }
interface Customer { _id: string; name: string; creditLimit?: number; outstandingBalance?: number; maxDiscountPercentage?: number; contactInfo?: { phone?: string; email?: string } }
interface CartItem {
  productId: string; productName: string; brand: string; volumeML: number;
  bottlesPerCaret: number; carets: number; bottles: number; totalBottles: number;
  purchasePricePerCaret: number; amount: number;
}
interface RecentB2BSale {
  _id: string; saleNumber: string; customerName: string; totalAmount: number;
  paidAmount: number; dueAmount: number; saleDate: string; createdAt: string;
  items: { productName: string; carets: number; bottles: number; totalBottles: number; purchasePricePerCaret: number; amount: number; brand: string; volumeML: number }[];
  subtotal: number; vatRate: number; vatAmount: number; tcsRate: number; tcsAmount: number; taxAmount: number; paymentStatus: string;
  cashAmount: number; onlineAmount: number; creditAmount: number;
}

/* ── Thermal Print Helpers ─────────────────────────────────────── */
const INR = (n: number) => (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

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

function thermalPrint(html: string) {
  const w = window.open("", "_blank", "width=320,height=600")
  if (!w) return
  w.document.write(html); w.document.close()
  w.onload = () => { w.focus(); w.print() }
}

function doPrintB2BBill(d: RecentB2BSale & { saleNumber: string }) {
  let rows = `<table><thead><tr><th>Item</th><th class="r">Crt</th><th class="r">Btl</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead><tbody>`
  for (const it of d.items) {
    rows += `<tr><td>${it.productName}</td><td class="r">${it.carets}</td><td class="r">${it.bottles || 0}</td><td class="r">${INR(it.purchasePricePerCaret)}</td><td class="r">${INR(it.amount)}</td></tr>`
    rows += `<tr><td colspan="4" style="font-size:10px;color:#555;padding-left:8px">${it.brand} · ${it.volumeML}ml · ${it.totalBottles} btl</td><td></td></tr>`
  }
  rows += `</tbody></table>`

  const html = `<!DOCTYPE html><html><head><style>${thermalCSS()}</style></head><body>
    <div class="center shop">B2B SALE</div><div class="center sub-title">Tax Invoice</div><div class="dbl-line"></div>
    <div class="meta"><b>Bill:</b> ${d.saleNumber}</div>
    <div class="meta"><b>Date:</b> ${fmtDt(d.saleDate || d.createdAt)}</div>
    <div class="meta"><b>Customer:</b> ${d.customerName}</div>
    <div class="line"></div>${rows}<div class="dbl-line"></div>
    <div class="summary-row"><span>Subtotal</span><span>${INR(d.subtotal)}</span></div>
    <div class="summary-row"><span>VAT (${d.vatRate || 35}%)</span><span>${INR(d.vatAmount)}</span></div>
    <div class="summary-row"><span>TCS (${d.tcsRate || 1}%)</span><span>${INR(d.tcsAmount)}</span></div>
    <div class="summary-row"><span>Total Tax</span><span>${INR(d.taxAmount)}</span></div>
    <div class="line"></div><div class="summary-row total"><span>TOTAL</span><span>${INR(d.totalAmount)}</span></div><div class="line"></div>
    ${(d.cashAmount || 0) > 0 ? `<div class="summary-row"><span>Cash</span><span>${INR(d.cashAmount)}</span></div>` : ""}
    ${(d.onlineAmount || 0) > 0 ? `<div class="summary-row"><span>Online</span><span>${INR(d.onlineAmount)}</span></div>` : ""}
    ${(d.creditAmount || 0) > 0 ? `<div class="summary-row"><span>Credit</span><span>${INR(d.creditAmount)}</span></div>` : ""}
    ${(d.dueAmount || 0) > 0 ? `<div class="summary-row" style="color:red"><span>Due</span><span>${INR(d.dueAmount)}</span></div>` : ""}
    <div class="dbl-line"></div><div class="center footer-msg">Thank you for your business!</div>
    <div class="center footer-msg" style="margin-top:2px">--- End of Bill ---</div></body></html>`
  thermalPrint(html)
}

/* ── Item Overlay (Caret-based, same as Purchase) ─────────── */
function ItemOverlay({ product, existingItem, onConfirm, onClose }: {
  product: Product; existingItem?: CartItem;
  onConfirm: (carets: number, bottles: number, price: number) => void; onClose: () => void
}) {
  const bpc = product.bottlesPerCaret || 12
  const [carets, setCarets] = useState(existingItem?.carets ?? 1)
  const [bottles, setBottles] = useState(existingItem?.bottles ?? 0)
  const [price, setPrice] = useState(existingItem?.purchasePricePerCaret ?? product.purchasePricePerCaret ?? 0)

  const totalBottles = carets * bpc + bottles
  const lineAmount = carets * price

  // Stock check — effective stock in bottles
  const maxBottles = product.currentStock

  const handleCarets = (v: number) => { if (v < 0) return; setCarets(v) }
  const handleBottles = (v: number) => { if (v < 0 || v >= bpc) return; setBottles(v) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-blue-100">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{product.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{product.brand} · {product.volumeML}ml · {bpc} bottles/caret</p>
              <p className="font-mono text-blue-600 font-medium mt-1 text-sm">₹{(product.purchasePricePerCaret ?? 0).toLocaleString("en-IN")} / caret</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-3 mt-0.5 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{maxBottles} bottles available</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Number of Carets</label>
            <div className="flex items-center gap-3">
              <button onClick={() => handleCarets(carets - 1)} disabled={carets <= 0} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">−</button>
              <input type="number" min={0} value={carets} onChange={e => handleCarets(Number(e.target.value))} className="flex-1 text-center border border-slate-200 rounded-xl py-2 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={() => handleCarets(carets + 1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 transition-colors text-lg">+</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Loose Bottles <span className="text-slate-300 normal-case">(max {bpc - 1})</span></label>
            <div className="flex items-center gap-3">
              <button onClick={() => handleBottles(bottles - 1)} disabled={bottles <= 0} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">−</button>
              <input type="number" min={0} max={bpc - 1} value={bottles} onChange={e => handleBottles(Number(e.target.value))} className="flex-1 text-center border border-slate-200 rounded-xl py-2 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={() => handleBottles(bottles + 1)} disabled={bottles >= bpc - 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">+</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Purchase Price / Caret (₹)</label>
            <input type="number" min={0} value={price} onChange={e => { const v = Number(e.target.value); if (v >= 0) setPrice(v) }}
              className="w-full text-center border border-slate-200 rounded-xl py-2.5 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Total Bottles</span><span className="font-semibold text-slate-800">{totalBottles}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="text-slate-400">Line Amount</span><span className="font-bold text-blue-600">₹{lineAmount.toLocaleString("en-IN")}</span></div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={() => {
            if (carets <= 0 && bottles <= 0) return alert("Add at least 1 caret or bottle")
            if (price <= 0) return alert("Enter purchase price per caret")
            if (totalBottles > maxBottles) return alert(`Only ${maxBottles} bottles in stock`)
            onConfirm(carets, bottles, price)
          }}
            className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
            {existingItem ? "Update Item" : "Add to Cart"} →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── B2B Sale Detail Overlay ─────────────────────────────────── */
function B2BSaleDetailOverlay({ sale, onClose }: { sale: RecentB2BSale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-blue-100 max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-0.5">B2B Sale Detail</p>
            <h3 className="font-semibold text-slate-800 text-lg">{sale.saleNumber}</h3>
            <p className="text-xs text-slate-400 mt-1">{sale.customerName} · {new Date(sale.saleDate || sale.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => doPrintB2BBill(sale)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors" title="Print">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
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
                {sale.items?.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-4 py-2.5"><p className="font-medium text-slate-800 text-sm">{item.productName}</p><p className="text-xs text-slate-400">{item.brand} · {item.volumeML}ml</p></td>
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
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-900">₹{(sale.subtotal || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">VAT ({sale.vatRate || 35}%)</span><span className="font-medium text-slate-900">₹{(sale.vatAmount || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">TCS ({sale.tcsRate || 1}%)</span><span className="font-medium text-slate-900">₹{(sale.tcsAmount || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Total Tax</span><span className="font-semibold text-orange-600">₹{(sale.taxAmount || 0).toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold text-slate-800">Grand Total</span><span className="font-bold text-blue-700">₹{(sale.totalAmount || 0).toLocaleString("en-IN")}</span></div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Paid</p>
              <p className="text-lg font-bold text-emerald-700">₹{(sale.paidAmount || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-red-500 font-medium mb-1">Due</p>
              <p className="text-lg font-bold text-red-600">₹{(sale.dueAmount || 0).toLocaleString("en-IN")}</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 font-medium mb-1">Status</p>
              <p className="text-lg font-bold text-blue-700 capitalize">{sale.paymentStatus}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──── Main B2B Sales Page ──── */
export default function B2BSalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [overlayProduct, setOverlayProduct] = useState<Product | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [paymentMode, setPaymentMode] = useState<"cash" | "credit">("cash")
  const [cashAmount, setCashAmount] = useState(0)
  const [onlineAmount, setOnlineAmount] = useState(0)
  const [creditAmount, setCreditAmount] = useState(0)
  const [recentSales, setRecentSales] = useState<RecentB2BSale[]>([])
  const [showRecent, setShowRecent] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const customerDropdownRef = useRef<HTMLDivElement>(null)
  const [viewingSale, setViewingSale] = useState<RecentB2BSale | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Barcode scanner
  const [scannerActive, setScannerActive] = useState(false)
  const scannerBuffer = useRef("")
  const scannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetScannerIdleTimer = useCallback(() => {
    if (scannerTimeout.current) clearTimeout(scannerTimeout.current)
    scannerTimeout.current = setTimeout(() => setScannerActive(false), 5 * 60 * 1000)
  }, [])

  const barcodeMap = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) {
      if (p.barcodes) {
        for (const b of p.barcodes) {
          if (b.code) map.set(b.code.trim(), p)
        }
      }
    }
    return map
  }, [products])

  // ── Cart logic (must be before barcode useEffect) ──
  const openAddOverlay = useCallback((product: Product) => {
    const idx = cart.findIndex(i => i.productId === product._id)
    if (idx >= 0) { setEditingIndex(idx); setOverlayProduct(product) }
    else { setEditingIndex(null); setOverlayProduct(product) }
  }, [cart])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "Enter") {
        const code = scannerBuffer.current.trim()
        scannerBuffer.current = ""
        if (scannerTimer.current) { clearTimeout(scannerTimer.current); scannerTimer.current = null }
        if (code.length >= 3) {
          setScannerActive(true)
          resetScannerIdleTimer()
          const product = barcodeMap.get(code)
          if (product) { openAddOverlay(product) } else { alert(`No product found for barcode: ${code}`) }
        }
        return
      }
      if (e.key.length === 1) {
        scannerBuffer.current += e.key
        if (scannerTimer.current) clearTimeout(scannerTimer.current)
        scannerTimer.current = setTimeout(() => { scannerBuffer.current = "" }, 100)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (scannerTimer.current) clearTimeout(scannerTimer.current)
      if (scannerTimeout.current) clearTimeout(scannerTimeout.current)
    }
  }, [barcodeMap, resetScannerIdleTimer, openAddOverlay])

  const loadProducts = useCallback(() => fetch("/api/tenant/products?limit=0").then(r => r.json()).then(d => setProducts(d.data || [])), [])
  const loadCustomers = useCallback(() => fetch("/api/tenant/customers?limit=all&type=B2B").then(r => r.json()).then(d => setCustomers(d.data || [])), [])
  const loadRecentSales = useCallback(() => fetch("/api/tenant/b2b-sales").then(r => r.json()).then(d => setRecentSales(d.data || [])).catch(() => {}), [])

  useEffect(() => {
    loadProducts()
    loadCustomers()
    loadRecentSales()
  }, [loadProducts, loadCustomers, loadRecentSales])

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers
    const q = customerSearch.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.contactInfo?.phone?.includes(q))
  }, [customers, customerSearch])

  const selectCustomer = (id: string) => {
    setSelectedCustomer(id)
    const cust = customers.find(c => c._id === id)
    setCustomerSearch(cust?.name || "")
    setCustomerDropdownOpen(false)
    if (!id) {
      setPaymentMode("cash")
      setCashAmount(totalAmount); setOnlineAmount(0); setCreditAmount(0)
    }
  }

  const selectedCustomerObj = customers.find(c => c._id === selectedCustomer)
  const isWalkIn = !selectedCustomer

  // Cart quantity map (bottles)
  const cartBottlesMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const item of cart) m.set(item.productId, (m.get(item.productId) || 0) + item.totalBottles)
    return m
  }, [cart])

  const getEffectiveStock = useCallback((productId: string, serverStock: number) => {
    return serverStock - (cartBottlesMap.get(productId) || 0)
  }, [cartBottlesMap])

  const handleOverlayConfirm = (carets: number, bottles: number, price: number) => {
    if (!overlayProduct) return
    const bpc = overlayProduct.bottlesPerCaret || 12
    const totalBottles = carets * bpc + bottles
    const amount = carets * price

    const newItem: CartItem = {
      productId: overlayProduct._id, productName: overlayProduct.name, brand: overlayProduct.brand || "",
      volumeML: overlayProduct.volumeML, bottlesPerCaret: bpc, carets, bottles, totalBottles,
      purchasePricePerCaret: price, amount,
    }

    if (editingIndex !== null) { const updated = [...cart]; updated[editingIndex] = newItem; setCart(updated) }
    else { setCart([newItem, ...cart]) }
    setOverlayProduct(null); setEditingIndex(null)
  }

  const removeItem = (index: number) => { setCart(cart.filter((_, i) => i !== index)) }

  // ── Tax calculations ──
  const subtotal = cart.reduce((acc, item) => acc + item.amount, 0)
  const vatRate = 35; const vatAmount = Math.round(subtotal * vatRate / 100)
  const tcsRate = 1; const tcsAmount = Math.round((subtotal + vatAmount) * tcsRate / 100)
  const taxAmount = vatAmount + tcsAmount
  const totalAmount = subtotal + taxAmount
  const paidAmount = cashAmount + onlineAmount
  const dueAmount = totalAmount - paidAmount

  const setPaymentModeAndRecalc = (mode: "cash" | "credit") => {
    setPaymentMode(mode)
    if (mode === "credit" && selectedCustomerObj) {
      const available = Math.max(0, (selectedCustomerObj.creditLimit || 0) - (selectedCustomerObj.outstandingBalance || 0))
      const creditPortion = Math.min(totalAmount, available)
      const remainder = totalAmount - creditPortion
      setCreditAmount(creditPortion); setCashAmount(remainder); setOnlineAmount(0)
    } else {
      setCashAmount(totalAmount); setOnlineAmount(0); setCreditAmount(0)
    }
  }

  const recalcFromCash = (v: number) => { if (v < 0) return; const capped = Math.min(v, totalAmount); setCashAmount(capped); if (paymentMode === "cash") setOnlineAmount(Math.max(0, totalAmount - capped)); else setCreditAmount(Math.max(0, totalAmount - capped - onlineAmount)) }
  const recalcFromOnline = (v: number) => { if (v < 0) return; const capped = Math.min(v, totalAmount); setOnlineAmount(capped); if (paymentMode === "cash") setCashAmount(Math.max(0, totalAmount - capped)); else setCreditAmount(Math.max(0, totalAmount - cashAmount - capped)) }
  const recalcFromCredit = (v: number) => { if (v < 0) return; setCreditAmount(v); setCashAmount(Math.max(0, totalAmount - v - onlineAmount)) }

  // ── Submit ──
  const completeB2BSale = async () => {
    if (cart.length === 0) return alert("Cart is empty")
    if (isWalkIn) return alert("B2B sales require a customer")
    setSubmitting(true)

    const actualPaid = cashAmount + onlineAmount
    const actualDue = totalAmount - actualPaid

    const res = await fetch("/api/tenant/b2b-sales", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer,
        customerName: selectedCustomerObj?.name || "Walk-In",
        saleDate: new Date(),
        items: cart,
        subtotal, vatRate, vatAmount, tcsRate, tcsAmount, taxAmount, totalAmount,
        paymentStatus: actualDue <= 0 ? "paid" : actualPaid > 0 ? "partial" : "pending",
        paidAmount: actualPaid,
        dueAmount: Math.max(0, actualDue),
        paymentMode,
        cashAmount,
        onlineAmount,
        creditAmount,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) return alert(data.error)

    // Auto-print thermal receipt
    doPrintB2BBill({
      ...data,
      saleNumber: data.saleNumber || data._id,
      saleDate: new Date().toISOString(),
      customerName: selectedCustomerObj?.name || "Walk-In",
      items: cart.map(c => ({ productName: c.productName, carets: c.carets, bottles: c.bottles, totalBottles: c.totalBottles, purchasePricePerCaret: c.purchasePricePerCaret, amount: c.amount, brand: c.brand, volumeML: c.volumeML })),
      subtotal, vatRate, vatAmount, tcsRate, tcsAmount, taxAmount, totalAmount,
      paidAmount: actualPaid, dueAmount: Math.max(0, actualDue),
      cashAmount, onlineAmount, creditAmount,
      paymentStatus: actualDue <= 0 ? "paid" : actualPaid > 0 ? "partial" : "pending",
      createdAt: new Date().toISOString(),
    })

    alert("B2B Sale Created Successfully!")
    setCart([]); setCashAmount(0); setOnlineAmount(0); setCreditAmount(0)
    setSelectedCustomer(""); setCustomerSearch(""); setPaymentMode("cash")
    loadProducts(); loadRecentSales(); loadCustomers()
  }

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()))
    .filter(p => showOutOfStock || p.currentStock > 0)
    .sort((a, b) => (b.currentStock > 0 ? 1 : 0) - (a.currentStock > 0 ? 1 : 0))

  return (
    <div className="flex h-screen" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .product-card { transition: all 0.15s ease; }
        .product-card:hover:not(.disabled-card) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.12); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #BFDBFE; border-radius: 99px; }
      `}</style>

      {overlayProduct && <ItemOverlay product={overlayProduct} existingItem={editingIndex !== null ? cart[editingIndex] : undefined} onConfirm={handleOverlayConfirm} onClose={() => { setOverlayProduct(null); setEditingIndex(null) }} />}
      {viewingSale && <B2BSaleDetailOverlay sale={viewingSale} onClose={() => setViewingSale(null)} />}

      {/* LEFT PANEL */}
      <div className="w-3/5 flex flex-col overflow-hidden border-r border-blue-100">
        <div className="px-6 py-4 bg-white border-b border-blue-100">
          <div className="flex items-center gap-4">
            <div className="flex-1" ref={customerDropdownRef}>
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1 block">Customer (B2B)</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                <input
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true); if (!e.target.value) { setSelectedCustomer(""); setPaymentMode("cash") } }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  placeholder="Search business customer…"
                  className="w-full pl-9 pr-8 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {selectedCustomer && (
                  <button onClick={() => { setSelectedCustomer(""); setCustomerSearch(""); setPaymentMode("cash"); setCustomerDropdownOpen(false) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                {customerDropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button type="button" key={c._id} onClick={() => selectCustomer(c._id)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${selectedCustomer === c._id ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-700"}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">{c.name[0]}</span>
                          <div className="min-w-0">
                            <span className="block truncate">{c.name}</span>
                            {c.contactInfo?.phone && <span className="block text-[10px] text-slate-400 font-mono">{c.contactInfo.phone}</span>}
                          </div>
                        </div>
                        {(c.outstandingBalance || 0) > 0 && <span className="text-[10px] font-mono text-red-400 shrink-0 ml-2">₹{c.outstandingBalance!.toLocaleString("en-IN")}</span>}
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && <p className="px-4 py-3 text-xs text-slate-400 text-center">No customers found</p>}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-5">
              <button onClick={() => setShowRecent(!showRecent)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${showRecent ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"}`}>
                Today&apos;s B2B Sales
              </button>
            </div>
          </div>

          {/* Customer details */}
          {selectedCustomerObj && (
            <div className="mt-3 flex items-center gap-4 bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-100">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-sm font-medium text-slate-700">{selectedCustomerObj.name}</span>
              </div>
              {selectedCustomerObj.contactInfo?.phone && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="text-xs font-mono text-slate-600">{selectedCustomerObj.contactInfo.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Credit:</span>
                <span className="text-xs font-mono font-semibold text-slate-700">₹{(selectedCustomerObj.creditLimit || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Outstanding:</span>
                <span className={`text-xs font-mono font-semibold ${(selectedCustomerObj.outstandingBalance || 0) > 0 ? "text-red-500" : "text-emerald-600"}`}>₹{(selectedCustomerObj.outstandingBalance || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Available:</span>
                <span className={`text-xs font-mono font-semibold ${((selectedCustomerObj.creditLimit || 0) - (selectedCustomerObj.outstandingBalance || 0)) <= 0 ? "text-red-500" : "text-emerald-600"}`}>₹{((selectedCustomerObj.creditLimit || 0) - (selectedCustomerObj.outstandingBalance || 0)).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent B2B sales table */}
        {showRecent && (
          <div className="bg-white border-b border-blue-100 max-h-56 overflow-y-auto">
            <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s B2B Sales</h3>
              <span className="text-xs text-slate-400 font-mono">{recentSales.length} sales</span>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No B2B sales today</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider"><th className="text-left px-4 py-2 font-semibold">Invoice</th><th className="text-left px-4 py-2 font-semibold">Customer</th><th className="text-left px-4 py-2 font-semibold">Items</th><th className="text-right px-4 py-2 font-semibold">Amount</th><th className="text-right px-4 py-2 font-semibold">Paid</th><th className="text-right px-4 py-2 font-semibold">Due</th><th className="text-right px-4 py-2 font-semibold">Time</th><th className="px-4 py-2"></th></tr></thead>
                <tbody>
                  {recentSales.map(s => (
                    <tr key={s._id} className="border-t border-slate-100 hover:bg-blue-50/30">
                      <td className="px-4 py-2 font-mono text-blue-600">{s.saleNumber}</td>
                      <td className="px-4 py-2 text-slate-700">{s.customerName}</td>
                      <td className="px-4 py-2 text-slate-500">{s.items?.length || 0} items</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-slate-800">₹{(s.totalAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-600">₹{(s.paidAmount || 0).toLocaleString("en-IN")}</td>
                      <td className={`px-4 py-2 text-right font-mono ${(s.dueAmount || 0) > 0 ? "text-red-500" : "text-slate-400"}`}>₹{(s.dueAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2 text-right text-slate-400">{new Date(s.saleDate || s.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => setViewingSale(s)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center mx-auto transition-colors" title="View Detail">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="px-6 py-3 bg-white border-b border-blue-50 flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0" title="Show out-of-stock products">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide leading-none">OOS</span>
            <button type="button" role="switch" aria-checked={showOutOfStock} onClick={() => setShowOutOfStock(v => !v)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${showOutOfStock ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${showOutOfStock ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </button>
          </label>
          {/* Barcode scanner indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0" title={scannerActive ? "Barcode scanner active" : "Barcode scanner inactive"}>
            <svg className={`w-4 h-4 ${scannerActive ? "text-emerald-500" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4V1m0 22v-3M4 12H1m22 0h-3M6.343 6.343L4.929 4.929m14.142 14.142l-1.414-1.414M6.343 17.657l-1.414 1.414M19.071 4.929l-1.414 1.414" />
            </svg>
            <span className={`text-[10px] uppercase tracking-wide leading-none font-semibold ${scannerActive ? "text-emerald-600" : "text-slate-400"}`}>
              {scannerActive ? "Scanner" : "Scanner Off"}
            </span>
            <span className={`w-2 h-2 rounded-full ${scannerActive ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map(p => {
            const effectiveStock = getEffectiveStock(p._id, p.currentStock)
            const outOfStock = effectiveStock <= 0
            const serverOutOfStock = p.currentStock <= 0
            const lowStock = effectiveStock > 0 && effectiveStock <= 5
            const inCart = cart.some(i => i.productId === p._id)
            const bpc = p.bottlesPerCaret || 12
            return (
              <div key={p._id} onClick={() => openAddOverlay(p)}
                className={`product-card bg-white rounded-xl border p-4 select-none relative ${outOfStock && !inCart ? "disabled-card opacity-50 cursor-not-allowed border-slate-100 grayscale" : inCart ? "cursor-pointer border-blue-400 ring-1 ring-blue-200" : "cursor-pointer border-blue-100 hover:border-blue-400"}`}>
                {(serverOutOfStock || (outOfStock && !inCart)) && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">Out of Stock</span>
                  </div>
                )}
                {inCart && <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-500 z-20" />}
                {p.imageUrl && (
                  <Image src={extractImageUrl(p.imageUrl)} alt={p.name} width={12} height={12} className="absolute bottom-2.5 right-2.5 w-12 h-12 rounded-md object-cover border border-slate-100 z-20" />
                )}
                <p className="font-medium text-sm leading-tight mb-1 text-slate-800 pr-4">{p.name}</p>
                <p className="text-[10px] text-slate-400 mb-1">{p.brand} · {p.volumeML}ml · {bpc} btl/crt</p>
                <p className="font-mono text-base font-semibold text-blue-600">₹{(p.purchasePricePerCaret ?? 0).toLocaleString("en-IN")}<span className="text-[10px] text-slate-400 font-normal ml-0.5">/crt</span></p>
                <div className="mt-2 flex items-center gap-1.5">
                  {serverOutOfStock
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Out of Stock</span>
                    : lowStock
                      ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Left: {effectiveStock}</span>
                      : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{effectiveStock} btl</span>
                  }
                  {inCart && effectiveStock > 0 && !serverOutOfStock && (
                    <span className="text-[10px] font-mono text-blue-500">({cartBottlesMap.get(p._id)} btl in cart)</span>
                  )}
                </div>
              </div>
            )
          })}
          {filteredProducts.length === 0 && <div className="col-span-4 flex flex-col items-center justify-center py-16 text-slate-300"><p className="text-sm">No products found</p></div>}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-2/5 bg-white flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-blue-50 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            B2B Order
            {cart.length > 0 && <span className="text-xs rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>{cart.length}</span>}
          </h2>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 transition-colors">Clear all</button>}
        </div>

        {/* Cart Items */}
        <div className="overflow-y-auto flex-1 px-3 py-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300"><svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" /></svg><p className="text-sm">Click a product to add</p></div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-blue-50/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{item.carets} crt + {item.bottles} btl · ₹{item.purchasePricePerCaret.toLocaleString("en-IN")}/crt</p>
                  <p className="text-[10px] text-slate-300">{item.totalBottles} bottles total</p>
                </div>
                <p className="font-mono font-semibold text-sm text-slate-800 flex-shrink-0 mr-1">₹{item.amount.toLocaleString("en-IN")}</p>
                <button onClick={() => { setEditingIndex(index); setOverlayProduct(products.find(p => p._id === item.productId) || null) }} className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => removeItem(index)} className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Summary + Payment */}
        <div className="border-t border-blue-50 flex-shrink-0">
          <div className="px-4 pt-3 pb-4 space-y-2.5">
            {/* Tax Summary */}
            {cart.length > 0 && (
              <div className="space-y-1.5 text-xs bg-slate-50 rounded-xl p-3">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-900 font-mono">₹{subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">VAT ({vatRate}%)</span><span className="font-medium text-slate-900 font-mono">₹{vatAmount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">TCS ({tcsRate}%)</span><span className="font-medium text-slate-900 font-mono">₹{tcsAmount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1"><span className="text-slate-500">Total Tax</span><span className="font-semibold text-orange-600 font-mono">₹{taxAmount.toLocaleString("en-IN")}</span></div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Grand Total</span>
              <p className="font-mono font-bold text-xl text-blue-600">₹{totalAmount.toLocaleString("en-IN")}</p>
            </div>

            <div className="flex gap-2">
              {(["cash", ...(isWalkIn ? [] : ["credit"])] as const).map(mode => (
                <button key={mode} onClick={() => setPaymentModeAndRecalc(mode as "cash" | "credit")} className={`flex-1 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${paymentMode === mode ? "text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  style={paymentMode === mode ? { background: "linear-gradient(135deg, #2563EB, #0EA5E9)" } : {}}>
                  {mode}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Cash", value: cashAmount, onChange: recalcFromCash },
                { label: "Online", value: onlineAmount, onChange: recalcFromOnline },
                ...(paymentMode === "credit" ? [{ label: "Credit", value: creditAmount, onChange: recalcFromCredit }] : []),
              ].map(({ label, value, onChange }) => (
                <div key={label}>
                  <label className="text-xs text-slate-400 block mb-1">{label}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                    <input type="number" min={0} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Paid <span className="font-mono font-medium text-slate-700">₹{(cashAmount + onlineAmount).toLocaleString("en-IN")}</span></span>
              <span className={dueAmount > 0 ? "text-red-500" : "text-emerald-500"}>
                {dueAmount > 0 ? "Due" : "Settled"} <span className="font-mono font-bold">₹{Math.abs(dueAmount).toLocaleString("en-IN")}</span>
              </span>
            </div>

            {paymentMode === "credit" && selectedCustomerObj && cashAmount > 0 && creditAmount < totalAmount && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100">
                Credit capped at ₹{creditAmount.toLocaleString("en-IN")}. Remaining ₹{cashAmount.toLocaleString("en-IN")} in cash.
              </p>
            )}

            <button onClick={completeB2BSale} disabled={cart.length === 0 || !selectedCustomer || submitting} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
              {submitting && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {submitting ? "Processing…" : "Complete B2B Sale →"}
            </button>
            {!selectedCustomer && cart.length > 0 && (
              <p className="text-xs text-amber-600 text-center">Select a customer to complete B2B sale</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
