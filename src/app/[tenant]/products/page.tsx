"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Papa from "papaparse";

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
const errCls = "text-xs text-red-500 mt-1"

interface PForm { name: string; brand: string; category: string; pricePerUnit: number; volumeML: number; currentStock: number; bottlesPerCaret: number; reorderLevel: number; purchasePricePerCaret: number }
const emptyForm: PForm = { name: "", brand: "", category: "", pricePerUnit: 0, volumeML: 0, currentStock: 0, bottlesPerCaret: 0, reorderLevel: 0, purchasePricePerCaret: 0 }

function validate(f: PForm): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = "Product name is required"
  if (!f.brand.trim()) e.brand = "Brand is required"
  if (!f.category.trim()) e.category = "Category is required"
  if (f.pricePerUnit <= 0) e.pricePerUnit = "Price must be greater than 0"
  if (f.volumeML < 0) e.volumeML = "Volume cannot be negative"
  if (f.currentStock < 0) e.currentStock = "Stock cannot be negative"
  if (f.bottlesPerCaret < 0) e.bottlesPerCaret = "Cannot be negative"
  if (f.reorderLevel < 0) e.reorderLevel = "Cannot be negative"
  if (f.purchasePricePerCaret < 0) e.purchasePricePerCaret = "Cannot be negative"
  return e
}

