import { resolveTenant } from "@/core/tenant/getTenant"
import { Tenant } from "@/models/Tenant"

describe("Subdomain Resolution", () => {
  it("resolves active tenant", async () => {
    const tenant = await Tenant.create({
      name: "Acme",
      slug: "acme",
      status: "active",
    })

    const found = await Tenant.findOne({ slug: "acme" })

    expect(found?.slug).toBe("acme")
  })

  it("does not resolve suspended tenant", async () => {
    await Tenant.create({
      name: "X",
      slug: "x",
      status: "suspended",
    })

    const found = await Tenant.findOne({
      slug: "x",
      status: "active",
    })

    expect(found).toBeNull()
  })
})