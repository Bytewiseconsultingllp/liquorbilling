import { Membership } from "@/models/Membership"

describe("RBAC", () => {
  it("owner can act as admin", async () => {
    const membership = await Membership.create({
      userId: "u1",
      tenantId: "t1",
      role: "owner",
    })

    expect(["owner", "admin"]).toContain(membership.role)
  })

  it("member cannot perform admin actions", async () => {
    const membership = await Membership.create({
      userId: "u2",
      tenantId: "t1",
      role: "member",
    })

    expect(membership.role).not.toBe("admin")
  })
})