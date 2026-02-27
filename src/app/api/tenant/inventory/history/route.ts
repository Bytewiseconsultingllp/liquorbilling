import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { StockClosing } from "@/models/StockClosing"
import "@/models/Sale"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  const closings = await StockClosing.find({
    organizationId: session.user.tenantId,
  })
    .populate("saleId", "saleNumber")
    .sort({ closingDate: -1 })

  return NextResponse.json(closings)
}