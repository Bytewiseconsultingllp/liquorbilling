import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { connectDB } from "@/db/connection"
import { UserService } from "@/services/userService"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function PATCH(
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

  if (!session.user.tenantId) {
    return NextResponse.json(
      { error: "Tenant missing" },
      { status: 400 }
    )
  }

  await connectDB()

  const { id } = await context.params
  const body = await req.json()

  try {
    const updated = await UserService.updateUser(
      id,
      body,
      session.user.id
    )

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function DELETE(
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

  if (!session.user.tenantId) {
    return NextResponse.json(
      { error: "Tenant missing" },
      { status: 400 }
    )
  }

  await connectDB()

  const { id } = await context.params

  try {
    // 🔥 Use service — do NOT bypass it
    await UserService.deleteUser(
      id,
      session.user.id
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}