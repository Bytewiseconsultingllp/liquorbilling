import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { ObjectId } from "mongodb"
import { Product } from "@/models/Product"
import { Purchase } from "@/models/Purchase"
import { Sale } from "@/models/Sale"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  const { startDate, endDate } = await req.json()

  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(23, 59, 59)

  const products = await Product.find({
    organizationId: session.user.tenantId,
  })

  const result = []

  for (const product of products) {
    // Purchases within range
    const purchases = await Purchase.aggregate([
      { $match: {
        organizationId: new ObjectId(product.organizationId),
        purchaseDate: { $gte: start, $lte: end },
      }},
      { $unwind: "$items" },
      { $match: {
        "items.productId": product._id,
      }},
      { $group: {
        _id: null,
        totalQty: { $sum: "$items.totalBottles" }
      }}
    ])

    // Sales within range
    const sales = await Sale.aggregate([
      { $match: {
        organizationId: new ObjectId(product.organizationId),
        saleDate: { $gte: start, $lte: end },
      }},
      { $unwind: "$items" },
      { $match: {
        "items.productId": product._id,
      }},
      { $group: {
        _id: null,
        totalQty: { $sum: "$items.quantity" }
      }}
    ])

    const totalPurchases =
      purchases[0]?.totalQty || 0

    const totalSales =
      sales[0]?.totalQty || 0

    result.push({
      productId: product._id,
      productName: product.name,
      currentStock: product.currentStock,
      morningStock: product.morningStock || 0,
      pricePerUnit: product.pricePerUnit,
      morningStockLastUpdatedDate: product.morningStockLastUpdatedDate || null,
      purchases: totalPurchases,
      sales: totalSales,
    })
  }

  return NextResponse.json(result)
}