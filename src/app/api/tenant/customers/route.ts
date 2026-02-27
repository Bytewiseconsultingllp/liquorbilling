import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/db/connection";
import { Customer } from "@/models/Customer";
import { CustomerService } from "@/services/customerService";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const rawLimit = parseInt(searchParams.get("limit") || "10");
  const all = rawLimit === 0;
  const limit = all ? 0 : Math.min(50, rawLimit);

  const skip = all ? 0 : (page - 1) * limit;

  const filter: any = {
    organizationId: session.user.tenantId,
    status: { $ne: "deleted" },
  };

  if (query) {
    filter.name = { $regex: query, $options: "i" };
  }

  // const [customers, total] = await Promise.all([
  //   Customer.find(filter).skip(skip).limit(limit).lean(),
  //   Customer.countDocuments(filter),
  // ]);

  const q = Customer.find(filter).sort({ createdAt: -1 })
    if (!all) { q.skip(skip).limit(limit) }
  
    const [customers, total] = await Promise.all([
      q.lean(),
      Customer.countDocuments(filter),
    ])

  return NextResponse.json({
    data: customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await connectDB();

  const body = await req.json();

  const customer = await CustomerService.createCustomer(
    body,
    session.user.tenantId,
    session.user.id,
  );

  return NextResponse.json(customer);
}
