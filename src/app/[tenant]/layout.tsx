import { connectDB } from "@/db/connection"
import { Tenant } from "@/models/Tenant"
import { User } from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import TenantLayoutClient from "@/components/layout/TenantLayoutClient"

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.isPlatformAdmin) redirect("/admin")

  await connectDB()

  const tenant = await Tenant.findOne({ slug: tenantSlug, status: { $ne: "deleted" } }).lean()
  if (!tenant) return <div className="p-10 text-stone-500">Tenant not found</div>
  if (tenant.status === "suspended") redirect("/suspended")

  const user = await User.findOne({ _id: session.user.id, status: { $ne: "deleted" } }).lean()
  if (!user || !user.tenantId) redirect("/dashboard")

  if (user.tenantId.toString() !== tenant._id.toString()) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">🚫</div>
          <p className="text-stone-700 font-medium">You do not belong to this workspace.</p>
        </div>
      </div>
    )
  }

  return (
    <TenantLayoutClient tenantName={tenant.name} role={user.role}>
      {children}
    </TenantLayoutClient>
  )
}
