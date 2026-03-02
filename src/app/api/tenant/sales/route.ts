import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { SaleService } from "@/services/saleService"
import { Sale } from "@/models/Sale"
import { startOfDayIST, endOfDayIST } from "@/lib/timezone"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  await connectDB()

  // Return today's sales (IST boundaries)
  const startOfDay = startOfDayIST()
  const endOfDay = endOfDayIST()

  const sales = await Sale.find({
    organizationId: session.user.tenantId,
    saleDate: { $gte: startOfDay, $lte: endOfDay },
    status: "active",
    type: "sale",
  })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ data: sales })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  try {
    const body = await req.json()

    const sale = await SaleService.createSale(
      body,
      session.user.tenantId,
      session.user.id
    )

    return NextResponse.json(sale)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}