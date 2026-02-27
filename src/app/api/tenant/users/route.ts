import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/db/connection";
import { User } from "@/models/User";
import { UserService } from "@/services/userService";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (!session.user.tenantId) {
    return NextResponse.json({ error: "Tenant missing" }, { status: 400 })
  }

  await connectDB()

  const { searchParams } = new URL(req.url)

  const query = searchParams.get("q") || ""
  const page = Number(searchParams.get("page") || 1)
  const limit = Number(searchParams.get("limit") || 10)

  const skip = (page - 1) * limit

  const filter: any = {
    tenantId: session.user.tenantId,
  }

  if (query) {
    filter.email = {
      $regex: query,
      $options: "i", // case insensitive
    }
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    User.countDocuments(filter),
  ])

  return NextResponse.json({
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!session.user.tenantId) {
    return NextResponse.json(
      { error: "Tenant not found in session" },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    const body = await req.json();

    const user = await UserService.createUser(
      body,
      session.user.tenantId
    );

  

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

