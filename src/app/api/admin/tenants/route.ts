import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { Tenant } from "@/models/Tenant"
import { User } from "@/models/User"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  const { searchParams } = new URL(req.url)

  const query = searchParams.get("q")?.trim() || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(20, parseInt(searchParams.get("limit") || "10"))

  const skip = (page - 1) * limit

  const filter: any = {}

  if (query) {
    filter.name = { $regex: query, $options: "i" }
  }

  const [tenants, total] = await Promise.all([
    Tenant.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Tenant.countDocuments(filter),
  ])

  // Attach user count per tenant
  const tenantIds = tenants.map((t) => t._id)

  const userCounts = await User.aggregate([
    { $match: { tenantId: { $in: tenantIds } } },
    { $group: { _id: "$tenantId", count: { $sum: 1 } } },
  ])

  const countMap = Object.fromEntries(
    userCounts.map((c) => [c._id.toString(), c.count])
  )

  const enriched = tenants.map((t) => ({
    ...t,
    userCount: countMap[t._id.toString()] || 0,
  }))

  return NextResponse.json({
    data: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}