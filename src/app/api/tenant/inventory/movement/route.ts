import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { Product } from "@/models/Product"
import { Purchase } from "@/models/Purchase"
import { Sale } from "@/models/Sale"
import { startOfDayIST, endOfDayIST } from "@/lib/timezone"
import mongoose from "mongoose"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  const { startDate, endDate } = await req.json()
  const start = startOfDayIST(new Date(startDate))
  const end = endOfDayIST(new Date(endDate))
  const orgId = new mongoose.Types.ObjectId(session.user.tenantId)

  // Run 3 queries in parallel instead of 2N sequential queries
  const [products, purchaseAgg, saleAgg] = await Promise.all([
    Product.find({ organizationId: session.user.tenantId })
      .select("name volumeML currentStock morningStock pricePerUnit morningStockLastUpdatedDate")
      .lean(),

    // Single aggregation for ALL purchase quantities grouped by productId
    Purchase.aggregate([
      { $match: { organizationId: orgId, purchaseDate: { $gte: start, $lte: end }, isReturned: { $ne: true } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", totalQty: { $sum: "$items.totalBottles" } } },
    ]),

    // Single aggregation for ALL sale quantities grouped by productId
    Sale.aggregate([
      { $match: { organizationId: orgId, saleDate: { $gte: start, $lte: end }, status: "active", type: "sale" } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", totalQty: { $sum: "$items.quantity" } } },
    ]),
  ])

  // Build lookup maps: productId string → qty
  const purchaseMap = new Map<string, number>()
  for (const p of purchaseAgg) purchaseMap.set(String(p._id), p.totalQty)

  const saleMap = new Map<string, number>()
  for (const s of saleAgg) saleMap.set(String(s._id), s.totalQty)

  // Merge into result
  const result = products.map((product: any) => ({
    productId: product._id,
    productName: product.name,
    volumeML: product.volumeML || 0,
    currentStock: product.currentStock,
    morningStock: product.morningStock || 0,
    pricePerUnit: product.pricePerUnit,
    morningStockLastUpdatedDate: product.morningStockLastUpdatedDate || null,
    purchases: purchaseMap.get(String(product._id)) || 0,
    sales: saleMap.get(String(product._id)) || 0,
  }))

  return NextResponse.json(result)
}