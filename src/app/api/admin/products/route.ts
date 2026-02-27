import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { Product } from "@/models/Product"
import { Tenant } from "@/models/Tenant"
import mongoose from "mongoose"
import { FilterQuery } from "mongoose"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  // 🔒 Platform admin only
  if (!session || !session.user.isPlatformAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  const { searchParams } = new URL(req.url)

  const query = searchParams.get("q")?.trim() || ""
  const tenantId = searchParams.get("tenantId") || ""
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10)
  )

  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
  )

  const skip = (page - 1) * limit

  const filter: FilterQuery<typeof Product> = {
    status: { $ne: "deleted" },
  }

  // 🔍 Tenant filter (optional)
  if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
    filter.organizationId = tenantId
  }

  // 🔍 Search filter
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { brand: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
      { sku: { $regex: query, $options: "i" } },
    ]
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate({
        path: "organizationId",
        model: Tenant,
        select: "name slug",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ])

  return NextResponse.json({
    data: products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}