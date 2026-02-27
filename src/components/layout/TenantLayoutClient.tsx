"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { signOut } from "next-auth/react"

interface NavItem {
  href: string
  label: string
  icon: string
  children?: { href: string; label: string }[]
}

const navLinks: NavItem[] = [
  { href: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "management", label: "Management", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    children: [
      { href: "users", label: "Users" },
      { href: "customers", label: "Customers" },
      { href: "vendors", label: "Vendors" },
      { href: "products", label: "Products" },
    ]
  },
  { href: "inventory", label: "Inventory", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
  { href: "sales", label: "Sales", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    children: [{ href: "sales", label: "New Sale" }, { href: "sales/manage", label: "Manage Sales" }]
  },
  { href: "purchases", label: "Purchases", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    children: [{ href: "purchases", label: "New Purchase" }, { href: "purchases/manage", label: "Manage Purchases" }]
  },
  { href: "finance", label: "Finance", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    children: [
      { href: "finance/cashbook", label: "Cashbook" },
      { href: "finance/credit", label: "Credit" },
      { href: "finance/customer-ledger", label: "Customer Ledger" },
      { href: "finance/vendor-ledger", label: "Vendor Ledger" },
    ]
  },
  { href: "reports", label: "Reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
]

const roleBadgeColor: Record<string, string> = {
  owner: "bg-amber-50 text-amber-700 border-amber-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  member: "bg-stone-50 text-stone-600 border-stone-200",
}

export default function TenantLayoutClient({
  tenantName,
  role,
  children,
}: {
  tenantName: string
  role: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const tenantSlug = pathname.split("/")[1]
  const [collapsed, setCollapsed] = useState(true)

  // Track which parent nav items are expanded (by href key)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const link of navLinks) {
      if (link.children) {
        // For "management" group, check if any child route is active
        if (link.href === "management") {
          initial[link.href] = link.children.some(c => {
            const childHref = `/${pathname.split("/")[1]}/${c.href}`
            return pathname === childHref || pathname.startsWith(childHref + "/")
          })
        } else {
          const href = `/${pathname.split("/")[1]}/${link.href}`
          initial[link.href] = pathname === href || pathname.startsWith(href + "/")
        }
      }
    }
    return initial
  })

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))

  const isChildActive = (link: NavItem) => {
    if (!link.children) return false
    return link.children.some(c => {
      const childHref = `/${tenantSlug}/${c.href}`
      return pathname === childHref || pathname.startsWith(childHref + "/")
    })
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white border-r border-stone-100 shadow-sm shrink-0 transition-all duration-200 ${collapsed ? "w-[52px]" : "w-56"} fixed top-0 left-0 h-screen z-30 overflow-y-auto overflow-x-hidden`}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 py-5 border-b border-stone-100 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{tenantName.charAt(0).toUpperCase()}</span>
          </div>
          {!collapsed && <span className="text-sm font-semibold text-stone-900 truncate whitespace-nowrap">{tenantName}</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-1.5 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navLinks.map((link) => {
            const hasChildren = link.children && link.children.length > 0
            // For "management" parent there's no direct href — activity is based on children
            const isParentActive = hasChildren ? isChildActive(link) : (() => { const href = `/${tenantSlug}/${link.href}`; return pathname === href || pathname.startsWith(href + "/") })()
            const expanded = !!expandedSections[link.href]

            if (hasChildren) {
              return (
                <div key={link.href}>
                  <button
                    onClick={() => { if (!collapsed) toggleSection(link.href) }}
                    title={collapsed ? link.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group w-full ${
                      isParentActive ? "bg-stone-100 text-stone-900" : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      className={`shrink-0 ${isParentActive ? "stroke-stone-700" : "stroke-stone-400 group-hover:stroke-stone-700"}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={link.icon} />
                    </svg>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left whitespace-nowrap">{link.label}</span>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          className={`shrink-0 stroke-stone-400 transition-transform ${expanded ? "rotate-90" : ""}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                  {!collapsed && expanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-stone-100 pl-3">
                      {link.children!.map((child) => {
                        const childHref = `/${tenantSlug}/${child.href}`
                        const childActive = pathname === childHref
                        return (
                          <Link
                            key={child.href}
                            href={childHref}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                              childActive ? "bg-stone-900 text-white" : "text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                            }`}
                          >
                            <span className={`w-1 h-1 rounded-full ${childActive ? "bg-white" : "bg-stone-300"}`} />
                            <span>{child.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const href = `/${tenantSlug}/${link.href}`
            return (
              <Link
                key={link.href}
                href={href}
                title={collapsed ? link.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isParentActive ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  className={`shrink-0 ${isParentActive ? "stroke-white" : "stroke-stone-400 group-hover:stroke-stone-700"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={link.icon} />
                </svg>
                {!collapsed && <span className="whitespace-nowrap">{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Role + Logout */}
        <div className={`px-3 py-4 border-t border-stone-100 ${collapsed ? "flex flex-col items-center gap-2" : "space-y-3"}`}>
          {collapsed ? (
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${roleBadgeColor[role] || roleBadgeColor.member}`}>
              {role.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleBadgeColor[role] || roleBadgeColor.member}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
              {role}
            </span>
          )}
          <button
            onClick={async () => {
              // Clear all application data
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
            title="Logout"
            className={`flex items-center gap-2 rounded-xl text-sm font-medium transition-all group text-red-500 hover:bg-red-50 hover:text-red-700 ${
              collapsed ? "p-2" : "w-full px-3 py-2"
            }`}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="shrink-0 stroke-red-400 group-hover:stroke-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 min-w-0 overflow-auto transition-all duration-200 ${collapsed ? "ml-[52px]" : "ml-56"}`}>
        {children}
      </main>
    </div>
  )
}
