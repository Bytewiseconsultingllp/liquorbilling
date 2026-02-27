import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { CreditService } from "@/services/creditService"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  await connectDB()

  const body = await req.json()

  try {
    const result = await CreditService.collectCredit(
      {
        ...body,
        organizationId: session.user.tenantId,
      },
      session.user.id
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}