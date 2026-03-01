import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { ExpenseService } from "@/services/expenseService"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()
  const categories = await ExpenseService.listCategories(session.user.tenantId)
  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  try {
    const body = await req.json()
    if (!body.name?.trim()) throw new Error("Category name is required")
    const category = await ExpenseService.createCategory(body, session.user.tenantId)
    return NextResponse.json(category)
  } catch (error: any) {
    const isDup = error.code === 11000
    return NextResponse.json(
      { error: isDup ? "Category already exists" : error.message },
      { status: 400 }
    )
  }
}
