import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { PurchaseReturnService } from "@/services/purchaseReturnService"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  try {
    const { id } = await params
    const result = await PurchaseReturnService.returnPurchase(
      id,
      session.user.tenantId,
      session.user.id
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
