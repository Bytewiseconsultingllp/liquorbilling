import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { ProductService } from "@/services/productService"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.tenantId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  }

  await connectDB()

  try {
    const body = await req.json()

    const result = await ProductService.bulkCreateProducts(
      body,
      session.user.tenantId,
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