import { TenantRequest } from "@/models/TenantRequest"

describe("Tenant Request", () => {
  it("creates request with pending status", async () => {
    const request = await TenantRequest.create({
      companyName: "Acme",
      requestedSlug: "acme",
      requestedByEmail: "owner@test.com",
    })

    expect(request.status).toBe("pending")
  })

  it("prevents duplicate slug request", async () => {
    await TenantRequest.create({
      companyName: "A",
      requestedSlug: "same",
      requestedByEmail: "a@test.com",
    })

    await expect(
      TenantRequest.create({
        companyName: "B",
        requestedSlug: "same",
        requestedByEmail: "b@test.com",
      })
    ).rejects.toThrow()
  })
})