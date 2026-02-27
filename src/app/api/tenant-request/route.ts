import { connectDB } from "@/db/connection"
import { TenantRequest } from "@/models/TenantRequest"
import { Tenant } from "@/models/Tenant"
import { User } from "@/models/User"
import { tenantRequestSchema } from "@/lib/validation/tenantRequest"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  await connectDB()

  const body = await req.json()

  const parsed = tenantRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.format() },
      { status: 400 }
    )
  }

  const { companyName, slug, email, password, phone, address } = parsed.data

  // Check if slug is already taken by an existing tenant
  const existingTenant = await Tenant.findOne({ slug })
  if (existingTenant) {
    return NextResponse.json(
      { error: "This URL slug is already taken by an existing organization" },
      { status: 400 }
    )
  }

  // Check if slug is already requested
  const existingRequest = await TenantRequest.findOne({
    requestedSlug: slug,
    status: { $in: ["pending", "approved"] },
  })

  if (existingRequest) {
    return NextResponse.json(
      { error: "This URL slug has already been requested" },
      { status: 400 }
    )
  }

  // Check if email is already registered
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 400 }
    )
  }

  // Hash password for storage in the request
  const passwordHash = await bcrypt.hash(password, 10)

  const request = await TenantRequest.create({
    companyName,
    requestedSlug: slug,
    requestedByEmail: email,
    passwordHash,
    phone: phone || "",
    address: address || "",
  })

  return NextResponse.json({ message: "Request submitted successfully", requestId: request._id })
}