"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Papa from "papaparse";

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }
.image-drop-zone { border: 2px dashed #CBD5E1; transition: all 0.2s; }
.image-drop-zone.drag-over { border-color: #2563EB; background: #EFF6FF; }
.image-drop-zone:hover { border-color: #94A3B8; }`
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
const errCls = "text-xs text-red-500 mt-1"

/** Extract actual image URL from Google Images / redirector wrapper URLs */
function extractImageUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith("http")) return trimmed
  try {
    const u = new URL(trimmed)
    // Google Images: /imgres?imgurl=<encoded-url>
    const imgurl = u.searchParams.get("imgurl")
    if (imgurl) return imgurl
    // Google redirect: /url?url=<encoded-url> or ?q=<encoded-url>
    if (u.hostname.includes("google") && (u.searchParams.get("url") || u.searchParams.get("q"))) {
      const target = u.searchParams.get("url") || u.searchParams.get("q") || ""
      if (target.startsWith("http")) return target
    }
  } catch { /* not a valid URL, return as-is */ }
  return trimmed
}

interface PForm { name: string; brand: string; category: string; pricePerUnit: number; volumeML: number; currentStock: number; bottlesPerCaret: number; reorderLevel: number; purchasePricePerCaret: number; imageUrl: string }
const emptyForm: PForm = { name: "", brand: "", category: "", pricePerUnit: 0, volumeML: 0, currentStock: 0, bottlesPerCaret: 0, reorderLevel: 0, purchasePricePerCaret: 0, imageUrl: "" }

function validate(f: PForm): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = "Product name is required"
  if (!f.brand.trim()) e.brand = "Brand is required"
  if (!f.category.trim()) e.category = "Category is required"
  if (f.pricePerUnit <= 0) e.pricePerUnit = "Price must be > 0"
  if (f.volumeML <= 0) e.volumeML = "Volume must be > 0"
  if (f.currentStock < 0) e.currentStock = "Stock cannot be negative"
  return e
}

function downloadTemplate() {
  const csv = "name,brand,category,volumeML,pricePerUnit,currentStock,bottlesPerCaret,reorderLevel,purchasePricePerCaret,barcodes,imageUrl\nSample Whisky,Royal,IMFL,750,450,100,12,10,3000,,https://..."
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = "products_template.csv"; a.click()
  URL.revokeObjectURL(url)
}

