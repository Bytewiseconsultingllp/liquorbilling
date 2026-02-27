"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Customer { _id: string; name: string; outstandingBalance?: number }
const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

export default function CustomerLedgerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch("/api/tenant/customers").then(r => r.json()).then(d => setCustomers(d.data))
  }, [])

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Finance</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Customer Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">View individual customer account statements</p>
        </div>
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Outstanding</th>
                <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 font-medium text-amber-600">₹ {c.outstandingBalance || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => router.push(`customer-ledger/${c._id}`)}
                      className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg"
                      style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>
                      View Ledger
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-slate-400">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
