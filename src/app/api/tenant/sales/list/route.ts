import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { Sale } from "@/models/Sale"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get("customerId")

  const filter: Record<string, unknown> = {
    organizationId: session.user.tenantId,
  }
  if (customerId) filter.customerId = customerId

  const sales = await Sale.find(filter)
    .sort({ createdAt: -1 })
    .select(
      "saleNumber saleDate customerName totalAmount paidAmount dueAmount paymentStatus paymentMode cashAmount onlineAmount creditAmount billDiscountAmount totalDiscount type isReturned status items"
    )

  return NextResponse.json(sales)
}