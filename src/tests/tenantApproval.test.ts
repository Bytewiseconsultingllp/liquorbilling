import { approveTenantRequest } from "@/core/admin/approveTenantRequest"
import { TenantRequest } from "@/models/TenantRequest"
import { User } from "@/models/User"
import { Membership } from "@/models/Membership"
import { Tenant } from "@/models/Tenant"

describe("Tenant Approval Flow", () => {
  it("approves request and creates tenant + owner membership", async () => {
    const user = await User.create({
      email: "owner@test.com",
      passwordHash: "hashed",
    })

    const request = await TenantRequest.create({
      companyName: "Acme",
      requestedSlug: "acme",
      requestedByEmail: user.email,
    })

    const result = await approveTenantRequest(
      request._id.toString(),
      user._id.toString()
    )

    expect(result.tenant.status).toBe("active")

    const membership = await Membership.findOne({
      tenantId: result.tenant._id,
      userId: user._id,
    })

    expect(membership?.role).toBe("owner")
  })

  it("fails if request not found", async () => {
    await expect(
      approveTenantRequest("invalidId", "adminId")
    ).rejects.toThrow("Request not found")
  })
})