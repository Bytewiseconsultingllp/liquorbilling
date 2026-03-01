import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { ExpenseService } from "@/services/expenseService"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  try {
    const { id } = await params
    const body = await req.json()
    const cat = await ExpenseService.updateCategory(id, body, session.user.tenantId)
    return NextResponse.json(cat)
  } catch (error: any) {
    const isDup = error.code === 11000
    return NextResponse.json(
      { error: isDup ? "Category already exists" : error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.tenantId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  try {
    const { id } = await params
    await ExpenseService.deleteCategory(id, session.user.tenantId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
