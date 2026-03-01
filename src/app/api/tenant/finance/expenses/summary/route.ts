import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { ExpenseService } from "@/services/expenseService"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate") || undefined
  const endDate = searchParams.get("endDate") || undefined

  const summary = await ExpenseService.getSummary(
    session.user.tenantId,
    startDate,
    endDate
  )

  return NextResponse.json(summary)
}
