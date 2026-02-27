"use client"

import { useEffect, useState } from "react"

interface CashbookEntry {
  _id: string; sourceType: string; description: string;
  cashIn: number; cashOut: number; onlineIn: number; onlineOut: number; createdAt: string
}

const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

export default function DailyCashbookPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [entries, setEntries] = useState<CashbookEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCashbook = async () => {
    setLoading(true)
    const res = await fetch(`/api/tenant/finance/cashbook?date=${date}`)
    const data = await res.json()
    setEntries(data); setLoading(false)
  }
  useEffect(() => { fetchCashbook() }, [])

  const totalCashIn = entries.reduce((a, b) => a + (b.cashIn || 0), 0)
  const totalCashOut = entries.reduce((a, b) => a + (b.cashOut || 0), 0)
  const totalOnlineIn = entries.reduce((a, b) => a + (b.onlineIn || 0), 0)
  const totalOnlineOut = entries.reduce((a, b) => a + (b.onlineOut || 0), 0)
  const netCash = totalCashIn - totalCashOut; const netOnline = totalOnlineIn - totalOnlineOut

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Finance</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Daily Cashbook</h1>
            <p className="text-slate-500 text-sm mt-1">Track daily cash and online movements</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
            <button onClick={fetchCashbook} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              Load
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          {[
            { title: "Cash Flow", in: totalCashIn, out: totalCashOut, net: netCash, color: "#EEF2FF", border: "#C7D2FE" },
            { title: "Online Flow", in: totalOnlineIn, out: totalOnlineOut, net: netOnline, color: "#F0F9FF", border: "#BAE6FD" },
          ].map(s => (
            <div key={s.title} className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: s.border }}>
              <h3 className="font-semibold text-slate-700 mb-4">{s.title}</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center p-3 rounded-xl" style={{ background: s.color }}>
                  <p className="text-xs text-slate-500 mb-1">In</p>
                  <p className="font-semibold text-emerald-600">₹{s.in}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50">
                  <p className="text-xs text-slate-500 mb-1">Out</p>
                  <p className="font-semibold text-red-500">₹{s.out}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <p className="text-xs text-slate-500 mb-1">Net</p>
                  <p className={`font-semibold ${s.net >= 0 ? "text-emerald-600" : "text-red-500"}`}>₹{s.net}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Time", "Source", "Description", "Cash In", "Cash Out", "Online In", "Online Out"].map(h => (
                  <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-4 ${h.includes("In") || h.includes("Out") ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500">{new Date(entry.createdAt).toLocaleTimeString()}</td>
                  <td className="px-5 py-3.5 capitalize font-medium text-slate-700">{entry.sourceType}</td>
                  <td className="px-5 py-3.5 text-slate-600">{entry.description}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{entry.cashIn ? `₹${entry.cashIn}` : "—"}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-red-500">{entry.cashOut ? `₹${entry.cashOut}` : "—"}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-emerald-600">{entry.onlineIn ? `₹${entry.onlineIn}` : "—"}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-red-500">{entry.onlineOut ? `₹${entry.onlineOut}` : "—"}</td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr><td colSpan={7} className="text-center p-10 text-slate-400">No entries found for this date</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm flex items-center justify-between">
          <span className="text-sm text-slate-500">Total movement</span>
          <span className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>₹ {netCash + netOnline}</span>
        </div>
      </div>
    </div>
  )
}
