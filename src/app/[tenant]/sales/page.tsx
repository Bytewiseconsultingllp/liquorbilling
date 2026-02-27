"use client";

import Image from "next/image";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";

interface Product { _id: string; name: string; pricePerUnit: number; currentStock: number; category?: string; imageUrl?: string; morningStockLastUpdatedDate?: string; barcodes?: { code: string }[] }
interface Customer { _id: string; name: string; creditLimit?: number; outstandingBalance?: number; maxDiscountPercentage?: number; contactInfo?: { phone?: string; email?: string } }
interface CartItem { productId: string; productName: string; quantity: number; pricePerUnit: number; discountValue: number; discountAmount: number; totalAmount: number }
interface RecentSale { _id: string; saleNumber: string; customerName: string; totalAmount: number; paidAmount: number; dueAmount: number; saleDate: string; items: { productName: string; quantity: number }[] }

function ProductOverlay({ product, effectiveStock, existingItem, isWalkIn, maxDiscountPerUnit, onConfirm, onClose }: {
  product: Product; effectiveStock: number; existingItem?: CartItem; isWalkIn: boolean; maxDiscountPerUnit: number;
  onConfirm: (qty: number, discountValue: number) => void; onClose: () => void
}) {
  const currentQtyInCart = existingItem?.quantity ?? 0
  const maxQty = effectiveStock + currentQtyInCart // allow up to stock + what's already committed for this item
  const [qty, setQty] = useState(existingItem?.quantity ?? 1)
  const [discountValue, setDiscountValue] = useState(existingItem ? existingItem.discountValue : 0)

  const effectiveMaxDisc = Math.min(product.pricePerUnit, maxDiscountPerUnit)

  const base = qty * product.pricePerUnit
  // discount is ₹ per unit, so total discount = discountValue × qty
  const clampedDiscount = Math.min(discountValue, effectiveMaxDisc)
  const discountAmount = clampedDiscount * qty
  const lineTotal = Math.max(0, base - discountAmount)

  const handleQty = (val: number) => { if (val < 1 || val < 0) return; if (val > maxQty) return alert("Insufficient stock"); setQty(val) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-blue-100">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{product.name}</h3>
              <p className="font-mono text-blue-600 font-medium mt-1">₹{product.pricePerUnit.toLocaleString("en-IN")} / unit</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-3 mt-0.5 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">{maxQty} available</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button onClick={() => handleQty(qty - 1)} disabled={qty <= 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">−</button>
              <input type="number" min={1} max={maxQty} value={qty} onChange={e => handleQty(Number(e.target.value))} className="flex-1 text-center border border-slate-200 rounded-xl py-2 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={() => handleQty(qty + 1)} disabled={qty >= maxQty} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">+</button>
            </div>
          </div>
          {!isWalkIn && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Discount per unit (₹){effectiveMaxDisc < product.pricePerUnit && <span className="text-slate-300 normal-case font-normal"> · max ₹{effectiveMaxDisc.toFixed(2)}</span>}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input type="number" min={0} max={effectiveMaxDisc} value={discountValue} onChange={e => {
                  const v = Number(e.target.value)
                  if (v < 0 || v > effectiveMaxDisc) return
                  setDiscountValue(v)
                }} className="w-full pl-7 pr-3 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
              </div>
              {discountAmount > 0 && <p className="text-xs text-emerald-600 mt-1.5 font-mono">Saving ₹{discountAmount.toFixed(2)} (₹{discountValue} × {qty})</p>}
            </div>
          )}
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex justify-between items-center border border-blue-100">
            <span className="text-sm text-slate-500">Line Total</span>
            <div className="text-right">
              {discountAmount > 0 && <p className="text-xs text-slate-400 line-through font-mono">₹{base.toFixed(2)}</p>}
              <p className="font-mono font-bold text-blue-600 text-lg">₹{lineTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancel</button>
          <button onClick={() => onConfirm(qty, Math.min(discountValue, effectiveMaxDisc))} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
            {existingItem ? "Update Item" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SalesPOSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [overlayProduct, setOverlayProduct] = useState<Product | null>(null)
  const [paymentMode, setPaymentMode] = useState<"cash" | "credit">("cash")
  const [cashAmount, setCashAmount] = useState(0); const [onlineAmount, setOnlineAmount] = useState(0); const [creditAmount, setCreditAmount] = useState(0)
  const [billDiscountValue, setBillDiscountValue] = useState(0)
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [showRecent, setShowRecent] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)

  // ── Barcode Scanner ──────────────────────────────────────
  const [scannerActive, setScannerActive] = useState(false)
  const scannerBuffer = useRef("")
  const scannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scannerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const SCANNER_IDLE_MS = 5 * 60 * 1000 // 5 minutes

  const resetScannerIdleTimer = useCallback(() => {
    if (scannerTimeout.current) clearTimeout(scannerTimeout.current)
    scannerTimeout.current = setTimeout(() => setScannerActive(false), SCANNER_IDLE_MS)
  }, [])

  // Build barcode lookup map
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      if (e.key === "Enter") {
        const code = scannerBuffer.current.trim()
        scannerBuffer.current = ""
        if (scannerTimer.current) { clearTimeout(scannerTimer.current); scannerTimer.current = null }
        if (code.length >= 3) {
          // Activate scanner on successful scan
          setScannerActive(true)
          resetScannerIdleTimer()
          const product = barcodeMap.get(code)
          if (product) {
            setOverlayProduct(product)
          } else {
            alert(`No product found for barcode: ${code}`)
          }
        }
        return
      }

      // Accumulate printable characters (barcode scanners type rapidly)
      if (e.key.length === 1) {
        scannerBuffer.current += e.key
        if (scannerTimer.current) clearTimeout(scannerTimer.current)
        // If no new character within 100ms, clear buffer (manual typing is slower)
        scannerTimer.current = setTimeout(() => { scannerBuffer.current = "" }, 100)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (scannerTimer.current) clearTimeout(scannerTimer.current)
      if (scannerTimeout.current) clearTimeout(scannerTimeout.current)
    }
  }, [barcodeMap, resetScannerIdleTimer])

  const loadProducts = useCallback(() => fetch("/api/tenant/products?limit=0").then(r => r.json()).then(d => setProducts(d.data || [])), [])
  const loadCustomers = useCallback(() => fetch("/api/tenant/customers?limit=all").then(r => r.json()).then(d => setCustomers(d.data || [])), [])
  const loadRecentSales = useCallback(() => fetch("/api/tenant/sales").then(r => r.json()).then(d => setRecentSales(d.data || [])).catch(() => {}), [])

  useEffect(() => {
    loadProducts()
    loadCustomers()
    loadRecentSales()
  }, [loadProducts, loadCustomers, loadRecentSales])

  // Compute min selectable date from morningStockLastUpdatedDate
  const minSaleDate = useMemo(() => {
    const dates = products
      .map(p => p.morningStockLastUpdatedDate)
      .filter(Boolean)
      .map(d => new Date(d!).getTime())
    if (dates.length === 0) return ""
    const maxTs = Math.max(...dates)
    const dt = new Date(maxTs)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
  }, [products])

  const selectedCustomerObj = customers.find(c => c._id === selectedCustomer)
  const isWalkIn = !selectedCustomer

  // Track how many of each product is in the cart
  const cartQtyMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const item of cart) m.set(item.productId, (m.get(item.productId) || 0) + item.quantity)
    return m
  }, [cart])

  // Effective stock = server stock minus what's in cart
  const getEffectiveStock = useCallback((productId: string, serverStock: number) => {
    return serverStock - (cartQtyMap.get(productId) || 0)
  }, [cartQtyMap])

  const subtotalBeforeDiscount = useMemo(() => cart.reduce((a, b) => a + b.quantity * b.pricePerUnit, 0), [cart])
  const itemDiscountTotal = useMemo(() => cart.reduce((a, b) => a + b.discountAmount, 0), [cart])
  const maxAllowedDiscount = selectedCustomerObj?.maxDiscountPercentage ? (subtotalBeforeDiscount * selectedCustomerObj.maxDiscountPercentage) / 100 : Infinity
  const remainingDiscountBudget = Math.max(0, maxAllowedDiscount - itemDiscountTotal)
  const billDiscountAmount = isWalkIn ? 0 : Math.min(billDiscountValue, remainingDiscountBudget)
  const totalDiscountAmount = itemDiscountTotal + billDiscountAmount
  const subtotal = subtotalBeforeDiscount - totalDiscountAmount
  const totalAmount = Math.max(0, subtotal)

  useEffect(() => {
    if (paymentMode === "credit" && selectedCustomerObj) {
      const available = Math.max(0, (selectedCustomerObj.creditLimit || 0) - (selectedCustomerObj.outstandingBalance || 0))
      const creditPortion = Math.min(totalAmount, available)
      const remainder = totalAmount - creditPortion
      setCreditAmount(creditPortion); setCashAmount(remainder); setOnlineAmount(0)
    } else {
      setCashAmount(totalAmount); setOnlineAmount(0); setCreditAmount(0)
    }
  }, [totalAmount, paymentMode, selectedCustomerObj])

  const recalcItem = (item: CartItem, qty: number, discountValue: number): CartItem => {
    const base = qty * item.pricePerUnit
    const discountAmount = discountValue * qty
    return { ...item, quantity: qty, discountValue, discountAmount: Math.min(discountAmount, base), totalAmount: Math.max(0, base - discountAmount) }
  }

  const openOverlay = (product: Product) => {
    const eff = getEffectiveStock(product._id, product.currentStock)
    // If the product is already in cart, still allow editing
    const inCart = cart.some(i => i.productId === product._id)
    if (eff <= 0 && !inCart) return
    setOverlayProduct(product)
  }

  const handleOverlayConfirm = (qty: number, discountValue: number) => {
    if (!overlayProduct) return
    const existing = cart.find(i => i.productId === overlayProduct._id)
    if (existing) {
      setCart(prev => prev.map(item => item.productId === overlayProduct._id ? recalcItem(item, qty, discountValue) : item))
    } else {
      const base = qty * overlayProduct.pricePerUnit
      const discountAmount = discountValue * qty
      setCart(prev => [...prev, { productId: overlayProduct._id, productName: overlayProduct.name, quantity: qty, pricePerUnit: overlayProduct.pricePerUnit, discountValue, discountAmount: Math.min(discountAmount, base), totalAmount: Math.max(0, base - discountAmount) }])
    }
    setOverlayProduct(null)
  }
  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.productId !== id))

  const paidAmount = cashAmount + onlineAmount; const dueAmount = totalAmount - paidAmount
  const recalcFromCash = (v: number) => { if (v < 0) return; const capped = Math.min(v, totalAmount); setCashAmount(capped); if (paymentMode === "cash") setOnlineAmount(Math.max(0, totalAmount - capped)); else setCreditAmount(Math.max(0, totalAmount - capped - onlineAmount)) }
  const recalcFromOnline = (v: number) => { if (v < 0) return; const capped = Math.min(v, totalAmount); setOnlineAmount(capped); if (paymentMode === "cash") setCashAmount(Math.max(0, totalAmount - capped)); else setCreditAmount(Math.max(0, totalAmount - cashAmount - capped)) }
  const recalcFromCredit = (v: number) => { if (v < 0) return; setCreditAmount(v); setCashAmount(Math.max(0, totalAmount - v - onlineAmount)) }

  // Split cart into sub-bills of ≤ ₹2,50,000
  const splitIntoBills = (items: CartItem[]): CartItem[][] => {
    const LIMIT = 250000
    const grandTotal = items.reduce((a, b) => a + b.totalAmount, 0)
    if (grandTotal <= LIMIT) return [items]
    const bills: CartItem[][] = []; let cur: CartItem[] = []; let curTotal = 0
    for (const item of items) {
      let remaining = item.quantity
      const net = Math.max(item.pricePerUnit - item.discountValue, 1)
      while (remaining > 0) {
        const space = LIMIT - curTotal
        if (space <= 0) { bills.push(cur); cur = []; curTotal = 0; continue }
        const qty = Math.min(remaining, Math.max(1, Math.floor(space / net)))
        const disc = item.discountValue * qty
        const line = Math.max(0, qty * item.pricePerUnit - disc)
        cur.push({ ...item, quantity: qty, discountAmount: disc, totalAmount: line })
        curTotal += line; remaining -= qty
        if (curTotal >= LIMIT) { bills.push(cur); cur = []; curTotal = 0 }
      }
    }
    if (cur.length > 0) bills.push(cur)
    return bills
  }

  const completeSale = async () => {
    if (cart.length === 0) return alert("Cart is empty")
    if (isWalkIn && paymentMode === "credit") return alert("Credit is not available for walk-in customers")
    const now = new Date(); let finalDate = now
    if (selectedDate) { const chosen = new Date(selectedDate); chosen.setHours(now.getHours(), now.getMinutes(), now.getSeconds()); finalDate = chosen }
    if (minSaleDate && finalDate < new Date(minSaleDate)) return alert("Cannot create a bill before the morning stock date (" + minSaleDate + ")")

    // Build sub-bills of ≤ ₹2,50,000 each
    const billParts = splitIntoBills(cart)
    const subBills = billParts.map(bi => {
      const biSubBefore = bi.reduce((a, b) => a + b.quantity * b.pricePerUnit, 0)
      const biItemDisc = bi.reduce((a, b) => a + b.discountAmount, 0)
      const biItemTotal = bi.reduce((a, b) => a + b.totalAmount, 0)
      const ratio = totalAmount > 0 ? biItemTotal / totalAmount : 1 / billParts.length
      const biBillDisc = Math.round(billDiscountAmount * ratio * 100) / 100
      const biTotal = Math.max(0, biItemTotal - biBillDisc)
      const biCash = Math.round(cashAmount * ratio * 100) / 100
      const biOnline = Math.round(onlineAmount * ratio * 100) / 100
      const biCredit = Math.round(creditAmount * ratio * 100) / 100
      return {
        items: bi,
        subTotalAmount: biSubBefore,
        totalDiscountAmount: biItemDisc + biBillDisc,
        totalAmount: biTotal,
        paymentMode,
        cashPaidAmount: biCash,
        onlinePaidAmount: biOnline,
        creditPaidAmount: biCredit,
      }
    })

    const res = await fetch("/api/tenant/sales", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedCustomer || null,
        customerName: selectedCustomerObj?.name || "Walk-In",
        saleDate: finalDate,
        items: cart,
        subBills: subBills.length > 1 ? subBills : [],
        subtotal: subtotalBeforeDiscount - totalDiscountAmount,
        taxAmount: 0,
        totalAmount,
        billDiscountAmount,
        totalDiscount: totalDiscountAmount,
        paidAmount: cashAmount + onlineAmount,
        dueAmount: Math.max(0, totalAmount - cashAmount - onlineAmount),
        paymentStatus: "paid",
        paymentMode,
        cashAmount,
        onlineAmount,
        creditAmount,
      }),
    })
    const data = await res.json()
    if (!res.ok) return alert(data.error)
    alert(`Sale completed!${subBills.length > 1 ? ` (Split into ${subBills.length} sub-bills)` : ""}`)
    setCart([]); setCashAmount(0); setOnlineAmount(0); setCreditAmount(0); setSelectedCustomer(""); setSelectedDate(""); setBillDiscountValue(0); setPaymentMode("cash")
    loadProducts(); loadRecentSales(); loadCustomers()
  }

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => showOutOfStock || p.currentStock > 0)
    .sort((a, b) => (b.currentStock > 0 ? 1 : 0) - (a.currentStock > 0 ? 1 : 0))
  const overlayExistingItem = overlayProduct ? cart.find(i => i.productId === overlayProduct._id) : undefined

  return (
    <div className="flex h-screen" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .product-card { transition: all 0.15s ease; }
        .product-card:hover:not(.disabled-card) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.12); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #BFDBFE; border-radius: 99px; }
      `}</style>

      {overlayProduct && <ProductOverlay product={overlayProduct} effectiveStock={getEffectiveStock(overlayProduct._id, overlayProduct.currentStock)} existingItem={overlayExistingItem} isWalkIn={isWalkIn} maxDiscountPerUnit={selectedCustomerObj?.maxDiscountPercentage ? overlayProduct.pricePerUnit * selectedCustomerObj.maxDiscountPercentage / 100 : overlayProduct.pricePerUnit} onConfirm={handleOverlayConfirm} onClose={() => setOverlayProduct(null)} />}

      {/* LEFT PANEL */}
      <div className="w-3/5 flex flex-col overflow-hidden border-r border-blue-100">
        <div className="px-6 py-4 bg-white border-b border-blue-100">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1 block">Customer</label>
              <select value={selectedCustomer} onChange={e => { setSelectedCustomer(e.target.value); setBillDiscountValue(0); if (!e.target.value) setPaymentMode("cash") }} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Walk-In Customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            {!isWalkIn && (
              <div>
                <label className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1 block">Bill Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={minSaleDate || undefined} className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            )}
            <div className="pt-5">
              <button onClick={() => setShowRecent(!showRecent)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${showRecent ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"}`}>
                Today&apos;s Sales
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
                <span className="text-xs text-slate-500">Credit Limit:</span>
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

        {/* Recent sales table */}
        {showRecent && (
          <div className="bg-white border-b border-blue-100 max-h-56 overflow-y-auto">
            <div className="px-5 py-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Sales</h3>
              <span className="text-xs text-slate-400 font-mono">{recentSales.length} sales</span>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No sales today</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider"><th className="text-left px-4 py-2 font-semibold">Invoice</th><th className="text-left px-4 py-2 font-semibold">Customer</th><th className="text-left px-4 py-2 font-semibold">Items</th><th className="text-right px-4 py-2 font-semibold">Amount</th><th className="text-right px-4 py-2 font-semibold">Paid</th><th className="text-right px-4 py-2 font-semibold">Due</th><th className="text-right px-4 py-2 font-semibold">Time</th></tr></thead>
                <tbody>
                  {recentSales.map(s => (
                    <tr key={s._id} className="border-t border-slate-100 hover:bg-blue-50/30">
                      <td className="px-4 py-2 font-mono text-blue-600">{s.saleNumber}</td>
                      <td className="px-4 py-2 text-slate-700">{s.customerName}</td>
                      <td className="px-4 py-2 text-slate-500">{s.items?.length || 0} items</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-slate-800">₹{(s.totalAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-600">₹{(s.paidAmount || 0).toLocaleString("en-IN")}</td>
                      <td className={`px-4 py-2 text-right font-mono ${(s.dueAmount || 0) > 0 ? "text-red-500" : "text-slate-400"}`}>₹{(s.dueAmount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2 text-right text-slate-400">{new Date(s.saleDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
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
          <div className="flex items-center gap-1.5 flex-shrink-0" title={scannerActive ? "Barcode scanner active — scan a product" : "Barcode scanner inactive — scan any barcode to activate"}>
            <svg className={`w-4 h-4 ${scannerActive ? "text-emerald-500" : "text-slate-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4V1m0 22v-3M4 12H1m22 0h-3M6.343 6.343L4.929 4.929m14.142 14.142l-1.414-1.414M6.343 17.657l-1.414 1.414M19.071 4.929l-1.414 1.414" />
            </svg>
            <span className={`text-[10px] uppercase tracking-wide leading-none font-semibold ${scannerActive ? "text-emerald-600" : "text-slate-400"}`}>
              {scannerActive ? "Scanner" : "Scanner Off"}
            </span>
            <span className={`w-2 h-2 rounded-full ${scannerActive ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {filteredProducts.map(p => {
            const effectiveStock = getEffectiveStock(p._id, p.currentStock)
            const outOfStock = effectiveStock <= 0
            const serverOutOfStock = p.currentStock <= 0
            const lowStock = effectiveStock > 0 && effectiveStock <= 5
            const inCart = cart.some(i => i.productId === p._id)
            return (
              <div key={p._id} onClick={() => openOverlay(p)}
                className={`product-card bg-white rounded-xl border p-4 select-none relative ${outOfStock && !inCart ? "disabled-card opacity-50 cursor-not-allowed border-slate-100 grayscale" : inCart ? "cursor-pointer border-blue-400 ring-1 ring-blue-200" : "cursor-pointer border-blue-100 hover:border-blue-400"}`}>
                {/* Out-of-stock overlay */}
                {(serverOutOfStock || (outOfStock && !inCart)) && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
                    <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">Out of Stock</span>
                  </div>
                )}
                {inCart && <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-500 z-20" />}
                {p.imageUrl && (
                  <Image src={p.imageUrl} alt={p.name} width={12} height={12} className="absolute bottom-2.5 right-2.5 w-12 h-12 rounded-md object-cover border border-slate-100 z-20" />
                )}
                <p className="font-medium text-sm leading-tight mb-2 text-slate-800 pr-4">{p.name}</p>
                <p className="font-mono text-base font-semibold text-blue-600">₹{p.pricePerUnit.toLocaleString("en-IN")}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  {serverOutOfStock
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Out of Stock</span>
                    : lowStock
                      ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Left: {effectiveStock}</span>
                      : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{effectiveStock}</span>
                  }
                  {inCart && effectiveStock > 0 && !serverOutOfStock && (
                    <span className="text-[10px] font-mono text-blue-500">({cartQtyMap.get(p._id)} in cart)</span>
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
            Order
            {cart.length > 0 && <span className="text-xs rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>{cart.length}</span>}
          </h2>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 transition-colors">Clear all</button>}
        </div>
        <div className="overflow-y-auto flex-1 px-3 py-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300"><svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m5-9v9m4-9v9m5-9l2 9" /></svg><p className="text-sm">Click a product to add</p></div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-blue-50/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.productName}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{item.quantity} × ₹{item.pricePerUnit}{item.discountAmount > 0 && <span className="text-emerald-500 ml-1.5">−₹{item.discountAmount.toFixed(2)}</span>}</p>
                </div>
                <p className="font-mono font-semibold text-sm text-slate-800 flex-shrink-0 mr-1">₹{item.totalAmount.toFixed(2)}</p>
                <button onClick={() => setOverlayProduct(products.find(p => p._id === item.productId) || null)} className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => removeItem(item.productId)} className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-blue-50 flex-shrink-0">
          {!isWalkIn && cart.length > 0 && (
            <div className="px-4 py-2 flex items-center gap-2 bg-blue-50/50 border-b border-blue-100">
              <span className="text-xs text-slate-500 flex-shrink-0 w-20">Bill Disc.</span>
              <span className="text-xs text-slate-400 flex-shrink-0">₹</span>
              <input type="number" min={0} value={billDiscountValue} onChange={e => { const v = Number(e.target.value); if (v < 0) return; setBillDiscountValue(Math.min(v, remainingDiscountBudget)) }} className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400" />
              {billDiscountAmount > 0 && <span className="text-xs text-emerald-600 font-mono whitespace-nowrap flex-shrink-0">−₹{billDiscountAmount.toFixed(2)}</span>}
              {selectedCustomerObj?.maxDiscountPercentage && maxAllowedDiscount !== Infinity && (
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">max ₹{remainingDiscountBudget.toFixed(0)}</span>
              )}
            </div>
          )}

          <div className="px-4 pt-3 pb-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Sub <span className="font-mono text-slate-700">₹{subtotalBeforeDiscount.toFixed(2)}</span></span>
                {totalDiscountAmount > 0 && <span className="text-emerald-600 font-mono">−₹{totalDiscountAmount.toFixed(2)}</span>}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 leading-none">Total</p>
                <p className="font-mono font-bold text-xl text-blue-600">₹{totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {(["cash", ...(isWalkIn ? [] : ["credit"])] as const).map(mode => (
                <button key={mode} onClick={() => setPaymentMode(mode as "cash" | "credit")} className={`flex-1 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${paymentMode === mode ? "text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
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
              <span className="text-slate-500">Paid <span className="font-mono font-medium text-slate-700">₹{paidAmount.toFixed(2)}</span></span>
              <span className={dueAmount > 0 ? "text-red-500" : "text-emerald-500"}>
                {dueAmount > 0 ? "Due" : "Change"} <span className="font-mono font-bold">₹{Math.abs(dueAmount).toFixed(2)}</span>
              </span>
            </div>

            {paymentMode === "credit" && selectedCustomerObj && cashAmount > 0 && creditAmount < totalAmount && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100">
                Credit capped at ₹{creditAmount.toLocaleString("en-IN")}. Remaining ₹{cashAmount.toLocaleString("en-IN")} in cash.
              </p>
            )}

            {totalAmount > 250000 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100">
                Bill will be split into {splitIntoBills(cart).length} bills (₹2.5L limit)
              </p>
            )}

            <button onClick={completeSale} disabled={cart.length === 0} className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
              Complete Sale →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
