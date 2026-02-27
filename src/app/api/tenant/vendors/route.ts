import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { Vendor } from "@/models/Vendor"
import { VendorService } from "@/services/vendorService"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q") || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = 10
  const skip = (page - 1) * limit

  const filter: any = {
    organizationId: session.user.tenantId,
    status: { $ne: "deleted" },
  }

  if (query) {
    filter.name = { $regex: query, $options: "i" }
  }

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort({ priority: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Vendor.countDocuments(filter),
  ])

  return NextResponse.json({
    data: vendors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  try {
    const body = await req.json()

    const vendor = await VendorService.createVendor(
      body,
      session.user.tenantId,
      session.user.id
    )

    return NextResponse.json(vendor)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}