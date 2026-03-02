import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { B2BSaleService } from "@/services/b2bSaleService"
import { B2BSale } from "@/models/B2BSale"
import { startOfDayIST, endOfDayIST } from "@/lib/timezone"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  await connectDB()

  try {
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter")

    if (filter === "today") {
      const sales = await B2BSaleService.getTodayB2BSales(
        session.user.tenantId
      )
      return NextResponse.json({ data: sales })
    }

    // Default: today's sales (IST boundaries)
    const startOfDay = startOfDayIST()
    const endOfDay = endOfDayIST()

    const sales = await B2BSale.find({
      organizationId: session.user.tenantId,
      saleDate: { $gte: startOfDay, $lte: endOfDay },
      status: "active",
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ data: sales })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  await connectDB()

  try {
    const body = await req.json()
    const sale = await B2BSaleService.createB2BSale(
      body,
      session.user.tenantId,
      session.user.id
    )
    return NextResponse.json(sale)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
