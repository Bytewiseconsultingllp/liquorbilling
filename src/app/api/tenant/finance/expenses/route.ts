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
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = parseInt(searchParams.get("limit") || "20")
  const categoryId = searchParams.get("categoryId") || undefined
  const startDate = searchParams.get("startDate") || undefined
  const endDate = searchParams.get("endDate") || undefined
  const paymentMode = searchParams.get("paymentMode") || undefined

  const result = await ExpenseService.listExpenses(session.user.tenantId, {
    page,
    limit,
    categoryId,
    startDate,
    endDate,
    paymentMode,
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  try {
    const body = await req.json()
    const expense = await ExpenseService.createExpense(
      body,
      session.user.tenantId,
      session.user.id
    )
    return NextResponse.json(expense)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
