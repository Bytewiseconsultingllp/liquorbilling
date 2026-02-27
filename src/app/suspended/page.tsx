import Link from "next/link"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #FFF1F2 0%, #FEF2F2 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl border border-red-200" style={{ background: "#FEE2E2" }}>🔒</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900 mb-3">Account suspended</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Your organization's workspace has been suspended. Please contact support to resolve this issue.
        </p>
        <a href="mailto:support@Liquor Billing.com"
          className="inline-flex items-center gap-2 px-7 py-3 text-white text-sm font-semibold rounded-full transition-all"
          style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)", boxShadow: "0 4px 20px rgba(220,38,38,0.3)" }}>
          Contact support
        </a>
        <div className="mt-5">
          <Link href="/" className="text-sm text-slate-400 hover:text-blue-600 transition-colors">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