function downloadTemplate() {
  const csv = "name,brand,category,pricePerUnit,volumeML,currentStock,bottlesPerCaret,reorderLevel,purchasePricePerCaret,barcodes,imageUrl,morningStock,morningStockLastUpdatedDate\nRoyal Stag,Pernod Ricard,Whisky,450,750,100,12,20,3500,8901234567890,https://example.com/royal-stag.jpg,95,2026-02-24\nKingfisher,UB Group,Beer,150,650,200,24,50,2400,8901234567891|8901234567892,https://example.com/kingfisher.jpg,190,2026-02-24"
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "products_template.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function TenantProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState<PForm>({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Barcode scanner state
  const [barcodeProduct, setBarcodeProduct] = useState<any>(null)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [barcodeScanning, setBarcodeScanning] = useState(false)
  const [barcodeUpdating, setBarcodeUpdating] = useState(false)
  const barcodeScanBuffer = useRef("")
  const barcodeScanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openBarcodeScanner = (p: any) => {
    setBarcodeProduct(p)
    setScannedBarcode("")
    setBarcodeScanning(true)
    barcodeScanBuffer.current = ""
  }

  const closeBarcodeScanner = () => {
    setBarcodeProduct(null)
    setScannedBarcode("")
    setBarcodeScanning(false)
    barcodeScanBuffer.current = ""
    if (barcodeScanTimer.current) clearTimeout(barcodeScanTimer.current)
  }

  const updateBarcode = async () => {
    if (!barcodeProduct || !scannedBarcode) return
    setBarcodeUpdating(true)
    try {
      const res = await fetch(`/api/tenant/products/${barcodeProduct._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appendBarcode: scannedBarcode }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || "Failed to update barcode"); return }
      closeBarcodeScanner()
      fetchProducts()
    } catch { alert("Failed to update barcode") }
    setBarcodeUpdating(false)
  }

  // Barcode scanner keyboard listener
  useEffect(() => {
    if (!barcodeScanning) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const code = barcodeScanBuffer.current.trim()
        barcodeScanBuffer.current = ""
        if (barcodeScanTimer.current) { clearTimeout(barcodeScanTimer.current); barcodeScanTimer.current = null }
        if (code.length >= 3) setScannedBarcode(code)
        return
      }
      if (e.key.length === 1) {
        barcodeScanBuffer.current += e.key
        if (barcodeScanTimer.current) clearTimeout(barcodeScanTimer.current)
        barcodeScanTimer.current = setTimeout(() => { barcodeScanBuffer.current = "" }, 100)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
      if (barcodeScanTimer.current) clearTimeout(barcodeScanTimer.current)
    }
  }, [barcodeScanning])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenant/products?q=${search}&page=${page}&limit=10`)
      const data = await res.json()
      setProducts(data.data || []); setTotalPages(data.pagination?.totalPages || 1)
    } catch { console.error("Failed to fetch products") }
  }, [search, page])
  useEffect(() => { fetchProducts() }, [fetchProducts])

  const openCreate = () => { setForm({ ...emptyForm }); setErrors({}); setApiError(""); setEditId(null); setShowModal(true) }
  const openEdit = (p: any) => {
    setForm({ name: p.name, brand: p.brand, category: p.category, pricePerUnit: p.pricePerUnit, volumeML: p.volumeML || 0, currentStock: p.currentStock, bottlesPerCaret: p.bottlesPerCaret || 0, reorderLevel: p.reorderLevel || 0, purchasePricePerCaret: p.purchasePricePerCaret || 0 })
    setErrors({}); setApiError(""); setEditId(p._id); setShowModal(true)
  }

  const handleCSVUpload = (file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as any[]).map(r => ({
          ...r,
          pricePerUnit: r.pricePerUnit ? Number(r.pricePerUnit) : 0,
          volumeML: r.volumeML ? Number(r.volumeML) : 0,
          currentStock: r.currentStock ? Number(r.currentStock) : 0,
          bottlesPerCaret: r.bottlesPerCaret ? Number(r.bottlesPerCaret) : undefined,
          reorderLevel: r.reorderLevel ? Number(r.reorderLevel) : undefined,
          purchasePricePerCaret: r.purchasePricePerCaret ? Number(r.purchasePricePerCaret) : undefined,
          barcodes: r.barcodes || undefined,
          imageUrl: r.imageUrl?.trim() || undefined,
          morningStock: r.morningStock ? Number(r.morningStock) : undefined,
          morningStockLastUpdatedDate: r.morningStockLastUpdatedDate?.trim() || undefined,
        }))
        const res = await fetch("/api/tenant/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) })
        const data = await res.json()
        if (!res.ok) { alert(data.error) } else { alert(`Created ${data.created} products`); fetchProducts() }
      },
    })
  }

  const handleSubmit = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setApiError("")

    const payload: any = { ...form }
    if (!payload.bottlesPerCaret) delete payload.bottlesPerCaret
    if (!payload.reorderLevel) delete payload.reorderLevel
    if (!payload.purchasePricePerCaret) delete payload.purchasePricePerCaret

    const url = editId ? `/api/tenant/products/${editId}` : "/api/tenant/products"
    const method = editId ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) { setApiError(data.error || "Something went wrong"); return }
    setShowModal(false); fetchProducts()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return
    const res = await fetch(`/api/tenant/products/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchProducts()
  }

  const setField = (k: keyof PForm, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  const stockStyle = (n: number) =>
    n > 10 ? { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" } :
    n > 0  ? { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" } :
             { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {/* Barcode Scanner Overlay */}
      {barcodeScanning && barcodeProduct && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && closeBarcodeScanner()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">Update Barcode</h2>
                <p className="text-xs text-slate-400 mt-0.5">{barcodeProduct.name}</p>
              </div>
              <button onClick={closeBarcodeScanner} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              {/* Existing barcodes */}
              {barcodeProduct.barcodes && barcodeProduct.barcodes.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Existing Barcodes</label>
                  <div className="flex flex-wrap gap-2">
                    {barcodeProduct.barcodes.map((b: any, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded-lg border border-slate-200">{b.code || b}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scanner area */}
              <div className="text-center py-6">
                {!scannedBarcode ? (
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4V1m0 22v-3M4 12H1m22 0h-3M6.343 6.343L4.929 4.929m14.142 14.142l-1.414-1.414M6.343 17.657l-1.414 1.414M19.071 4.929l-1.414 1.414" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-700">Waiting for barcode scan...</p>
                    <p className="text-xs text-slate-400 mt-1">Point the barcode scanner at the product</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Scanned Barcode</p>
                    <p className="font-mono text-2xl font-bold text-slate-900 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 inline-block">{scannedBarcode}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={closeBarcodeScanner} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Cancel</button>
              <button onClick={updateBarcode} disabled={!scannedBarcode || barcodeUpdating} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                {barcodeUpdating ? "Updating..." : "Update Barcode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">{editId ? "Edit Product" : "New Product"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editId ? "Update product details" : "Add to your product catalog"}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 max-h-[65vh] overflow-y-auto">
              {apiError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 mb-4">{apiError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Product Name *</label>
                  <input className={`${inputCls} ${errors.name ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="Product name" value={form.name} onChange={e => setField("name", e.target.value)} />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Brand *</label>
                  <input className={`${inputCls} ${errors.brand ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="Brand" value={form.brand} onChange={e => setField("brand", e.target.value)} />
                  {errors.brand && <p className={errCls}>{errors.brand}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
                  <input className={`${inputCls} ${errors.category ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="Whisky, Beer, Rum..." value={form.category} onChange={e => setField("category", e.target.value)} />
                  {errors.category && <p className={errCls}>{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Price per Unit (₹) *</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.pricePerUnit ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.pricePerUnit || ""} onChange={e => setField("pricePerUnit", Number(e.target.value))} />
                  {errors.pricePerUnit && <p className={errCls}>{errors.pricePerUnit}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Volume (ML)</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.volumeML ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.volumeML || ""} onChange={e => setField("volumeML", Number(e.target.value))} />
                  {errors.volumeML && <p className={errCls}>{errors.volumeML}</p>}
                </div>
                {!editId && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Initial Stock</label>
                    <input type="number" min={0} className={`${inputCls} ${errors.currentStock ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.currentStock || ""} onChange={e => setField("currentStock", Number(e.target.value))} />
                    {errors.currentStock && <p className={errCls}>{errors.currentStock}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Bottles / Caret</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.bottlesPerCaret ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.bottlesPerCaret || ""} onChange={e => setField("bottlesPerCaret", Number(e.target.value))} placeholder="12" />
                  {errors.bottlesPerCaret && <p className={errCls}>{errors.bottlesPerCaret}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Reorder Level</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.reorderLevel ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.reorderLevel || ""} onChange={e => setField("reorderLevel", Number(e.target.value))} placeholder="20" />
                  {errors.reorderLevel && <p className={errCls}>{errors.reorderLevel}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Purchase Price / Caret (₹)</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.purchasePricePerCaret ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.purchasePricePerCaret || ""} onChange={e => setField("purchasePricePerCaret", Number(e.target.value))} placeholder="3500" />
                  {errors.purchasePricePerCaret && <p className={errCls}>{errors.purchasePricePerCaret}</p>}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>{editId ? "Save Changes" : "Create Product"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Catalog</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your product catalog</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Bulk Upload
              <input type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleCSVUpload(e.target.files[0]); e.target.value = "" }} />
            </label>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              + Add Product
            </button>
          </div>
        </div>

        <div className="relative mb-5">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search products…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-72 shadow-sm" />
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Name", "Brand", "Category", "Price", "Volume", "Stock", "Btl/Crt", "Reorder", ""].map(h => (
                    <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => {
                  const ss = stockStyle(p.currentStock)
                  const lowStock = p.reorderLevel && p.currentStock <= p.reorderLevel
                  return (
                    <tr key={p._id} className={`hover:bg-blue-50/30 transition-colors ${lowStock ? "bg-amber-50/40" : ""}`}>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{p.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.brand}</td>
                      <td className="px-5 py-4"><span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs rounded-full">{p.category}</span></td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">₹{p.pricePerUnit}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.volumeML ? `${p.volumeML}ml` : "—"}</td>
                      <td className="px-5 py-4"><span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ background: ss.bg, color: ss.text, borderColor: ss.border }}>{p.currentStock}</span></td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.bottlesPerCaret || "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.reorderLevel || "—"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openBarcodeScanner(p)} className="px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-100 rounded-lg hover:bg-purple-50 transition-all" title="Update barcode">
                            <svg className="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4V1m0 22v-3M4 12H1m22 0h-3M6.343 6.343L4.929 4.929m14.142 14.142l-1.414-1.414M6.343 17.657l-1.414 1.414M19.071 4.929l-1.414 1.414" /></svg>
                            Barcode
                          </button>
                          <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">Edit</button>
                          <button onClick={() => deleteProduct(p._id)} className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {products.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No products found</div>}
        </div>

        <div className="flex items-center justify-between mt-5 px-1">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white">← Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
