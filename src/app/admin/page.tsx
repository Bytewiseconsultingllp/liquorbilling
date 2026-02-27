import { connectDB } from "@/db/connection"
import { TenantRequest } from "@/models/TenantRequest"
import ApproveButton from "../../components/ApproveButton"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  await connectDB()
  const requests = await TenantRequest.find({ status: "pending" }).sort({ createdAt: -1 })

  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
            Pending review
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Workspace Requests</h1>
          <p className="text-slate-500 text-sm mt-1">{requests.length} request{requests.length !== 1 ? "s" : ""} awaiting approval</p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-blue-100 p-16 text-center shadow-sm">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-slate-500">All caught up! No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r: any) => (
              <div key={r._id} className="bg-white rounded-2xl border border-blue-100 p-5 hover:border-blue-300 transition-all shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg">{r.companyName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-blue-500 font-mono">/{r.requestedSlug}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-sm text-slate-500">{r.requestedByEmail}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {r.phone && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          📞 {r.phone}
                        </span>
                      )}
                      {r.address && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          📍 {r.address}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      Submitted {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <ApproveButton requestId={r._id.toString()} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
