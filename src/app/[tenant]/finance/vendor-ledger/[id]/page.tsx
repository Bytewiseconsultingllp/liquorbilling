"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Entry { _id: string; referenceType: string; description: string; debit: number; credit: number; balanceAfter: number; createdAt: string }
const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

export default function VendorLedgerPage() {
  const { id } = useParams()
  const [entries, setEntries] = useState<Entry[]>([])
  const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("")

  const fetchLedger = async () => {
    const res = await fetch(`/api/tenant/finance/ledger/vendor/${id}?startDate=${startDate}&endDate=${endDate}`)
    const data = await res.json(); setEntries(data)
  }
  useEffect(() => { fetchLedger() }, [])

  const totalDebit = entries.reduce((a, b) => a + b.debit, 0)
  const totalCredit = entries.reduce((a, b) => a + b.credit, 0)

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Finance</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Vendor Ledger</h1>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
            <button onClick={fetchLedger} className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>Filter</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Date", "Reference", "Description", "Debit", "Credit", "Balance"].map(h => (
                  <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 ${["Debit","Credit","Balance"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-3.5 text-slate-500">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5"><span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">{e.referenceType}</span></td>
                  <td className="px-6 py-3.5 text-slate-600">{e.description}</td>
                  <td className="px-6 py-3.5 text-right font-medium text-red-500">₹ {e.debit}</td>
                  <td className="px-6 py-3.5 text-right font-medium text-emerald-600">₹ {e.credit}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-slate-900">₹ {e.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
            <span className="text-sm text-red-600">Total Debit</span>
            <span className="font-bold text-red-700">₹ {totalDebit}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
            <span className="text-sm text-emerald-600">Total Credit</span>
            <span className="font-bold text-emerald-700">₹ {totalCredit}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