/* ── Reusable ImageUploader ────────────────────────── */
export function ImageUploader({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const [tab, setTab] = useState<"file" | "url">("file")
  const [dragOver, setDragOver] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]) }

  const applyUrl = () => {
    const trimmed = urlInput.trim()
    if (trimmed && (trimmed.startsWith("http") || trimmed.startsWith("data:image"))) { onChange(trimmed); setUrlInput("") }
  }

  if (value) {
    return (
      <div className={`relative group ${compact ? "w-16 h-16" : "w-full"}`}>
        <img src={value} alt="preview" className={`${compact ? "w-16 h-16" : "w-full h-32"} object-cover rounded-xl border border-slate-200`} />
        <button type="button" onClick={() => onChange("")}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <button type="button" onClick={() => setTab("file")} className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${tab === "file" ? "bg-blue-100 text-blue-700" : "text-slate-400 hover:text-slate-600"}`}>File</button>
        <button type="button" onClick={() => setTab("url")} className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${tab === "url" ? "bg-blue-100 text-blue-700" : "text-slate-400 hover:text-slate-600"}`}>URL / Base64</button>
      </div>
      {tab === "file" ? (
        <div
          className={`image-drop-zone rounded-xl p-4 text-center cursor-pointer ${dragOver ? "drag-over" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <svg className="w-6 h-6 mx-auto text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-xs text-slate-400">Drop image or click to browse</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) readFile(e.target.files[0]); e.target.value = "" }} />
        </div>
      ) : (
        <div className="flex gap-2">
          <input placeholder="https://... or data:image/..." value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyUrl() } }}
            className={`${inputCls} flex-1`} />
          <button type="button" onClick={applyUrl} className="px-3 py-2 text-xs font-semibold text-white rounded-xl shrink-0"
            style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>Set</button>
        </div>
      )}
    </div>
  )
}

/* ── Main Product Page ─────────────────────────────── */
export default function ProductPage() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState<PForm>({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [barcodeMode, setBarcodeMode] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")

  // Image update overlay state
  const [imageProduct, setImageProduct] = useState<any>(null)
  const [imageValue, setImageValue] = useState("")
  const [imageUpdating, setImageUpdating] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState("")

  // Barcode management overlay state
  const [barcodeProduct, setBarcodeProduct] = useState<any>(null)
  const [newBarcode, setNewBarcode] = useState("")
  const [barcodeAdding, setBarcodeAdding] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState("")
  const [scannerMode, setScannerMode] = useState(true)
  const scanBufferRef = useRef("")
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/tenant/products?q=${search}&page=${page}`, { signal })
      const data = await res.json()
      setProducts(data.data || []); setTotalPages(data.pagination?.totalPages || 1)
    } catch (e: unknown) { if (e instanceof DOMException && e.name === "AbortError") return; console.error("Failed to fetch products") }
  }, [search, page])
  useEffect(() => { const ac = new AbortController(); fetchProducts(ac.signal); return () => ac.abort() }, [fetchProducts])

  const openCreate = () => { setForm({ ...emptyForm }); setErrors({}); setApiError(""); setEditId(null); setShowModal(true) }
  const openEdit = (p: any) => {
    setForm({
      name: p.name, brand: p.brand || "", category: p.category || "",
      pricePerUnit: p.pricePerUnit || 0, volumeML: p.volumeML || 0, currentStock: p.currentStock || 0,
      bottlesPerCaret: p.bottlesPerCaret || 0, reorderLevel: p.reorderLevel || 0,
      purchasePricePerCaret: p.purchasePricePerCaret || 0,
      imageUrl: p.imageUrl || p.imageBase64 || "",
    })
    setErrors({}); setApiError(""); setEditId(p._id); setShowModal(true)
  }

  const openImageUpdate = (p: any) => { setImageProduct(p); setImageValue(p.imageUrl || p.imageBase64 || ""); setImageUrlInput(p.imageUrl || "") }
  const closeImageUpdate = () => { setImageProduct(null); setImageValue(""); setImageUrlInput("") }

  // Barcode management
  const openBarcodeUpdate = (p: any) => { setBarcodeProduct(p); setNewBarcode(""); setScannedBarcode(""); setScannerMode(true) }
  const closeBarcodeUpdate = () => { setBarcodeProduct(null); setNewBarcode(""); setScannedBarcode(""); scanBufferRef.current = "" }

  // Scanner detection: barcode scanners type very fast (< 50ms between chars) and end with Enter
  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
      const value = scannerMode ? scanBufferRef.current || newBarcode.trim() : newBarcode.trim()
      if (value) {
        setScannedBarcode(value)
        setNewBarcode("")
        scanBufferRef.current = ""
      }
    }
  }
  const handleScannerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewBarcode(val)
    if (scannerMode) {
      scanBufferRef.current = val
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
      scanTimerRef.current = setTimeout(() => { scanBufferRef.current = "" }, 300)
    }
  }

  const confirmBarcode = async () => {
    if (!barcodeProduct || !scannedBarcode.trim()) return
    // Check duplicate
    const existing = (barcodeProduct.barcodes || []).map((b: any) => (b.code || b).toString())
    if (existing.includes(scannedBarcode.trim())) { alert("This barcode already exists on this product"); setScannedBarcode(""); return }
    setBarcodeAdding(true)
    const res = await fetch(`/api/tenant/products/${barcodeProduct._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appendBarcode: scannedBarcode.trim() }) })
    setBarcodeAdding(false)
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    setScannedBarcode("")
    // Refresh product data so the overlay shows the new barcode
    const refreshed = await fetch(`/api/tenant/products?q=${barcodeProduct.name}&page=1`)
    const rData = await refreshed.json()
    const updated = (rData.data || []).find((p: any) => p._id === barcodeProduct._id)
    if (updated) setBarcodeProduct(updated)
    fetchProducts()
    // Re-focus input for next scan
    setTimeout(() => barcodeInputRef.current?.focus(), 100)
  }

  const addBarcode = async () => {
    if (!barcodeProduct || !newBarcode.trim()) return
    setScannedBarcode(newBarcode.trim())
    setNewBarcode("")
  }
  const removeBarcode = async (barcodeId: string) => {
    if (!barcodeProduct) return
    const updated = (barcodeProduct.barcodes || []).filter((b: any) => (b._id || b) !== barcodeId)
    const res = await fetch(`/api/tenant/products/${barcodeProduct._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barcodes: updated }) })
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    setBarcodeProduct({ ...barcodeProduct, barcodes: updated })
    fetchProducts()
  }
  const updateImage = async () => {
    if (!imageProduct) return
    setImageUpdating(true)
    const payload: any = {}
    if (!imageValue) { payload.imageUrl = ""; payload.imageBase64 = ""; payload.imageMimeType = "" }
    else if (imageValue.startsWith("data:image")) {
      const match = imageValue.match(/^data:image\/(\w+);base64,/)
      payload.imageBase64 = imageValue; payload.imageMimeType = match ? `image/${match[1]}` : "image/png"; payload.imageUrl = ""
    } else { payload.imageUrl = extractImageUrl(imageValue); payload.imageBase64 = ""; payload.imageMimeType = "" }
    const res = await fetch(`/api/tenant/products/${imageProduct._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setImageUpdating(false)
    if (!res.ok) { const d = await res.json(); alert(d.error); return }
    closeImageUpdate(); fetchProducts()
  }

  const handleCSVUpload = (file: File) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as any[]).map(r => ({
          ...r,
          volumeML: r.volumeML ? Number(r.volumeML) : 0,
          pricePerUnit: r.pricePerUnit ? Number(r.pricePerUnit) : 0,
          currentStock: r.currentStock ? Number(r.currentStock) : 0,
          bottlesPerCaret: r.bottlesPerCaret ? Number(r.bottlesPerCaret) : undefined,
          reorderLevel: r.reorderLevel ? Number(r.reorderLevel) : undefined,
          purchasePricePerCaret: r.purchasePricePerCaret ? Number(r.purchasePricePerCaret) : undefined,
          imageUrl: r.imageUrl || undefined,
        }))
        const res = await fetch("/api/tenant/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) })
        const data = await res.json()
        if (!res.ok) { alert(data.error) } else { alert(`Created ${data.created} products`); fetchProducts() }
      },
    })
  }

  const exportProducts = async () => {
    try {
      const res = await fetch(`/api/tenant/products?limit=0`)
      const data = await res.json()
      const allProducts = data.data || []
      if (allProducts.length === 0) return alert("No products to export")
      const rows = allProducts.map((p: any) => ({
        name: p.name, brand: p.brand, category: p.category, volumeML: p.volumeML,
        pricePerUnit: p.pricePerUnit, currentStock: p.currentStock,
        bottlesPerCaret: p.bottlesPerCaret || "", reorderLevel: p.reorderLevel || "",
        purchasePricePerCaret: p.purchasePricePerCaret || "",
        barcodes: (p.barcodes || []).map((b: any) => b.code || b).join(";"),
        imageUrl: p.imageUrl || p.imageBase64 || "",
      }))
      const csv = Papa.unparse(rows)
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `products_export_${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert("Failed to export products") }
  }

  const handleSubmit = async () => {
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setApiError("")

    const payload: any = {
      name: form.name, brand: form.brand, category: form.category,
      pricePerUnit: form.pricePerUnit, volumeML: form.volumeML, currentStock: form.currentStock,
      bottlesPerCaret: form.bottlesPerCaret || undefined, reorderLevel: form.reorderLevel || undefined,
      purchasePricePerCaret: form.purchasePricePerCaret || undefined,
    }
    // Handle image
    if (form.imageUrl) {
      if (form.imageUrl.startsWith("data:image")) {
        const match = form.imageUrl.match(/^data:image\/(\w+);base64,/)
        payload.imageBase64 = form.imageUrl; payload.imageMimeType = match ? `image/${match[1]}` : "image/png"
      } else { payload.imageUrl = extractImageUrl(form.imageUrl) }
    }

    const url = editId ? `/api/tenant/products/${editId}` : "/api/tenant/products"
    const method = editId ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (!res.ok) { setApiError(data.error || "Something went wrong"); return }
    setShowModal(false); fetchProducts()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete product?")) return
    const res = await fetch(`/api/tenant/products/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchProducts()
  }

  const handleBarcodeSubmit = async () => {
    if (!barcodeInput.trim()) return
    const res = await fetch(`/api/tenant/products?q=${barcodeInput.trim()}&page=1`)
    const data = await res.json()
    const found = (data.data || []).find((p: any) => (p.barcodes || []).includes(barcodeInput.trim()))
    if (found) { openEdit(found) } else { setForm({ ...emptyForm }); setEditId(null); setShowModal(true); setApiError("No product found for this barcode. Creating new.") }
    setBarcodeInput(""); setBarcodeMode(false)
  }

  const setField = (k: keyof PForm, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {/* Image Update Overlay */}
      {imageProduct && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && closeImageUpdate()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-bold text-slate-900">Update Image</h2>
                <p className="text-xs text-slate-400 mt-0.5">{imageProduct.name}</p>
              </div>
              <button onClick={closeImageUpdate} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <ImageUploader value={imageValue} onChange={(v) => { setImageValue(v); if (!v.startsWith("data:")) setImageUrlInput(v) }} />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Image URL</label>
                <div className="flex gap-2">
                  <input placeholder="https://... paste image URL" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = extractImageUrl(imageUrlInput); if (v && v.startsWith("http")) { setImageUrlInput(v); setImageValue(v) } } }}
                    className={`${inputCls} flex-1`} />
                  <button type="button" onClick={() => { const v = extractImageUrl(imageUrlInput); if (v && v.startsWith("http")) { setImageUrlInput(v); setImageValue(v) } }}
                    className="px-3 py-2 text-xs font-semibold text-white rounded-xl shrink-0"
                    style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>Set</button>
                </div>
                {imageValue && imageValue.startsWith("http") && <p className="text-xs text-slate-400 mt-1 truncate" title={imageValue}>Current: {imageValue}</p>}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={closeImageUpdate} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Cancel</button>
              <button onClick={updateImage} disabled={imageUpdating} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                {imageUpdating ? "Saving…" : "Save Image"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Management Overlay */}
      {barcodeProduct && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && closeBarcodeUpdate()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-bold text-slate-900">Manage Barcodes</h2>
                <p className="text-xs text-slate-400 mt-0.5">{barcodeProduct.name} · {barcodeProduct.brand}</p>
              </div>
              <button onClick={closeBarcodeUpdate} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Scanner / Manual Toggle */}
              <div className="flex items-center gap-2">
                <button onClick={() => { setScannerMode(true); setScannedBarcode(""); setNewBarcode("") }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${scannerMode ? "bg-blue-100 text-blue-700" : "text-slate-400 hover:text-slate-600"}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  Scanner
                </button>
                <button onClick={() => { setScannerMode(false); setScannedBarcode(""); setNewBarcode("") }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${!scannerMode ? "bg-blue-100 text-blue-700" : "text-slate-400 hover:text-slate-600"}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Manual
                </button>
              </div>

              {/* Scan / Input Area */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                {scannerMode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Scanner Ready</span>
                    </div>
                    <input ref={barcodeInputRef} autoFocus placeholder="Focus here and scan barcode..." value={newBarcode}
                      onChange={handleScannerInput} onKeyDown={handleScannerKeyDown}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-blue-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-blue-50/30 transition-all text-sm font-mono text-center" />
                    <p className="text-[11px] text-slate-400 text-center">Point your barcode scanner here · Scanned value will appear below for confirmation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Enter Barcode Manually</label>
                    <div className="flex gap-2">
                      <input ref={barcodeInputRef} autoFocus placeholder="Type barcode..." value={newBarcode}
                        onChange={e => setNewBarcode(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addBarcode() } }}
                        className={`${inputCls} flex-1 font-mono`} />
                      <button onClick={addBarcode} disabled={!newBarcode.trim()}
                        className="px-4 py-2.5 text-xs font-semibold text-white rounded-xl shrink-0 transition-all disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>Preview</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanned Barcode Preview */}
              {scannedBarcode && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Scanned Barcode</span>
                  </div>
                  <div className="bg-white rounded-lg px-4 py-3 border border-blue-100 text-center">
                    <p className="text-lg font-mono font-bold text-slate-900 tracking-wider">{scannedBarcode}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setScannedBarcode(""); setTimeout(() => barcodeInputRef.current?.focus(), 50) }}
                      className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all bg-white">Discard</button>
                    <button onClick={confirmBarcode} disabled={barcodeAdding}
                      className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                      {barcodeAdding ? "Adding…" : "Confirm & Add"}
                    </button>
                  </div>
                </div>
              )}

              {/* Existing barcodes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Existing Barcodes ({(barcodeProduct.barcodes || []).length})</label>
                {(!barcodeProduct.barcodes || barcodeProduct.barcodes.length === 0) ? (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <svg className="w-8 h-8 mx-auto text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    <p className="text-xs text-slate-400">No barcodes yet — scan one above</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {barcodeProduct.barcodes.map((b: any, i: number) => (
                      <div key={b._id || i} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100 group hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" /></svg>
                          <span className="text-sm font-mono text-slate-700">{b.code || b}</span>
                        </div>
                        <button onClick={() => removeBarcode(b._id || b)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100" title="Remove">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <button onClick={closeBarcodeUpdate} className="w-full py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Overlay */}
      {barcodeMode && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setBarcodeMode(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-bold text-slate-900">Scan Barcode</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter or scan a barcode</p>
            </div>
            <div className="p-6 space-y-4">
              <input autoFocus className={inputCls} placeholder="Barcode…" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleBarcodeSubmit() }} />
              <button onClick={handleBarcodeSubmit} className="w-full py-2.5 text-sm font-semibold text-white rounded-xl"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">{editId ? "Edit Product" : "New Product"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editId ? "Update product details" : "Add a new product to inventory"}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {apiError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{apiError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Product Name *</label>
                  <input className={`${inputCls} ${errors.name ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="e.g. Royal Stag" value={form.name} onChange={e => setField("name", e.target.value)} />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Brand *</label>
                  <input className={`${inputCls} ${errors.brand ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="e.g. Pernod Ricard" value={form.brand} onChange={e => setField("brand", e.target.value)} />
                  {errors.brand && <p className={errCls}>{errors.brand}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
                  <input className={`${inputCls} ${errors.category ? "!border-red-400 ring-1 ring-red-200" : ""}`} placeholder="e.g. IMFL" value={form.category} onChange={e => setField("category", e.target.value)} />
                  {errors.category && <p className={errCls}>{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Selling Price *</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.pricePerUnit ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.pricePerUnit} onChange={e => setField("pricePerUnit", Number(e.target.value))} />
                  {errors.pricePerUnit && <p className={errCls}>{errors.pricePerUnit}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Volume (ML) *</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.volumeML ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.volumeML} onChange={e => setField("volumeML", Number(e.target.value))} />
                  {errors.volumeML && <p className={errCls}>{errors.volumeML}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Current Stock</label>
                  <input type="number" min={0} className={`${inputCls} ${errors.currentStock ? "!border-red-400 ring-1 ring-red-200" : ""}`} value={form.currentStock} onChange={e => setField("currentStock", Number(e.target.value))} />
                  {errors.currentStock && <p className={errCls}>{errors.currentStock}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Bottles per Caret</label>
                  <input type="number" min={0} className={inputCls} value={form.bottlesPerCaret} onChange={e => setField("bottlesPerCaret", Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Purchase Price / Caret</label>
                  <input type="number" min={0} className={inputCls} value={form.purchasePricePerCaret} onChange={e => setField("purchasePricePerCaret", Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Reorder Level</label>
                  <input type="number" min={0} className={inputCls} value={form.reorderLevel} onChange={e => setField("reorderLevel", Number(e.target.value))} />
                </div>
                {/* Image Upload */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Product Image</label>
                  <ImageUploader value={form.imageUrl} onChange={v => setField("imageUrl", v)} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:border-slate-400 transition-all">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                {editId ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Catalog</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your inventory catalog</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportProducts} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Bulk Upload
              <input type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleCSVUpload(e.target.files[0]); e.target.value = "" }} />
            </label>
            <button onClick={() => setBarcodeMode(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-xl hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              Barcode
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
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
                  {["", "Product", "Brand", "Category", "Price", "Volume", "Stock", ""].map((h, i) => (
                    <th key={i} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => {
                  const imgSrc = p.imageUrl || p.imageBase64 || ""
                  return (
                    <tr key={p._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3 w-12">
                        {imgSrc ? (
                          <img src={imgSrc} alt="" className="w-9 h-9 object-cover rounded-lg border border-slate-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{p.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.brand}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.category}</td>
                      <td className="px-5 py-4 text-sm font-mono text-slate-700">₹{p.pricePerUnit}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{p.volumeML}ml</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${p.currentStock > (p.reorderLevel || 10) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.currentStock > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                          {p.currentStock}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openImageUpdate(p)} className="px-3 py-1.5 text-xs font-medium text-violet-600 border border-violet-100 rounded-lg hover:bg-violet-50 transition-all" title="Update image">
                            <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Image
                          </button>
                          <button onClick={() => openBarcodeUpdate(p)} className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-100 rounded-lg hover:bg-amber-50 transition-all" title="Manage barcodes">
                            <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
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
