import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { B2BSaleService } from "@/services/b2bSaleService"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  await connectDB()

  try {
    const sales = await B2BSaleService.listB2BSales(session.user.tenantId)
    return NextResponse.json({ data: sales })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
