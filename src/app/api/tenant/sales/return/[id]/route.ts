import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { SalesReturnService } from "@/services/salesReturnService"

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "owner") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  const { id } = await context.params

  try {
    const result =
      await SalesReturnService.returnFullSale(
        id,
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