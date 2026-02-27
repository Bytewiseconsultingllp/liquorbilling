"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-slate-400">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-slate-400">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    // First check if this email has a pending request (no user account yet)
    const checkRes = await fetch("/api/auth/check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const checkData = await checkRes.json();
    if (checkData.status === "pending") {
      setError("Your workspace request is still pending approval. An admin will review it shortly.");
      setLoading(false);
      return;
    }
    if (checkData.status === "rejected") {
      setError(`Your workspace request was rejected.${checkData.reason ? " Reason: " + checkData.reason : ""} Please contact support or submit a new request.`);
      setLoading(false);
      return;
    }
    if (checkData.status === "no_account") {
      setError("No account found with this email. Please register first.");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) { setError("Invalid email or password"); setLoading(false); return; }
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    console.log("Session after login:", session);
    if (session.user.isPlatformAdmin) router.push("/admin");
    else if (session.user.tenantSlug) router.push(`/${session.user.tenantSlug}/dashboard`);
    else { setError("Your workspace is not yet set up. Please contact support."); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-14" style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #0EA5E9 100%)" }}>
        <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-white text-2xl font-bold">Tenantify</span>
        <div>
          <div className="w-12 h-1 rounded-full bg-sky-300 mb-8 opacity-80"></div>
          <blockquote style={{ fontFamily: "'Playfair Display', serif" }} className="text-white/90 text-3xl leading-snug mb-6">
            "The simplest way to manage your team's workspace."
          </blockquote>
          <p className="text-sky-200 text-sm">— Built for modern teams</p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 rounded-full" style={{ width: i === 0 ? 32 : 16, background: i === 0 ? "#38BDF8" : "rgba(255,255,255,0.25)" }} />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl font-bold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500">Sign in to your workspace</p>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 p-8 shadow-sm shadow-blue-100/50">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input type="email"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:opacity-70 transition-opacity">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>
              <button onClick={handleLogin} disabled={loading}
                className="w-full py-3 px-4 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60"
                style={{ background: loading ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #0EA5E9)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-800">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
