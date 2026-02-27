import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 50%, #F8FAFF 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .btn-primary { background: linear-gradient(135deg, #2563EB, #0EA5E9); transition: all 0.2s; box-shadow: 0 4px 20px rgba(37,99,235,0.25); }
        .btn-primary:hover { box-shadow: 0 6px 28px rgba(37,99,235,0.35); transform: translateY(-1px); }
        .card-hover { transition: all 0.2s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(37,99,235,0.12); }
      `}</style>

      <nav className="flex items-center justify-between px-10 py-5 bg-white/70 backdrop-blur-md border-b border-blue-100/80 sticky top-0 z-40">
        <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl font-bold text-blue-700 tracking-tight">Liquor Billing</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 border border-slate-200 rounded-full hover:border-blue-300 transition-all bg-white">Sign in</Link>
          <Link href="/register" className="btn-primary px-5 py-2 text-sm font-semibold text-white rounded-full">Get started</Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center flex-1 px-10 py-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-semibold text-blue-700 rounded-full bg-blue-50 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
          Multi-tenant SaaS platform
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-6xl font-bold leading-tight text-slate-900 max-w-3xl mb-6">
          Run your business,<br />
          <span style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>beautifully organized.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mb-10 leading-relaxed font-light">
          Liquor Billing gives your team a dedicated workspace with user management, role-based access, and powerful admin tools — all in one place.
        </p>
        <div className="flex gap-4">
          <Link href="/register" className="btn-primary px-8 py-3.5 text-base font-semibold text-white rounded-full">Create your workspace →</Link>
          <Link href="/request" className="px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-700 transition-all">Request access</Link>
        </div>
      </section>

      <section className="px-10 py-20 border-t border-blue-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">Features</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-center text-slate-900 mb-12">Everything your team needs</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: "🏢", title: "Multi-tenant", desc: "Each organization gets their own isolated workspace and subdomain.", color: "#EEF2FF" },
              { icon: "🔐", title: "Role-based access", desc: "Owners, admins, and members — each with the right level of access.", color: "#F0F9FF" },
              { icon: "⚡", title: "Instant setup", desc: "Workspaces are provisioned instantly after admin approval.", color: "#EDE9FE" },
            ].map((f) => (
              <div key={f.title} className="card-hover p-7 rounded-2xl border border-blue-100" style={{ background: f.color }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-10 py-6 border-t border-blue-100 text-center text-sm text-slate-400 bg-white">
        © {new Date().getFullYear()} Liquor Billing. Built with care.
      </footer>
    </main>
  )
}
