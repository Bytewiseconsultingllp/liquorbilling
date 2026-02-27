import { TenantRequest } from "@/models/TenantRequest"
import { Tenant } from "@/models/Tenant"
import { Membership } from "@/models/Membership"
import { User } from "@/models/User"

export async function approveTenantRequest(
  requestId: string,
  adminId: string
) {
  const request = await TenantRequest.findById(requestId)

  if (!request) throw new Error("Request not found")

  const tenant = await Tenant.create({
    name: request.companyName,
    slug: request.requestedSlug,
    status: "active",
  })

  const user = await User.findOne({
    email: request.requestedByEmail,
  })

  const membership = await Membership.create({
    userId: user!._id,
    tenantId: tenant._id,
    role: "owner",
  })

  request.status = "approved"
  request.reviewedBy = adminId
  request.reviewedAt = new Date()
  await request.save()

  return { tenant, membership }
}