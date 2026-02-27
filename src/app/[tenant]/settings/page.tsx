export default function SettingsPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Configuration</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your workspace preferences</p>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-1">Workspace</h2>
            <p className="text-xs text-slate-400 mb-5">Update your organization's details</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Workspace name</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm" defaultValue="" placeholder="Your company name" />
            </div>
            <button className="mt-5 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all" style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              Save changes
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
            <h2 className="font-semibold text-red-600 mb-1">Danger zone</h2>
            <p className="text-xs text-slate-400 mb-5">These actions are irreversible. Please proceed with caution.</p>
            <button className="px-5 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all">
              Delete workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
