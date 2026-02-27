import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/db/connection";
import { ReportService } from "@/services/reportService";
import { Tenant } from "@/models/Tenant";
import { buildVendorReportHtml, generatePdfFromHtml } from "@/lib/pdfGenerator";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const vendorId = searchParams.get("vendorId") || undefined;
  const format = searchParams.get("format");

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  await connectDB();

  try {
    const data = await ReportService.getVendorReport(session.user.tenantId, startDate, endDate, vendorId);

    if (format === "pdf") {
      const tenant = await Tenant.findById(session.user.tenantId).lean();
      const orgName = (tenant as Record<string, string>)?.name || "Organization";
      const html = buildVendorReportHtml(data, orgName);
      const pdfBuffer = await generatePdfFromHtml(html);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Vendor_Report_${startDate}_to_${endDate}.pdf"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
