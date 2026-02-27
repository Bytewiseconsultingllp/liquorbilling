import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/db/connection";
import { Tenant } from "@/models/Tenant";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  if (session.user.isPlatformAdmin) {
    redirect("/admin");
  }

  await connectDB();

  const tenant = await Tenant.findById(
    session.user.tenantId
  );

  if (!tenant) {
    return <div>No tenant assigned</div>;
  }

  redirect(`/${tenant.slug}/dashboard`);
}