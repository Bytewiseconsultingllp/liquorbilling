import { connectDB } from "@/db/connection";
import { Tenant } from "@/models/Tenant";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const tenant = await Tenant.findById(params.id);

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    slug: tenant.slug,
  });
}