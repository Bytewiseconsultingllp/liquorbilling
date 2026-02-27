"use client"

import { useState } from "react"

export default function ApproveButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "approved" | "rejected">("idle")

  const handleAction = async (action: "approve" | "reject") => {
    if (action === "reject") {
      const reason = prompt("Reason for rejection (optional):")
      if (reason === null) return // cancelled
      setLoading(true)
      await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "reject", rejectionReason: reason }),
      })
      setStatus("rejected")
    } else {
      setLoading(true)
      await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approve" }),
      })
      setStatus("approved")
    }
    setLoading(false)
  }

  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-100">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Approved
      </span>
    )
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-100">
        ✕ Rejected
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Reject
      </button>
      <button
        onClick={() => handleAction("approve")}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Processing…" : "Approve"}
      </button>
    </div>
  )
}
