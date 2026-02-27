import { connectDB } from "@/db/connection"
import { User } from "@/models/User"
import { TenantRequest } from "@/models/TenantRequest"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  await connectDB()

  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ status: "no_account" })
  }

  // Check if user exists (already approved & created)
  const user = await User.findOne({ email: email.toLowerCase() })

  if (user) {
    // User exists — let normal auth flow handle password check
    return NextResponse.json({ status: "active" })
  }

  // No user — check for a pending/rejected request
  const request = await TenantRequest.findOne({
    requestedByEmail: email.toLowerCase(),
  }).sort({ createdAt: -1 })

  if (!request) {
    return NextResponse.json({ status: "no_account" })
  }

  if (request.status === "pending") {
    return NextResponse.json({ status: "pending" })
  }

  if (request.status === "rejected") {
    return NextResponse.json({
      status: "rejected",
      reason: request.rejectionReason || "",
    })
  }

  // Approved but user somehow doesn't exist (edge case)
  return NextResponse.json({ status: "no_account" })
}
