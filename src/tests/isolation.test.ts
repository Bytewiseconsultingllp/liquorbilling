import { Project } from "@/models/Project"

describe("Tenant Data Isolation", () => {
  it("does not fetch other tenant data", async () => {
    await Project.create({
      tenantId: "t1",
      name: "Project A",
    })

    await Project.create({
      tenantId: "t2",
      name: "Project B",
    })

    const projects = await Project.find({ tenantId: "t1" })

    expect(projects.length).toBe(1)
    expect(projects[0].name).toBe("Project A")
  })
})