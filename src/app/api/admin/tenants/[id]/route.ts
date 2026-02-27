import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { Tenant } from "@/models/Tenant"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await connectDB()

  const { id } = await context.params
  const body = await req.json()

  const updated = await Tenant.findByIdAndUpdate(
    id,
    { status: body.status },
    { returnDocument: "after" }
  )

  return NextResponse.json(updated)
}