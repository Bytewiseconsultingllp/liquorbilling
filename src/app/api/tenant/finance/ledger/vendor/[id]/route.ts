import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { LedgerEntry } from "@/models/LedgerEntry"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session)
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )

  await connectDB()

  const { id } = await context.params
  const { searchParams } = new URL(req.url)

  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  let filter: any = {
    organizationId: session.user.tenantId,
    entityType: "vendor",
    entityId: id,
  }

  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  const entries = await LedgerEntry.find(filter)
    .sort({ createdAt: 1 })

  return NextResponse.json(entries)
}