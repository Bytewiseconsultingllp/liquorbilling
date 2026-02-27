import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { InventoryService } from "@/services/inventoryService"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "owner") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  const body = await req.json()

  try {
    const result =
      await InventoryService.reconcileClosingStock(
        session.user.tenantId!,
        body.closingData,
        body.cashAmount,
        body.onlineAmount,
        session.user.id
      )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}