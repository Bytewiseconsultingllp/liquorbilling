import { connectDB } from "@/db/connection"
import { User } from "@/models/User"
import { Tenant } from "@/models/Tenant"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"
import mongoose from "mongoose"

export async function POST(req: Request) {
  const session = await mongoose.startSession()

  try {
    const { email, password, tenantName } = await req.json()

    if (!email || !password || !tenantName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await connectDB()

    session.startTransaction()

    // 1️⃣ Check if email exists
    const existingUser = await User.findOne({ email }).session(session)
    if (existingUser) {
      await session.abortTransaction()
      session.endSession()
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // 2️⃣ Generate slug from tenant name
    const slug = tenantName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    const existingTenant = await Tenant.findOne({ slug }).session(session)
    if (existingTenant) {
      await session.abortTransaction()
      session.endSession()
      return NextResponse.json(
        { error: "Tenant name already taken" },
        { status: 400 }
      )
    }

    // 3️⃣ Create Tenant
    const tenant = await Tenant.create(
      [
        {
          name: tenantName,
          slug,
          status: "active",
          plan: "free",
        },
      ],
      { session }
    )

    // 4️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // 5️⃣ Create User linked to tenant
    await User.create(
      [
        {
          name: tenantName,
          email,
          passwordHash,
          tenantId: tenant[0]._id,
          role: "owner",
          isPlatformAdmin: false,
          status: "active",
        },
      ],
      { session }
    )

    await session.commitTransaction()
    session.endSession()

    return NextResponse.json({
      message: "Tenant and user created successfully",
    })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}