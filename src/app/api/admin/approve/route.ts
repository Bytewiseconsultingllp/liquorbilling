import { connectDB } from "@/db/connection"
import { TenantRequest } from "@/models/TenantRequest"
import { Tenant } from "@/models/Tenant"
import { User } from "@/models/User"
import { NextResponse } from "next/server"
import mongoose from "mongoose"

export async function POST(req: Request) {
  await connectDB()

  const { requestId, action, rejectionReason } = await req.json()

  const request = await TenantRequest.findById(requestId)

  if (!request) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    )
  }

  if (request.status !== "pending") {
    return NextResponse.json(
      { error: "Request has already been processed" },
      { status: 400 }
    )
  }

  // Handle rejection
  if (action === "reject") {
    request.status = "rejected"
    request.rejectionReason = rejectionReason || ""
    request.reviewedAt = new Date()
    await request.save()
    return NextResponse.json({ success: true, message: "Request rejected" })
  }

  // Handle approval — create tenant + user in a transaction
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const [tenant] = await Tenant.create(
      [
        {
          name: request.companyName,
          slug: request.requestedSlug,
          status: "active",
        },
      ],
      { session }
    )

    // Ensure passwordHash exists on the request
    if (!request.passwordHash) {
      throw new Error("This request is missing a password. It may have been created before the registration flow was updated. Please ask the applicant to re-register.")
    }

    // Check if user already exists (shouldn't normally, but just in case)
    let user = await User.findOne({ email: request.requestedByEmail }).session(session)

    if (user) {
      // Update existing user with tenant
      user.tenantId = tenant._id
      user.role = "owner"
      user.status = "active"
      if (!user.passwordHash || user.passwordHash === "temporary") {
        user.passwordHash = request.passwordHash
      }
      await user.save({ session })
    } else {
      // Create new user with the password hash from the request
      await User.create(
        [
          {
            email: request.requestedByEmail,
            name: request.companyName,
            passwordHash: request.passwordHash,
            tenantId: tenant._id,
            role: "owner",
            status: "active",
          },
        ],
        { session }
      )
    }

    request.status = "approved"
    request.reviewedAt = new Date()
    await request.save({ session })

    await session.commitTransaction()
    session.endSession()

    return NextResponse.json({ success: true, message: "Workspace approved and created" })
  } catch (err: any) {
    await session.abortTransaction()
    session.endSession()
    return NextResponse.json(
      { error: err.message || "Failed to approve request" },
      { status: 500 }
    )
  }
}