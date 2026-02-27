"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const adminLinks = [
  { href: "/admin", label: "Requests", exact: true, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/admin/tenants", label: "Tenants", exact: false, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/admin/products", label: "All Products", exact: false, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex">
      {/* Sidebar */}
      <aside className="flex flex-col bg-white border-r border-stone-100 shadow-sm w-56 shrink-0" style={{ minHeight: "100vh" }}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-stone-100">
          <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center shrink-0">
            <svg width="13" height="13" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">Tenantify</p>
            <p className="text-xs text-stone-400 -mt-0.5">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {adminLinks.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  className={`shrink-0 ${isActive ? "stroke-white" : "stroke-stone-400 group-hover:stroke-stone-700"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-stone-100 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Super Admin
          </span>
          <button
            onClick={async () => {
              document.cookie.split(";").forEach((c) => {
                const name = c.split("=")[0].trim()
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
              })
              if (typeof window !== "undefined" && "caches" in window) {
                const keys = await caches.keys()
                await Promise.all(keys.map((k) => caches.delete(k)))
              }
              try { localStorage.clear() } catch {}
              try { sessionStorage.clear() } catch {}
              await signOut({ callbackUrl: "/login" })
            }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all group text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="shrink-0 stroke-red-400 group-hover:stroke-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
