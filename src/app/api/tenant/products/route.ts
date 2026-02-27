import { ProductService } from "@/services/productService"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.tenantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  const { searchParams } = new URL(req.url)

  const query = searchParams.get("q")?.trim() || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const rawLimit = parseInt(searchParams.get("limit") || "10")
  const all = rawLimit === 0
  const limit = all ? 0 : Math.min(50, rawLimit)

  const skip = all ? 0 : (page - 1) * limit

  const filter: any = {
    organizationId: session.user.tenantId,
    status: { $ne: "deleted" },
  }

  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { brand: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
      { sku: { $regex: query, $options: "i" } },
    ]
  }

  const q = Product.find(filter).sort({ createdAt: -1 })
  if (!all) { q.skip(skip).limit(limit) }

  const [products, total] = await Promise.all([
    q.lean(),
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
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.tenantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  try {
    const body = await req.json()

    const product = await ProductService.createProduct(
      body,
      session.user.tenantId,
      session.user.id
    )

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
