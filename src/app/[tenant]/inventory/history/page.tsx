"use client"

import { useEffect, useState } from "react"

interface Closing { _id: string; closingDate: string; totalDifferenceValue: number; cashAmount: number; onlineAmount: number; saleId?: { saleNumber: string }; items: any[] }
const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
.overlay-bg { background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); }`

export default function ClosingHistoryPage() {
  const [closings, setClosings] = useState<Closing[]>([])
  const [selected, setSelected] = useState<Closing | null>(null)

  useEffect(() => {
    fetch("/api/tenant/inventory/history").then(r => r.json()).then(d => setClosings(d))
  }, [])

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {selected && (
        <div className="overlay-bg fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-slate-900">Closing Details</h2>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(selected.closingDate).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["Product", "System Stock", "Physical Stock", "Difference"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item, index) => (
                    <tr key={index} className="border-t border-slate-50 hover:bg-blue-50/20">
                      <td className="px-6 py-3 font-medium text-slate-900">{item.productName}</td>
                      <td className="px-6 py-3 text-slate-600">{item.systemStock}</td>
                      <td className="px-6 py-3 text-slate-600">{item.physicalStock}</td>
                      <td className="px-6 py-3 font-semibold text-red-500">{item.difference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <button onClick={() => setSelected(null)} className="w-full py-2.5 text-sm font-semibold text-white rounded-xl"
                style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Inventory</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Closing History</h1>
          <p className="text-slate-500 text-sm mt-1">Review past inventory closing records</p>
        </div>

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
                    <button onClick={() => setSelected(c)} className="px-4 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {closings.length === 0 && <div className="py-16 text-center text-slate-400">No closing history found</div>}
        </div>
      </div>
    </div>
  )
}
