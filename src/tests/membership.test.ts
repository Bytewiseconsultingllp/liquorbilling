import { requireMembership } from "@/core/membership/requireMembership"
import { Membership } from "@/models/Membership"

describe("Membership Guard", () => {
  it("throws if user not member", async () => {
    await expect(
      requireMembership("user1", "tenant1")
    ).rejects.toThrow("Unauthorized")
  })

  it("allows valid member", async () => {
    await Membership.create({
      userId: "user1",
      tenantId: "tenant1",
      role: "member",
    })

    const result = await requireMembership("user1", "tenant1")
    expect(result.role).toBe("member")
  })

  it("prevents duplicate membership", async () => {
    await Membership.create({
      userId: "u1",
      tenantId: "t1",
    })

    await expect(
      Membership.create({ userId: "u1", tenantId: "t1" })
    ).rejects.toThrow()
  })
})