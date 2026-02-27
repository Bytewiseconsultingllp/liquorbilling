import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { PurchaseService } from "@/services/purchaseService"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  try {
    const body = await req.json()

    const purchase =
      await PurchaseService.createPurchase(
        body,
        session.user.tenantId,
        session.user.id
      )

    return NextResponse.json(purchase)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

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
      const purchases = await PurchaseService.getTodayPurchases(session.user.tenantId)
      return NextResponse.json({ data: purchases })
    }

    const purchases = await PurchaseService.listPurchases(session.user.tenantId)
    return NextResponse.json({ data: purchases })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}