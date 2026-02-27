import { User } from "@/models/User"
import bcrypt from "bcrypt"

export async function bootstrapAdmin() {
  const existingAdmin = await User.findOne({
    isPlatformAdmin: true,
  })

  if (existingAdmin) return

  if (
    !process.env.PLATFORM_ADMIN_EMAIL ||
    !process.env.PLATFORM_ADMIN_PASSWORD
  ) {
    console.warn("No bootstrap admin credentials provided")
    return
  }

  const passwordHash = await bcrypt.hash(
    process.env.PLATFORM_ADMIN_PASSWORD,
    10
  )

  await User.create({
    email: process.env.PLATFORM_ADMIN_EMAIL,
    passwordHash,
    isPlatformAdmin: true,
    role: "owner",
    tenantId: null,
    status: "active",
  })

  console.log("Bootstrap platform admin created")
}