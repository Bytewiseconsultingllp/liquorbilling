import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { CreditPayment } from "@/models/CreditPayment"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get("customerId")

  const payments = await CreditPayment.find({
    organizationId: session.user.tenantId,
    customerId,
  }).sort({ creditDate: -1 })

  return NextResponse.json(payments)
}