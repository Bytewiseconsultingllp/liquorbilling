import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { CashbookEntry } from "@/models/CashbookEntry"
import { startOfDayIST, endOfDayIST } from "@/lib/timezone"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")

  const start = startOfDayIST(new Date(date!))
  const end = endOfDayIST(new Date(date!))

  const entries = await CashbookEntry.find({
    organizationId: session.user.tenantId,
    date: { $gte: start, $lte: end },
  })

  return NextResponse.json(entries)
}