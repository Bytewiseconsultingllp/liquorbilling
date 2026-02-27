"use client"

import { useEffect, useState, useMemo } from "react"

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`
const inputCls = "px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"

interface Product { _id: string; name: string; brand: string; volumeML: number; bottlesPerCaret?: number; currentStock: number; category?: string; purchasePricePerCaret?: number }
interface Vendor { _id: string; name: string }
interface CartItem {
  productId: string; productName: string; brand: string; volumeML: number;
  bottlesPerCaret: number; carets: number; bottles: number; totalBottles: number;
  purchasePricePerCaret: number; amount: number;
}
interface RecentPurchase {
  _id: string; purchaseNumber: string; vendorName: string; totalAmount: number;
  vatAmount: number; tcsAmount: number; paidAmount: number; dueAmount: number;
  createdAt: string; items: { productName: string; carets: number; bottles: number }[]
}

/* ──── Overlay Popup for adding / editing cart item ──── */
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

  const handleCarets = (v: number) => { if (v < 0) return; setCarets(v) }
  const handleBottles = (v: number) => { if (v < 0 || v >= bpc) return; setBottles(v) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-blue-100">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{product.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{product.brand} · {product.volumeML}ml · {bpc} bottles/caret</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-3 mt-0.5 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Carets */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Number of Carets</label>
            <div className="flex items-center gap-3">
              <button onClick={() => handleCarets(carets - 1)} disabled={carets <= 0} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">−</button>
              <input type="number" min={0} value={carets} onChange={e => handleCarets(Number(e.target.value))} className="flex-1 text-center border border-slate-200 rounded-xl py-2 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={() => handleCarets(carets + 1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 transition-colors text-lg">+</button>
            </div>
          </div>

          {/* Bottles (loose) */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Loose Bottles <span className="text-slate-300 normal-case">(max {bpc - 1})</span></label>
            <div className="flex items-center gap-3">
              <button onClick={() => handleBottles(bottles - 1)} disabled={bottles <= 0} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">−</button>
              <input type="number" min={0} max={bpc - 1} value={bottles} onChange={e => handleBottles(Number(e.target.value))} className="flex-1 text-center border border-slate-200 rounded-xl py-2 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={() => handleBottles(bottles + 1)} disabled={bottles >= bpc - 1} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 transition-colors text-lg">+</button>
            </div>
          </div>

          {/* Purchase Price per Caret */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Purchase Price / Caret (₹)</label>
            <input type="number" min={0} value={price} onChange={e => { const v = Number(e.target.value); if (v >= 0) setPrice(v) }}
              className="w-full text-center border border-slate-200 rounded-xl py-2.5 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="0" />
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Total Bottles</span><span className="font-semibold text-slate-800">{totalBottles}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="text-slate-400">Line Amount</span><span className="font-bold text-blue-600">₹{lineAmount.toLocaleString("en-IN")}</span></div>
          </div>
        </div>

        {/* Action */}
        <div className="px-6 pb-6">
          <button onClick={() => { if (carets <= 0 && bottles <= 0) return alert("Add at least 1 caret or bottle"); if (price <= 0) return alert("Enter purchase price"); onConfirm(carets, bottles, price) }}
            className="w-full py-3 text-white text-sm font-semibold rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
            {existingItem ? "Update Item" : "Add to Cart"} →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──── Main Purchase Page ──── */
export default function PurchasePage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedVendor, setSelectedVendor] = useState("")
  const [items, setItems] = useState<CartItem[]>([])
  const [paymentStatus, setPaymentStatus] = useState("pending")
  const [paidAmount, setPaidAmount] = useState(0)
  const [search, setSearch] = useState("")
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Overlay state
  const [overlayProduct, setOverlayProduct] = useState<Product | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/tenant/vendors").then(r => r.json()).then(d => setVendors(d.data || []))
    fetch("/api/tenant/products?limit=all").then(r => r.json()).then(d => setProducts(d.data || []))
    fetchTodayPurchases()
  }, [])

  const fetchTodayPurchases = () => {
    fetch("/api/tenant/purchases?filter=today").then(r => r.json()).then(d => setRecentPurchases(d.data || []))
  }

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
  }, [products, search])

  // ── Cart logic ──
  const openAddOverlay = (product: Product) => {
    // Check if already in cart
    const idx = items.findIndex(i => i.productId === product._id)
    if (idx >= 0) {
      setEditingIndex(idx)
      setOverlayProduct(product)
    } else {
      setEditingIndex(null)
      setOverlayProduct(product)
    }
  }

  const handleOverlayConfirm = (carets: number, bottles: number, price: number) => {
    if (!overlayProduct) return
    const bpc = overlayProduct.bottlesPerCaret || 12
    const totalBottles = carets * bpc + bottles
    const amount = carets * price

    const newItem: CartItem = {
      productId: overlayProduct._id,
      productName: overlayProduct.name,
      brand: overlayProduct.brand,
      volumeML: overlayProduct.volumeML,
      bottlesPerCaret: bpc,
      carets,
      bottles,
      totalBottles,
      purchasePricePerCaret: price,
      amount,
    }

    if (editingIndex !== null) {
      // Update existing
      const updated = [...items]
      updated[editingIndex] = newItem
      setItems(updated)
    } else {
      // FILO: insert at top
      setItems([newItem, ...items])
    }
    setOverlayProduct(null)
    setEditingIndex(null)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // ── Tax calculations ──
  const subtotal = items.reduce((acc, item) => acc + item.amount, 0)
  const vatRate = 35
  const vatAmount = Math.round(subtotal * vatRate / 100)
  const tcsRate = 1
  const tcsAmount = Math.round((subtotal + vatAmount) * tcsRate / 100)
  const taxAmount = vatAmount + tcsAmount
  const totalAmount = subtotal + taxAmount
  const dueAmount = totalAmount - paidAmount

  // ── Submit ──
  const submitPurchase = async () => {
    if (!selectedVendor) return alert("Select vendor")
    if (items.length === 0) return alert("Add at least one product")
    setSubmitting(true)
    const vendor = vendors.find(v => v._id === selectedVendor)
    const res = await fetch("/api/tenant/purchases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendorId: selectedVendor, vendorName: vendor?.name, purchaseDate: new Date(),
        items, subtotal, vatRate, vatAmount, tcsRate, tcsAmount, taxAmount, totalAmount,
        paymentStatus, paidAmount, dueAmount,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) return alert(data.error)
    alert("Purchase Created Successfully!")
    setItems([]); setSelectedVendor(""); setPaidAmount(0); setPaymentStatus("pending")
    fetchTodayPurchases()
  }

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Procurement</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">New Purchase</h1>
        <p className="text-slate-500 text-sm mt-1">Record a new vendor purchase with tax calculation</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN: Vendor + Products + Payment ── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Vendor Selection */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-1 text-sm">Select Vendor</h2>
            <p className="text-xs text-slate-400 mb-3">Choose the supplier</p>
            <select className={`${inputCls} w-full`} value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)}>
              <option value="">-- Select Vendor --</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>

          {/* Product Selection with Search */}
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-1 text-sm">Add Products</h2>
            <p className="text-xs text-slate-400 mb-3">Search and click to add</p>
            <input type="text" placeholder="Search by name, brand, category..." value={search} onChange={e => setSearch(e.target.value)}
              className={`${inputCls} w-full mb-3`} />
            <div className="max-h-[40vh] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredProducts.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No products found</p>}
              {filteredProducts.map(p => {
                const inCart = items.some(i => i.productId === p._id)
                return (
                  <button key={p._id} onClick={() => openAddOverlay(p)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                      inCart ? "border-blue-200 bg-blue-50/80" : "border-slate-100 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-100"
                    }`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.brand} · {p.volumeML}ml · {p.bottlesPerCaret || 12} btl/crt</p>
                    </div>
                    {inCart ? (
                      <span className="shrink-0 ml-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </span>
                    ) : (
                      <span className="shrink-0 ml-2 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Payment Options */}
          {items.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-3 text-sm">Payment</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Payment Status</label>
                  <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className={`${inputCls} w-full`}>
                    <option value="pending">Pending</option><option value="partial">Partial</option><option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Paid Amount (₹)</label>
                  <input type="number" min={0} value={paidAmount} onChange={e => { const v = Number(e.target.value); if (v >= 0) setPaidAmount(v) }} className={`${inputCls} w-full`} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Due Amount</span>
                  <span className={`text-sm font-bold ${dueAmount > 0 ? "text-red-500" : "text-emerald-600"}`}>₹{dueAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tax & Total Summary */}
          {items.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm">Tax & Total Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">VAT ({vatRate}% on Subtotal)</span>
                  <span className="font-medium text-slate-900">₹{vatAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TCS ({tcsRate}% on Subtotal + VAT)</span>
                  <span className="font-medium text-slate-900">₹{tcsAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Total Tax</span>
                  <span className="font-semibold text-orange-600">₹{taxAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-semibold text-slate-800 text-base">Grand Total</span>
                  <span className="font-bold text-blue-700 text-base">₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button onClick={submitPurchase} disabled={submitting}
                className="w-full mt-5 py-3 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                {submitting ? "Submitting..." : "Submit Purchase →"}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Cart + Tax + Submit + Recent ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cart Table */}
          <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">Purchase Cart</h2>
                <p className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? "s" : ""}</p>
              </div>
              {items.length > 0 && (
                <button onClick={() => { if (confirm("Clear all items?")) setItems([]) }} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">Clear All</button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4" /></svg>
                </div>
                <p className="text-sm text-slate-400">No items yet. Select products from the left.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Product", "Carets", "Bottles", "Price/Caret", "Amount", ""].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900 text-sm">{item.productName}</p>
                          <p className="text-xs text-slate-400">{item.brand} · {item.volumeML}ml · {item.totalBottles} bottles total</p>
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-700">{item.carets}</td>
                        <td className="px-5 py-3 font-mono text-slate-700">{item.bottles}</td>
                        <td className="px-5 py-3 font-mono text-slate-700">₹{item.purchasePricePerCaret.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">₹{item.amount.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingIndex(index); setOverlayProduct(products.find(p => p._id === item.productId) || null) }}
                              className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors" title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => removeItem(index)}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors" title="Remove">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Purchases (Today) */}
          <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 text-sm">Today&apos;s Purchases</h2>
              <p className="text-xs text-slate-400">Purchases recorded today</p>
            </div>
            {recentPurchases.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No purchases today</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Purchase #", "Vendor", "Items", "Total", "Paid", "Due", "Time"].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentPurchases.map(p => (
                      <tr key={p._id} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-blue-600 font-medium">{p.purchaseNumber}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{p.vendorName}</td>
                        <td className="px-5 py-3 text-slate-500">{p.items?.length || 0} items</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">₹{p.totalAmount?.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-3 text-emerald-600">₹{p.paidAmount?.toLocaleString("en-IN") || 0}</td>
                        <td className="px-5 py-3">
                          <span className={`font-medium ${(p.dueAmount || 0) > 0 ? "text-red-500" : "text-emerald-600"}`}>₹{p.dueAmount?.toLocaleString("en-IN") || 0}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">{new Date(p.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay popup */}
      {overlayProduct && (
        <ItemOverlay
          product={overlayProduct}
          existingItem={editingIndex !== null ? items[editingIndex] : undefined}
          onConfirm={handleOverlayConfirm}
          onClose={() => { setOverlayProduct(null); setEditingIndex(null) }}
        />
      )}
    </div>
  )
}
