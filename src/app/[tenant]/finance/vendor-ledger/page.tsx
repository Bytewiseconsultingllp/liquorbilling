"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Vendor { _id: string; name: string }
const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`

export default function VendorLedgerListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const router = useRouter()

  useEffect(() => {
    fetch("/api/tenant/vendors").then(r => r.json()).then(d => setVendors(d.data))
  }, [])

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Finance</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Vendor Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">View individual vendor account statements</p>
        </div>
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Vendor</th>
                <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v._id} className="border-t border-slate-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{v.name}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => router.push(`vendor-ledger/${v._id}`)}
                      className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg"
                      style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}>
                      View Ledger
                    </button>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan={2} className="p-10 text-center text-slate-400">No vendors found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
