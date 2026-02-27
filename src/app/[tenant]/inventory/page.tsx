"use client";

import { useEffect, useState, useMemo } from "react";

interface MovementItem {
  productId: string;
  productName: string;
  currentStock: number;
  morningStock: number;
  pricePerUnit: number;
  purchases: number;
  sales: number;
}

interface Closing {
  _id: string;
  closingDate: string;
  totalDifferenceValue: number;
  cashAmount: number;
  onlineAmount: number;
  saleId?: { saleNumber: string };
  items: any[];
}

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`;

export default function InventoryPage() {
  const [tab, setTab] = useState<"overview" | "closing" | "history">("overview");
  const [closingStocks, setClosingStocks] = useState<Record<string, number>>({});
  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [movementData, setMovementData] = useState<MovementItem[]>([]);
  const [movementLoaded, setMovementLoaded] = useState(false);
  const [loadingMovement, setLoadingMovement] = useState(false);

  // History state
  const [closings, setClosings] = useState<Closing[]>([]);
  const [selectedClosing, setSelectedClosing] = useState<Closing | null>(null);

  // On mount: fetch products to get morningStockLastUpdatedDate, set defaults
  useEffect(() => {
    fetch("/api/tenant/products?limit=0")
      .then(r => r.json())
      .then(d => {
        const products = d.data || [];
        const dates = products
          .map((p: any) => p.morningStockLastUpdatedDate)
          .filter(Boolean)
          .map((dt: string) => new Date(dt).getTime());
        if (dates.length > 0) {
          const maxTs = Math.max(...dates);
          const d = new Date(maxTs);
          setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
        }
        const today = new Date();
        setEndDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
      });
  }, []);

  // Auto-load movement when dates are first set
  useEffect(() => {
    if (startDate && endDate && !movementLoaded) {
      loadMovement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const loadMovement = async () => {
    if (!startDate || !endDate) return;
    setLoadingMovement(true);
    try {
      const res = await fetch("/api/tenant/inventory/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      const data = await res.json();
      setMovementData(data);
      setMovementLoaded(true);
      // Pre-fill closing stocks with current stock
      const prefill: Record<string, number> = {};
      for (const item of data) prefill[item.productId] = item.currentStock;
      setClosingStocks(prefill);
    } finally {
      setLoadingMovement(false);
    }
  };

  const loadHistory = () => {
    fetch("/api/tenant/inventory/history")
      .then(r => r.json())
      .then(d => setClosings(d));
  };

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  // Discrepancy formula:
  // If morningStock = 0: closingStock - (purchases - sales)
  // If morningStock ≠ 0: closingStock - (morningStock + purchases - sales)
  const getDiscrepancy = (item: MovementItem, closingStock?: number) => {
    const stock = closingStock ?? item.currentStock;
    if (item.morningStock === 0) {
      return stock - (item.purchases - item.sales);
    }
    return stock - (item.morningStock + item.purchases - item.sales);
  };

  const getDiscrepancyValue = (item: MovementItem, closingStock?: number) => {
    return getDiscrepancy(item, closingStock) * item.pricePerUnit;
  };

  const stockDifferenceValue = useMemo(() => {
    return movementData.reduce((acc, p) => {
      const closing = closingStocks[p.productId];
      if (closing === undefined) return acc;
      const diff = p.currentStock - closing;
      return diff > 0 ? acc + diff * p.pricePerUnit : acc;
    }, 0);
  }, [movementData, closingStocks]);

  useEffect(() => {
    setCashAmount(stockDifferenceValue);
    setOnlineAmount(0);
  }, [stockDifferenceValue]);

  const submitClosing = async () => {
    const closingData = movementData
      .filter(p => closingStocks[p.productId] !== undefined)
      .map(p => {
        const closingStock = closingStocks[p.productId];
        return {
          productId: p.productId,
          closingStock,
          morningStock: p.morningStock,
          purchases: p.purchases,
          sales: p.sales,
          discrepancy: getDiscrepancy(p, closingStock),
          discrepancyValue: getDiscrepancyValue(p, closingStock),
        };
      });

    if (closingData.length === 0) return alert("Enter closing stock for at least one product");

    const res = await fetch("/api/tenant/inventory/closing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closingData, cashAmount, onlineAmount }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    alert("Closing Stock Updated");
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Stock</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor stock levels, submit closing counts, and view history</p>
        </div>

        {/* Date filter */}
        <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-5 shadow-sm flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Start</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">End</span>
            <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={loadMovement} disabled={loadingMovement}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl flex items-center gap-2 ${loadingMovement ? 'opacity-70 cursor-not-allowed' : ''}`}
            style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
            {loadingMovement && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {loadingMovement ? 'Loading…' : 'Load Movement'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["overview", "closing", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all capitalize ${tab === t ? "text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"}`}
              style={tab === t ? { background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" } : {}}>
              {t === "overview" ? "Stock Overview" : t === "closing" ? "Closing Stock" : "History"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
            {loadingMovement ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <svg className="w-8 h-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p className="text-sm text-slate-400">Loading movement data…</p>
              </div>
            ) : movementData.length === 0 ? (
              <div className="py-16 text-center text-slate-400">Load movement data to see stock overview</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      {["Product", "Morning Stock", "Purchases", "Sales", "Current Stock", "Discrepancy", "Disc. Value"].map(h => (
                        <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "Product" ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movementData.map(p => {
                      const disc = getDiscrepancy(p);
                      const discVal = getDiscrepancyValue(p);
                      return (
                        <tr key={p.productId} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-900">{p.productName}</td>
                          <td className="px-5 py-4 text-right text-slate-600">{p.morningStock}</td>
                          <td className="px-5 py-4 text-right text-emerald-600 font-medium">{p.purchases}</td>
                          <td className="px-5 py-4 text-right text-red-500 font-medium">{p.sales}</td>
                          <td className="px-5 py-4 text-right">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${p.currentStock > 10 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.currentStock > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                              {p.currentStock}
                            </span>
                          </td>
                          <td className={`px-5 py-4 text-right font-semibold ${disc < 0 ? "text-red-500" : disc > 0 ? "text-emerald-600" : "text-slate-400"}`}>{disc}</td>
                          <td className={`px-5 py-4 text-right font-mono font-medium ${discVal < 0 ? "text-red-500" : discVal > 0 ? "text-emerald-600" : "text-slate-400"}`}>₹{discVal.toLocaleString("en-IN")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CLOSING TAB */}
        {tab === "closing" && (
          <>
            <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Stock Diff Value</p>
                  <p className="font-bold text-slate-900">₹ {stockDifferenceValue.toLocaleString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Cash:</label>
                  <input type="number" value={cashAmount} onChange={e => { const v = Number(e.target.value); setCashAmount(v); setOnlineAmount(stockDifferenceValue - v) }}
                    className="w-28 px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Online:</label>
                  <input type="number" value={onlineAmount} onChange={e => { const v = Number(e.target.value); setOnlineAmount(v); setCashAmount(stockDifferenceValue - v) }}
                    className="w-28 px-3 py-1.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button onClick={submitClosing} className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
                Submit Closing
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
              {loadingMovement ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <svg className="w-8 h-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  <p className="text-sm text-slate-400">Loading movement data…</p>
                </div>
              ) : movementData.length === 0 ? (
                <div className="py-16 text-center text-slate-400">Load movement data first</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {["Product", "Morning Stock", "Purchases", "Sales", "Current Stock", "Closing Stock", "Discrepancy","Total Sale", "Disc. Value"].map(h => (
                          <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h === "Product" ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {movementData.map(p => {
                        const closing = closingStocks[p.productId];
                        const hasClosing = closing !== undefined;
                        const disc = hasClosing ? getDiscrepancy(p, closing) : null;
                        const discVal = hasClosing ? getDiscrepancyValue(p, closing) : null;
                        return (
                          <tr key={p.productId} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                            <td className="px-5 py-4 font-semibold text-slate-900">{p.productName}</td>
                            <td className="px-5 py-4 text-right text-slate-600">{p.morningStock}</td>
                            <td className="px-5 py-4 text-right text-emerald-600 font-medium">{p.purchases}</td>
                            <td className="px-5 py-4 text-right text-red-500 font-medium">{p.sales}</td>
                            <td className="px-5 py-4 text-right text-slate-600">{p.currentStock}</td>
                            <td className="px-5 py-4 text-right">
                              <input type="number" min={0}
                                value={closingStocks[p.productId] ?? ""}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === "") {
                                    const next = { ...closingStocks };
                                    delete next[p.productId];
                                    setClosingStocks(next);
                                  } else {
                                    setClosingStocks({ ...closingStocks, [p.productId]: Number(val) });
                                  }
                                }}
                                className="w-24 px-3 py-1.5 text-sm text-right rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </td>
                            <td className={`px-5 py-4 text-right font-semibold ${disc === null ? "text-slate-300" : disc < 0 ? "text-red-500" : disc > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                              {disc !== null ? disc : "—"}
                            </td>
                            <td className="px-5 py-4 text-right text-red-500 font-medium">{p.sales - (disc !== null ? disc : 0)}</td>
                            <td className={`px-5 py-4 text-right font-mono font-medium ${discVal === null ? "text-slate-300" : discVal < 0 ? "text-red-500" : discVal > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                              {discVal !== null ? `₹${discVal.toLocaleString("en-IN")}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <>
            {selectedClosing && (
              <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelectedClosing(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">Closing Details</h2>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(selectedClosing.closingDate).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => setSelectedClosing(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            {["Product", "Morning Stock", "Purchases", "Sales", "System Stock", "Closing Stock", "Difference", "Discrepancy", "Disc. Value"].map(h => (
                              <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3 ${h === "Product" ? "text-left" : "text-right"}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClosing.items.map((item: any, index: number) => (
                            <tr key={index} className="border-t border-slate-50 hover:bg-blue-50/20">
                              <td className="px-5 py-3 font-medium text-slate-900">{item.productName}</td>
                              <td className="px-5 py-3 text-right text-slate-600">{item.morningStock ?? "—"}</td>
                              <td className="px-5 py-3 text-right text-emerald-600">{item.purchases ?? "—"}</td>
                              <td className="px-5 py-3 text-right text-red-500">{item.sales ?? "—"}</td>
                              <td className="px-5 py-3 text-right text-slate-600">{item.systemStock}</td>
                              <td className="px-5 py-3 text-right text-slate-600">{item.closingStock ?? item.physicalStock}</td>
                              <td className="px-5 py-3 text-right font-semibold text-red-500">{item.difference}</td>
                              <td className={`px-5 py-3 text-right font-semibold ${(item.discrepancy ?? 0) < 0 ? "text-red-500" : (item.discrepancy ?? 0) > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                                {item.discrepancy ?? "—"}
                              </td>
                              <td className={`px-5 py-3 text-right font-mono font-medium ${(item.discrepancyValue ?? 0) < 0 ? "text-red-500" : (item.discrepancyValue ?? 0) > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                                {item.discrepancyValue !== undefined ? `₹${item.discrepancyValue.toLocaleString("en-IN")}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-slate-100">
                    <button onClick={() => setSelectedClosing(null)} className="w-full py-2.5 text-sm font-semibold text-white rounded-xl"
                      style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>Close</button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["Date", "Diff Value", "Cash", "Online", "Sale ID", ""].map(h => (
                      <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {closings.map(c => (
                    <tr key={c._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                      <td className="px-6 py-4 text-slate-600">{new Date(c.closingDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">₹ {c.totalDifferenceValue}</td>
                      <td className="px-6 py-4 font-medium text-emerald-600">₹ {c.cashAmount}</td>
                      <td className="px-6 py-4 font-medium text-blue-600">₹ {c.onlineAmount}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{c.saleId?.saleNumber || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelectedClosing(c)} className="px-4 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {closings.length === 0 && <div className="py-16 text-center text-slate-400">No closing history found</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
