/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

// Auto-detect a local Chrome/Edge executable for development
function findLocalBrowser(): string | null {
  const candidates: string[] =
    process.platform === "win32"
      ? [
          path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
          path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
          path.join(process.env.PROGRAMFILES || "", "Microsoft", "Edge", "Application", "msedge.exe"),
          path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/usr/bin/microsoft-edge",
          ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      continue;
    }
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function today(): string {
  return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Shared Template Wrapper ──────────────────────────────────────
function wrapHtml(title: string, orgName: string, period: { startDate: string; endDate: string }, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 18mm 15mm 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; }

  .header { text-align: center; border-bottom: 2.5px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 6px; }
  .header .org-name { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; }
  .header .report-title { font-size: 13px; font-weight: 600; margin-top: 3px; color: #333; }
  .header .period { font-size: 10px; color: #555; margin-top: 2px; }

  .meta-row { display: flex; justify-content: space-between; font-size: 9px; color: #666; margin-bottom: 12px; padding: 0 2px; }

  .section { margin-bottom: 16px; }
  .section-title { font-size: 12px; font-weight: 700; color: #1a1a1a; border-bottom: 1.5px solid #333; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 14px; }
  .summary-card { border: 1px solid #ccc; border-radius: 4px; padding: 8px 10px; }
  .summary-card .label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.3px; }
  .summary-card .value { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }
  .summary-card .sub { font-size: 9px; color: #888; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
  thead th { background: #f0f0f0; border: 1px solid #bbb; padding: 5px 8px; text-align: left; font-weight: 600; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; }
  tbody td { border: 1px solid #ccc; padding: 4px 8px; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tfoot td { border: 1px solid #bbb; padding: 5px 8px; font-weight: 700; background: #f5f5f5; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #ddd; padding: 6px 15mm; }
  .footer .sig-line { display: inline-block; width: 180px; border-top: 1px solid #333; margin-top: 30px; padding-top: 4px; font-size: 9px; color: #333; }

  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(0,0,0,0.03); font-weight: 900; text-transform: uppercase; pointer-events: none; z-index: -1; }
</style>
</head>
<body>
  <div class="watermark">${orgName}</div>

  <div class="header">
    <div class="org-name">${orgName}</div>
    <div class="report-title">${title}</div>
    <div class="period">Period: ${fmtDate(period.startDate)} — ${fmtDate(period.endDate)}</div>
  </div>

  <div class="meta-row">
    <span>Generated on: ${today()}</span>
    <span>CONFIDENTIAL — For internal use only</span>
  </div>

  ${bodyContent}

  <div class="footer">
    <div style="margin-bottom:8px;">This is a system-generated report and does not require a signature unless otherwise specified.</div>
    <div style="display:flex;justify-content:space-between;padding:0 20px;">
      <div class="sig-line">Prepared By</div>
      <div class="sig-line">Authorized Signatory</div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Daily Report PDF ─────────────────────────────────────────────
export function buildDailyReportHtml(data: any, orgName: string): string {
  const s = data.sales;
  const p = data.purchases;
  const cg = data.creditGiven;
  const cc = data.creditCollected;

  let body = `
  <div class="section">
    <div class="section-title">Summary Overview</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total Sales</div>
        <div class="value">₹${fmt(s.totalSales)}</div>
        <div class="sub">${s.count} transactions</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Purchases</div>
        <div class="value">₹${fmt(p.totalPurchases)}</div>
        <div class="sub">${p.count} transactions</div>
      </div>
      <div class="summary-card">
        <div class="label">Credit Given</div>
        <div class="value">₹${fmt(cg.totalCreditGiven)}</div>
        <div class="sub">${cg.count} transactions</div>
      </div>
      <div class="summary-card">
        <div class="label">Credit Collected</div>
        <div class="value">₹${fmt(cc.totalCollected)}</div>
        <div class="sub">Cash: ₹${fmt(cc.cashCollected)} | Online: ₹${fmt(cc.onlineCollected)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Cash Collection</div>
        <div class="value">₹${fmt(data.totalCashCollection)}</div>
        <div class="sub">Sale Cash + Credit Cash</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Online Collection</div>
        <div class="value">₹${fmt(data.totalOnlineCollection)}</div>
        <div class="sub">Sale Online + Credit Online</div>
      </div>
      <div class="summary-card">
        <div class="label">Sales Received</div>
        <div class="value">₹${fmt(s.totalPaid)}</div>
        <div class="sub">Due: ₹${fmt(s.totalDue)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Purchase Paid</div>
        <div class="value">₹${fmt(p.totalPaid)}</div>
        <div class="sub">Due: ₹${fmt(p.totalDue)}</div>
      </div>
    </div>
  </div>`;

  // Category-wise sale table
  if (data.categoryWiseSale?.length) {
    body += `
  <div class="section">
    <div class="section-title">Category-wise Sales</div>
    <table>
      <thead><tr><th>S.No.</th><th>Category</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.categoryWiseSale.map((c: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${c._id}</td><td class="text-right">${c.totalQuantity}</td><td class="text-right">${fmt(c.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.categoryWiseSale.reduce((a: number, c: any) => a + c.totalQuantity, 0)}</td><td class="text-right">${fmt(data.categoryWiseSale.reduce((a: number, c: any) => a + c.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Product-wise sale table
  if (data.productWiseSale?.length) {
    body += `
  <div class="section">
    <div class="section-title">Product-wise Sales</div>
    <table>
      <thead><tr><th>S.No.</th><th>Product</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.productWiseSale.map((p: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${p.productName}</td><td class="text-right">${p.totalQuantity}</td><td class="text-right">${fmt(p.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.productWiseSale.reduce((a: number, p: any) => a + p.totalQuantity, 0)}</td><td class="text-right">${fmt(data.productWiseSale.reduce((a: number, p: any) => a + p.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Credit given by customer
  if (data.creditGivenByCustomer?.length) {
    body += `
  <div class="section">
    <div class="section-title">Credit Given to Customers</div>
    <table>
      <thead><tr><th>S.No.</th><th>Customer</th><th class="text-right">Transactions</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.creditGivenByCustomer.map((c: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${c.customerName || "Unknown"}</td><td class="text-right">${c.count}</td><td class="text-right">${fmt(c.totalCredit)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.creditGivenByCustomer.reduce((a: number, c: any) => a + c.count, 0)}</td><td class="text-right">${fmt(data.creditGivenByCustomer.reduce((a: number, c: any) => a + c.totalCredit, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Credit received from customers
  if (data.creditReceivedByCustomer?.length) {
    body += `
  <div class="section">
    <div class="section-title">Credit Received from Customers</div>
    <table>
      <thead><tr><th>S.No.</th><th>Customer</th><th class="text-right">Transactions</th><th class="text-right">Cash (₹)</th><th class="text-right">Online (₹)</th><th class="text-right">Total (₹)</th></tr></thead>
      <tbody>${data.creditReceivedByCustomer.map((c: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${c.customerName || "Unknown"}</td><td class="text-right">${c.count}</td><td class="text-right">${fmt(c.cashReceived)}</td><td class="text-right">${fmt(c.onlineReceived)}</td><td class="text-right">${fmt(c.totalReceived)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.creditReceivedByCustomer.reduce((a: number, c: any) => a + c.count, 0)}</td><td class="text-right">${fmt(data.creditReceivedByCustomer.reduce((a: number, c: any) => a + c.cashReceived, 0))}</td><td class="text-right">${fmt(data.creditReceivedByCustomer.reduce((a: number, c: any) => a + c.onlineReceived, 0))}</td><td class="text-right">${fmt(data.creditReceivedByCustomer.reduce((a: number, c: any) => a + c.totalReceived, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  return wrapHtml("Daily Business Report", orgName, data.period, body);
}

// ─── Sales Report PDF ─────────────────────────────────────────────
export function buildSalesReportHtml(data: any, orgName: string): string {
  const s = data.summary;
  const pm = data.paymentMode;

  let body = `
  <div class="section">
    <div class="section-title">Sales Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total Sales</div>
        <div class="value">₹${fmt(s.totalSales)}</div>
        <div class="sub">${s.count} invoices</div>
      </div>
      <div class="summary-card">
        <div class="label">Amount Received</div>
        <div class="value">₹${fmt(s.totalPaid)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Outstanding</div>
        <div class="value">₹${fmt(s.totalDue)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Discount Given</div>
        <div class="value">₹${fmt(s.totalDiscount)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Collection by Mode</div>
    <table>
      <thead><tr><th>Payment Mode</th><th class="text-right">Amount (₹)</th><th class="text-right">% of Total</th></tr></thead>
      <tbody>
        <tr><td>Cash</td><td class="text-right">${fmt(pm.cash)}</td><td class="text-right">${s.totalSales ? ((pm.cash / s.totalSales) * 100).toFixed(1) : '0.0'}%</td></tr>
        <tr><td>Online / UPI</td><td class="text-right">${fmt(pm.online)}</td><td class="text-right">${s.totalSales ? ((pm.online / s.totalSales) * 100).toFixed(1) : '0.0'}%</td></tr>
        <tr><td>Credit</td><td class="text-right">${fmt(pm.credit)}</td><td class="text-right">${s.totalSales ? ((pm.credit / s.totalSales) * 100).toFixed(1) : '0.0'}%</td></tr>
      </tbody>
      <tfoot><tr><td>Total</td><td class="text-right">${fmt(pm.cash + pm.online + pm.credit)}</td><td class="text-right">100%</td></tr></tfoot>
    </table>
  </div>`;

  // Category-wise
  if (data.categoryWiseSale?.length) {
    body += `
  <div class="section">
    <div class="section-title">Category-wise Sales</div>
    <table>
      <thead><tr><th>S.No.</th><th>Category</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.categoryWiseSale.map((c: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${c._id}</td><td class="text-right">${c.totalQuantity}</td><td class="text-right">${fmt(c.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.categoryWiseSale.reduce((a: number, c: any) => a + c.totalQuantity, 0)}</td><td class="text-right">${fmt(data.categoryWiseSale.reduce((a: number, c: any) => a + c.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Product-wise
  if (data.productWiseSale?.length) {
    body += `
  <div class="section">
    <div class="section-title">Product-wise Sales</div>
    <table>
      <thead><tr><th>S.No.</th><th>Product</th><th class="text-right">Qty</th><th class="text-right">Discount (₹)</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.productWiseSale.map((p: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${p.productName}</td><td class="text-right">${p.totalQuantity}</td><td class="text-right">${fmt(p.totalDiscount)}</td><td class="text-right">${fmt(p.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.productWiseSale.reduce((a: number, p: any) => a + p.totalQuantity, 0)}</td><td class="text-right">${fmt(data.productWiseSale.reduce((a: number, p: any) => a + (p.totalDiscount || 0), 0))}</td><td class="text-right">${fmt(data.productWiseSale.reduce((a: number, p: any) => a + p.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Daily breakdown
  if (data.dailyBreakdown?.length) {
    body += `
  <div class="section">
    <div class="section-title">Day-wise Breakdown</div>
    <table>
      <thead><tr><th>Date</th><th class="text-right">No. of Sales</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.dailyBreakdown.map((d: any) => `
        <tr><td>${fmtDate(d._id)}</td><td class="text-right">${d.count}</td><td class="text-right">${fmt(d.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td>Total</td><td class="text-right">${data.dailyBreakdown.reduce((a: number, d: any) => a + d.count, 0)}</td><td class="text-right">${fmt(data.dailyBreakdown.reduce((a: number, d: any) => a + d.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  return wrapHtml("Sales Report", orgName, data.period, body);
}

// ─── Purchase Report PDF ──────────────────────────────────────────
export function buildPurchaseReportHtml(data: any, orgName: string): string {
  const s = data.summary;

  let body = `
  <div class="section">
    <div class="section-title">Purchase Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total Purchases</div>
        <div class="value">₹${fmt(s.totalPurchases)}</div>
        <div class="sub">${s.count} invoices</div>
      </div>
      <div class="summary-card">
        <div class="label">Amount Paid</div>
        <div class="value">₹${fmt(s.totalPaid)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Outstanding</div>
        <div class="value">₹${fmt(s.totalDue)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Tax</div>
        <div class="value">₹${fmt(s.totalTax)}</div>
      </div>
    </div>
  </div>`;

  // Vendor-wise
  if (data.vendorWisePurchase?.length) {
    body += `
  <div class="section">
    <div class="section-title">Vendor-wise Purchases</div>
    <table>
      <thead><tr><th>S.No.</th><th>Vendor</th><th class="text-right">Invoices</th><th class="text-right">Amount (₹)</th><th class="text-right">Paid (₹)</th><th class="text-right">Due (₹)</th></tr></thead>
      <tbody>${data.vendorWisePurchase.map((v: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${v.vendorName || "Unknown"}</td><td class="text-right">${v.count}</td><td class="text-right">${fmt(v.totalAmount)}</td><td class="text-right">${fmt(v.totalPaid)}</td><td class="text-right">${fmt(v.totalDue)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.vendorWisePurchase.reduce((a: number, v: any) => a + v.count, 0)}</td><td class="text-right">${fmt(data.vendorWisePurchase.reduce((a: number, v: any) => a + v.totalAmount, 0))}</td><td class="text-right">${fmt(data.vendorWisePurchase.reduce((a: number, v: any) => a + v.totalPaid, 0))}</td><td class="text-right">${fmt(data.vendorWisePurchase.reduce((a: number, v: any) => a + v.totalDue, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Category-wise
  if (data.categoryWisePurchase?.length) {
    body += `
  <div class="section">
    <div class="section-title">Category-wise Purchases</div>
    <table>
      <thead><tr><th>S.No.</th><th>Category</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.categoryWisePurchase.map((c: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${c._id}</td><td class="text-right">${c.totalQuantity}</td><td class="text-right">${fmt(c.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.categoryWisePurchase.reduce((a: number, c: any) => a + c.totalQuantity, 0)}</td><td class="text-right">${fmt(data.categoryWisePurchase.reduce((a: number, c: any) => a + c.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Product-wise
  if (data.productWisePurchase?.length) {
    body += `
  <div class="section">
    <div class="section-title">Product-wise Purchases</div>
    <table>
      <thead><tr><th>S.No.</th><th>Product</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.productWisePurchase.map((p: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${p.productName}</td><td class="text-right">${p.totalQuantity}</td><td class="text-right">${fmt(p.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="text-right">${data.productWisePurchase.reduce((a: number, p: any) => a + p.totalQuantity, 0)}</td><td class="text-right">${fmt(data.productWisePurchase.reduce((a: number, p: any) => a + p.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  // Daily breakdown
  if (data.dailyBreakdown?.length) {
    body += `
  <div class="section">
    <div class="section-title">Day-wise Breakdown</div>
    <table>
      <thead><tr><th>Date</th><th class="text-right">No. of Purchases</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.dailyBreakdown.map((d: any) => `
        <tr><td>${fmtDate(d._id)}</td><td class="text-right">${d.count}</td><td class="text-right">${fmt(d.totalAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td>Total</td><td class="text-right">${data.dailyBreakdown.reduce((a: number, d: any) => a + d.count, 0)}</td><td class="text-right">${fmt(data.dailyBreakdown.reduce((a: number, d: any) => a + d.totalAmount, 0))}</td></tr></tfoot>
    </table>
  </div>`;
  }

  return wrapHtml("Purchase Report", orgName, data.period, body);
}

// ─── Vendor Report PDF ────────────────────────────────────────────
export function buildVendorReportHtml(data: any, orgName: string): string {
  let body = "";

  // Purchase summary per vendor
  if (data.purchases.summary?.length) {
    body += `
  <div class="section">
    <div class="section-title">Vendor Purchase Summary</div>
    <table>
      <thead><tr><th>S.No.</th><th>Vendor</th><th class="text-right">Invoices</th><th class="text-right">Purchases (₹)</th><th class="text-right">Paid (₹)</th><th class="text-right">Due (₹)</th></tr></thead>
      <tbody>${data.purchases.summary.map((v: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${v.vendorName || "Unknown"}</td><td class="text-right">${v.count}</td><td class="text-right">${fmt(v.totalPurchases)}</td><td class="text-right">${fmt(v.totalPaid)}</td><td class="text-right">${fmt(v.totalDue)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>`;
  }

  // Sales allocation per vendor
  if (data.sales.summary?.length) {
    body += `
  <div class="section">
    <div class="section-title">Vendor Sales Allocation (Stock Sold from Vendor)</div>
    <table>
      <thead><tr><th>S.No.</th><th>Vendor</th><th class="text-right">Qty Sold</th><th class="text-right">Sale Value (₹)</th></tr></thead>
      <tbody>${data.sales.summary.map((v: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${v.vendorName || "Unknown"}</td><td class="text-right">${v.totalQuantitySold}</td><td class="text-right">${fmt(v.totalSaleAmount)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>`;
  }

  // Product-wise purchase
  if (data.purchases.productWise?.length) {
    body += `
  <div class="section">
    <div class="section-title">Product-wise Purchases by Vendor</div>
    <table>
      <thead><tr><th>S.No.</th><th>Vendor</th><th>Product</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.purchases.productWise.map((p: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${p.vendorName || "Unknown"}</td><td>${p.productName || "Unknown"}</td><td class="text-right">${p.totalQuantity}</td><td class="text-right">${fmt(p.totalAmount)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>`;
  }

  // Product-wise sale
  if (data.sales.productWise?.length) {
    body += `
  <div class="section">
    <div class="section-title">Product-wise Sales by Vendor</div>
    <table>
      <thead><tr><th>S.No.</th><th>Vendor</th><th>Product</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.sales.productWise.map((p: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${p.vendorName || "Unknown"}</td><td>${p.productName || "Unknown"}</td><td class="text-right">${p.totalQuantity}</td><td class="text-right">${fmt(p.totalAmount)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>`;
  }

  // Category-wise purchase
  if (data.purchases.categoryWise?.length) {
    body += `
  <div class="section">
    <div class="section-title">Category-wise Purchases by Vendor</div>
    <table>
      <thead><tr><th>S.No.</th><th>Vendor</th><th>Category</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.purchases.categoryWise.map((c: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${c.vendorName || "Unknown"}</td><td>${c._id?.category || c._id}</td><td class="text-right">${c.totalQuantity}</td><td class="text-right">${fmt(c.totalAmount)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>`;
  }

  // Category-wise sale
  if (data.sales.categoryWise?.length) {
    body += `
  <div class="section">
    <div class="section-title">Category-wise Sales by Vendor</div>
    <table>
      <thead><tr><th>S.No.</th><th>Vendor</th><th>Category</th><th class="text-right">Qty</th><th class="text-right">Amount (₹)</th></tr></thead>
      <tbody>${data.sales.categoryWise.map((c: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${c.vendorName || "Unknown"}</td><td>${c._id?.category || c._id}</td><td class="text-right">${c.totalQuantity}</td><td class="text-right">${fmt(c.totalAmount)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>`;
  }

  return wrapHtml("Vendor Report", orgName, data.period, body);
}

// ─── Product Report PDF ───────────────────────────────────────────
export function buildProductReportHtml(data: any, orgName: string): string {
  const s = data.summary;

  let body = `
  <div class="section">
    <div class="section-title">Product Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total Products</div>
        <div class="value">${s.totalProducts}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Sales</div>
        <div class="value">₹${fmt(s.totalSaleAmount)}</div>
        <div class="sub">${s.totalQuantitySold} units sold</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Purchases</div>
        <div class="value">₹${fmt(s.totalPurchaseAmount)}</div>
        <div class="sub">${s.totalQuantityPurchased} units purchased</div>
      </div>
    </div>
  </div>`;

  if (data.products?.length) {
    body += `
  <div class="section">
    <div class="section-title">Product-wise Details</div>
    <table>
      <thead><tr><th>S.No.</th><th>Product</th><th>Category</th><th>Brand</th><th class="text-right">Stock</th><th class="text-right">Sold</th><th class="text-right">Sale Amt (₹)</th><th class="text-right">Purchased</th><th class="text-right">Purchase Amt (₹)</th></tr></thead>
      <tbody>${data.products.map((p: any, i: number) => `
        <tr><td class="text-center">${i + 1}</td><td>${p.productName}</td><td>${p.category}</td><td>${p.brand}</td><td class="text-right">${p.currentStock}</td><td class="text-right">${p.totalQuantitySold}</td><td class="text-right">${fmt(p.totalSaleAmount)}</td><td class="text-right">${p.totalQuantityPurchased}</td><td class="text-right">${fmt(p.totalPurchaseAmount)}</td></tr>`).join("")}
      </tbody>
      <tfoot><tr><td colspan="4">Total</td><td class="text-right">${data.products.reduce((a: number, p: any) => a + p.currentStock, 0)}</td><td class="text-right">${s.totalQuantitySold}</td><td class="text-right">${fmt(s.totalSaleAmount)}</td><td class="text-right">${s.totalQuantityPurchased}</td><td class="text-right">${fmt(s.totalPurchaseAmount)}</td></tr></tfoot>
    </table>
  </div>`;
  }

  return wrapHtml("Product Report", orgName, data.period, body);
}

// ─── HTML → PDF Conversion ────────────────────────────────────────
export async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  // Use local Chrome/Edge in dev; fall back to @sparticuz/chromium in production/serverless
  const localBrowser = findLocalBrowser();
  const execPath = localBrowser || (await chromium.executablePath());

  const browser = await puppeteer.launch({
    args: localBrowser
      ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
      : chromium.args,
    executablePath: execPath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}
