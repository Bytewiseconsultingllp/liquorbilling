/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────
type ReportTab = "daily" | "sales" | "purchase" | "vendor" | "product";

interface Vendor {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
}

const TABS: { key: ReportTab; label: string; icon: string }[] = [
  {
    key: "daily",
    label: "Daily Report",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    key: "sales",
    label: "Sales Report",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    key: "purchase",
    label: "Purchase Report",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    key: "vendor",
    label: "Vendor Report",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    key: "product",
    label: "Product Report",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Component ────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("daily");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  // For vendor/product filters
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  // Abort controllers to cancel in-flight requests on tab switch
  const abortRef = useRef<AbortController | null>(null);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  // Fetch vendor/product lists for filters
  useEffect(() => {
    fetch("/api/tenant/vendors")
      .then((r) => r.json())
      .then((d) => setVendors(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/tenant/products")
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchReport = useCallback(async () => {
    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const tabAtStart = activeTab;

    setLoading(true);
    setError("");
    setReportData(null);

    let url = `/api/tenant/reports/${activeTab}?startDate=${startDate}&endDate=${endDate}`;
    if (activeTab === "vendor" && selectedVendor)
      url += `&vendorId=${selectedVendor}`;
    if (activeTab === "product" && selectedProduct)
      url += `&productId=${selectedProduct}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch report");
      }
      const data = await res.json();
      // Only update state if the user hasn't switched tabs
      if (activeTabRef.current === tabAtStart) {
        setReportData(data);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (activeTabRef.current === tabAtStart) {
        setError(e instanceof Error ? e.message : "Failed to fetch report");
      }
    } finally {
      if (activeTabRef.current === tabAtStart) {
        setLoading(false);
      }
    }
  }, [activeTab, startDate, endDate, selectedVendor, selectedProduct]);

  const downloadPdf = async () => {
    const controller = new AbortController();
    const tabAtStart = activeTab;
    setPdfLoading(true);
    let url = `/api/tenant/reports/${activeTab}?startDate=${startDate}&endDate=${endDate}&format=pdf`;
    if (activeTab === "vendor" && selectedVendor)
      url += `&vendorId=${selectedVendor}`;
    if (activeTab === "product" && selectedProduct)
      url += `&productId=${selectedProduct}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${activeTab}_report_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (activeTabRef.current === tabAtStart) {
        setError("Failed to download PDF");
      }
    } finally {
      if (activeTabRef.current === tabAtStart) {
        setPdfLoading(false);
      }
    }
  };

  // Reset filters and cancel in-flight requests when switching tabs
  useEffect(() => {
    abortRef.current?.abort();
    setReportData(null);
    setError("");
    setLoading(false);
    setPdfLoading(false);
    setSelectedVendor("");
    setSelectedProduct("");
  }, [activeTab]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Reports</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Generate and download business reports
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d={tab.icon}
              />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>

          {activeTab === "vendor" && (
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">
                Vendor (optional)
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 min-w-[180px]"
              >
                <option value="">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "product" && (
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">
                Product (optional)
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 min-w-[180px]"
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    className="opacity-75"
                  />
                </svg>
                Loading…
              </span>
            ) : (
              "Generate Report"
            )}
          </button>

          {reportData && (
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {pdfLoading ? "Generating PDF…" : "Download PDF"}
            </button>
          )}
        </div>

        {/* Quick date presets */}
        <div className="flex gap-2 mt-3">
          {[
            {
              label: "Today",
              fn: () => {
                setStartDate(todayStr());
                setEndDate(todayStr());
              },
            },
            {
              label: "Yesterday",
              fn: () => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const d = y.toISOString().split("T")[0];
                setStartDate(d);
                setEndDate(d);
              },
            },
            {
              label: "Last 7 Days",
              fn: () => {
                const e = new Date();
                const s = new Date();
                s.setDate(s.getDate() - 6);
                setStartDate(s.toISOString().split("T")[0]);
                setEndDate(e.toISOString().split("T")[0]);
              },
            },
            {
              label: "This Month",
              fn: () => {
                const now = new Date();
                const s = new Date(now.getFullYear(), now.getMonth(), 1);
                setStartDate(s.toISOString().split("T")[0]);
                setEndDate(now.toISOString().split("T")[0]);
              },
            },
            {
              label: "Last Month",
              fn: () => {
                const now = new Date();
                const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const e = new Date(now.getFullYear(), now.getMonth(), 0);
                setStartDate(s.toISOString().split("T")[0]);
                setEndDate(e.toISOString().split("T")[0]);
              },
            },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={preset.fn}
              className="px-3 py-1 text-xs text-stone-500 bg-stone-50 rounded-md hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          {activeTab === "daily" && <DailyReportView data={reportData} />}
          {activeTab === "sales" && <SalesReportView data={reportData} />}
          {activeTab === "purchase" && (
            <PurchaseReportView data={reportData} />
          )}
          {activeTab === "vendor" && <VendorReportView data={reportData} />}
          {activeTab === "product" && <ProductReportView data={reportData} />}
        </div>
      )}

      {/* Empty state */}
      {!reportData && !loading && !error && (
        <div className="bg-white rounded-xl border border-stone-200 p-16 text-center">
          <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="text-stone-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">
            Select a report type and date range
          </h3>
          <p className="text-xs text-stone-400">
            Choose the dates and click &quot;Generate Report&quot; to view the
            data
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xl font-bold text-stone-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────
function DataTable({
  title,
  headers,
  rows,
  footerRow,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  footerRow?: (string | number)[];
}) {
  if (!rows.length) return null;
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100">
        <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide ${
                    i > 0 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-t border-stone-100 hover:bg-stone-50"
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-4 py-2.5 text-stone-700 ${
                      j > 0 ? "text-right" : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footerRow && (
            <tfoot>
              <tr className="border-t-2 border-stone-200 bg-stone-50 font-semibold">
                {footerRow.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-4 py-2.5 text-stone-900 ${
                      j > 0 ? "text-right" : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ─── Daily Report View ────────────────────────────────────────────
function DailyReportView({ data }: { data: any }) {
  const s = data.sales;
  const p = data.purchases;
  const cg = data.creditGiven;
  const cc = data.creditCollected;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Sales"
          value={`₹${fmt(s.totalSales)}`}
          sub={`${s.count} transactions`}
        />
        <SummaryCard
          label="Total Purchases"
          value={`₹${fmt(p.totalPurchases)}`}
          sub={`${p.count} transactions`}
        />
        <SummaryCard
          label="Credit Given"
          value={`₹${fmt(cg.totalCreditGiven)}`}
          sub={`${cg.count} transactions`}
        />
        <SummaryCard
          label="Credit Collected"
          value={`₹${fmt(cc.totalCollected)}`}
          sub={`Cash: ₹${fmt(cc.cashCollected)} | Online: ₹${fmt(cc.onlineCollected)}`}
        />
        <SummaryCard
          label="Total Cash Collection"
          value={`₹${fmt(data.totalCashCollection)}`}
          sub={`Sale Cash + Credit Cash`}
        />
        <SummaryCard
          label="Total Online Collection"
          value={`₹${fmt(data.totalOnlineCollection)}`}
          sub={`Sale Online + Credit Online`}
        />
        <SummaryCard
          label="Sales Received"
          value={`₹${fmt(s.totalPaid)}`}
          sub={`Due: ₹${fmt(s.totalDue)}`}
        />
        <SummaryCard
          label="Purchase Paid"
          value={`₹${fmt(p.totalPaid)}`}
          sub={`Due: ₹${fmt(p.totalDue)}`}
        />
      </div>

      <DataTable
        title="Category-wise Sales"
        headers={["Category", "Quantity", "Amount (₹)"]}
        rows={
          data.categoryWiseSale?.map((c: any) => [
            c._id,
            c.totalQuantity,
            fmt(c.totalAmount),
          ]) || []
        }
        footerRow={
          data.categoryWiseSale?.length
            ? [
                "Total",
                data.categoryWiseSale.reduce(
                  (a: number, c: any) => a + c.totalQuantity,
                  0
                ),
                fmt(
                  data.categoryWiseSale.reduce(
                    (a: number, c: any) => a + c.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Product-wise Sales"
        headers={["Product", "Quantity", "Amount (₹)"]}
        rows={
          data.productWiseSale?.map((p: any) => [
            p.productName,
            p.totalQuantity,
            fmt(p.totalAmount),
          ]) || []
        }
        footerRow={
          data.productWiseSale?.length
            ? [
                "Total",
                data.productWiseSale.reduce(
                  (a: number, p: any) => a + p.totalQuantity,
                  0
                ),
                fmt(
                  data.productWiseSale.reduce(
                    (a: number, p: any) => a + p.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Credit Given to Customers"
        headers={["Customer", "Transactions", "Amount (₹)"]}
        rows={
          data.creditGivenByCustomer?.map((c: any) => [
            c.customerName || "Unknown",
            c.count,
            fmt(c.totalCredit),
          ]) || []
        }
        footerRow={
          data.creditGivenByCustomer?.length
            ? [
                "Total",
                data.creditGivenByCustomer.reduce(
                  (a: number, c: any) => a + c.count,
                  0
                ),
                fmt(
                  data.creditGivenByCustomer.reduce(
                    (a: number, c: any) => a + c.totalCredit,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Credit Received from Customers"
        headers={["Customer", "Transactions", "Cash (₹)", "Online (₹)", "Total (₹)"]}
        rows={
          data.creditReceivedByCustomer?.map((c: any) => [
            c.customerName || "Unknown",
            c.count,
            fmt(c.cashReceived),
            fmt(c.onlineReceived),
            fmt(c.totalReceived),
          ]) || []
        }
        footerRow={
          data.creditReceivedByCustomer?.length
            ? [
                "Total",
                data.creditReceivedByCustomer.reduce(
                  (a: number, c: any) => a + c.count,
                  0
                ),
                fmt(
                  data.creditReceivedByCustomer.reduce(
                    (a: number, c: any) => a + c.cashReceived,
                    0
                  )
                ),
                fmt(
                  data.creditReceivedByCustomer.reduce(
                    (a: number, c: any) => a + c.onlineReceived,
                    0
                  )
                ),
                fmt(
                  data.creditReceivedByCustomer.reduce(
                    (a: number, c: any) => a + c.totalReceived,
                    0
                  )
                ),
              ]
            : undefined
        }
      />
    </>
  );
}

// ─── Sales Report View ────────────────────────────────────────────
function SalesReportView({ data }: { data: any }) {
  const s = data.summary;
  const pm = data.paymentMode;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Sales"
          value={`₹${fmt(s.totalSales)}`}
          sub={`${s.count} invoices`}
        />
        <SummaryCard
          label="Amount Received"
          value={`₹${fmt(s.totalPaid)}`}
        />
        <SummaryCard label="Outstanding" value={`₹${fmt(s.totalDue)}`} />
        <SummaryCard
          label="Discount Given"
          value={`₹${fmt(s.totalDiscount)}`}
        />
      </div>

      <DataTable
        title="Payment Collection by Mode"
        headers={["Payment Mode", "Amount (₹)", "% of Total"]}
        rows={[
          [
            "Cash",
            fmt(pm.cash),
            s.totalSales
              ? `${((pm.cash / s.totalSales) * 100).toFixed(1)}%`
              : "0.0%",
          ],
          [
            "Online / UPI",
            fmt(pm.online),
            s.totalSales
              ? `${((pm.online / s.totalSales) * 100).toFixed(1)}%`
              : "0.0%",
          ],
          [
            "Credit",
            fmt(pm.credit),
            s.totalSales
              ? `${((pm.credit / s.totalSales) * 100).toFixed(1)}%`
              : "0.0%",
          ],
        ]}
        footerRow={["Total", fmt(pm.cash + pm.online + pm.credit), "100%"]}
      />

      <DataTable
        title="Category-wise Sales"
        headers={["Category", "Quantity", "Amount (₹)"]}
        rows={
          data.categoryWiseSale?.map((c: any) => [
            c._id,
            c.totalQuantity,
            fmt(c.totalAmount),
          ]) || []
        }
        footerRow={
          data.categoryWiseSale?.length
            ? [
                "Total",
                data.categoryWiseSale.reduce(
                  (a: number, c: any) => a + c.totalQuantity,
                  0
                ),
                fmt(
                  data.categoryWiseSale.reduce(
                    (a: number, c: any) => a + c.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Product-wise Sales"
        headers={["Product", "Quantity", "Discount (₹)", "Amount (₹)"]}
        rows={
          data.productWiseSale?.map((p: any) => [
            p.productName,
            p.totalQuantity,
            fmt(p.totalDiscount),
            fmt(p.totalAmount),
          ]) || []
        }
        footerRow={
          data.productWiseSale?.length
            ? [
                "Total",
                data.productWiseSale.reduce(
                  (a: number, p: any) => a + p.totalQuantity,
                  0
                ),
                fmt(
                  data.productWiseSale.reduce(
                    (a: number, p: any) => a + (p.totalDiscount || 0),
                    0
                  )
                ),
                fmt(
                  data.productWiseSale.reduce(
                    (a: number, p: any) => a + p.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Day-wise Breakdown"
        headers={["Date", "Sales Count", "Amount (₹)"]}
        rows={
          data.dailyBreakdown?.map((d: any) => [
            new Date(d._id).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            d.count,
            fmt(d.totalAmount),
          ]) || []
        }
        footerRow={
          data.dailyBreakdown?.length
            ? [
                "Total",
                data.dailyBreakdown.reduce(
                  (a: number, d: any) => a + d.count,
                  0
                ),
                fmt(
                  data.dailyBreakdown.reduce(
                    (a: number, d: any) => a + d.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />
    </>
  );
}

// ─── Purchase Report View ─────────────────────────────────────────
function PurchaseReportView({ data }: { data: any }) {
  const s = data.summary;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Purchases"
          value={`₹${fmt(s.totalPurchases)}`}
          sub={`${s.count} invoices`}
        />
        <SummaryCard label="Amount Paid" value={`₹${fmt(s.totalPaid)}`} />
        <SummaryCard label="Outstanding" value={`₹${fmt(s.totalDue)}`} />
        <SummaryCard label="Tax" value={`₹${fmt(s.totalTax)}`} />
      </div>

      <DataTable
        title="Vendor-wise Purchases"
        headers={[
          "Vendor",
          "Invoices",
          "Amount (₹)",
          "Paid (₹)",
          "Due (₹)",
        ]}
        rows={
          data.vendorWisePurchase?.map((v: any) => [
            v.vendorName,
            v.count,
            fmt(v.totalAmount),
            fmt(v.totalPaid),
            fmt(v.totalDue),
          ]) || []
        }
        footerRow={
          data.vendorWisePurchase?.length
            ? [
                "Total",
                data.vendorWisePurchase.reduce(
                  (a: number, v: any) => a + v.count,
                  0
                ),
                fmt(
                  data.vendorWisePurchase.reduce(
                    (a: number, v: any) => a + v.totalAmount,
                    0
                  )
                ),
                fmt(
                  data.vendorWisePurchase.reduce(
                    (a: number, v: any) => a + v.totalPaid,
                    0
                  )
                ),
                fmt(
                  data.vendorWisePurchase.reduce(
                    (a: number, v: any) => a + v.totalDue,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Category-wise Purchases"
        headers={["Category", "Quantity", "Amount (₹)"]}
        rows={
          data.categoryWisePurchase?.map((c: any) => [
            c._id,
            c.totalQuantity,
            fmt(c.totalAmount),
          ]) || []
        }
        footerRow={
          data.categoryWisePurchase?.length
            ? [
                "Total",
                data.categoryWisePurchase.reduce(
                  (a: number, c: any) => a + c.totalQuantity,
                  0
                ),
                fmt(
                  data.categoryWisePurchase.reduce(
                    (a: number, c: any) => a + c.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Product-wise Purchases"
        headers={["Product", "Quantity", "Amount (₹)"]}
        rows={
          data.productWisePurchase?.map((p: any) => [
            p.productName,
            p.totalQuantity,
            fmt(p.totalAmount),
          ]) || []
        }
        footerRow={
          data.productWisePurchase?.length
            ? [
                "Total",
                data.productWisePurchase.reduce(
                  (a: number, p: any) => a + p.totalQuantity,
                  0
                ),
                fmt(
                  data.productWisePurchase.reduce(
                    (a: number, p: any) => a + p.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />

      <DataTable
        title="Day-wise Breakdown"
        headers={["Date", "Purchase Count", "Amount (₹)"]}
        rows={
          data.dailyBreakdown?.map((d: any) => [
            new Date(d._id).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            d.count,
            fmt(d.totalAmount),
          ]) || []
        }
        footerRow={
          data.dailyBreakdown?.length
            ? [
                "Total",
                data.dailyBreakdown.reduce(
                  (a: number, d: any) => a + d.count,
                  0
                ),
                fmt(
                  data.dailyBreakdown.reduce(
                    (a: number, d: any) => a + d.totalAmount,
                    0
                  )
                ),
              ]
            : undefined
        }
      />
    </>
  );
}

// ─── Vendor Report View ───────────────────────────────────────────
function VendorReportView({ data }: { data: any }) {
  return (
    <>
      <DataTable
        title="Vendor Purchase Summary"
        headers={[
          "Vendor",
          "Invoices",
          "Purchases (₹)",
          "Paid (₹)",
          "Due (₹)",
        ]}
        rows={
          data.purchases.summary?.map((v: any) => [
            v.vendorName || "Unknown",
            v.count,
            fmt(v.totalPurchases),
            fmt(v.totalPaid),
            fmt(v.totalDue),
          ]) || []
        }
      />

      <DataTable
        title="Vendor Sales Allocation (Stock Sold from Vendor)"
        headers={["Vendor", "Qty Sold", "Sale Value (₹)"]}
        rows={
          data.sales.summary?.map((v: any) => [
            v.vendorName || "Unknown",
            v.totalQuantitySold,
            fmt(v.totalSaleAmount),
          ]) || []
        }
      />

      <DataTable
        title="Product-wise Purchases by Vendor"
        headers={["Vendor", "Product", "Quantity", "Amount (₹)"]}
        rows={
          data.purchases.productWise?.map((p: any) => [
            p.vendorName || "Unknown",
            p.productName || "Unknown",
            p.totalQuantity,
            fmt(p.totalAmount),
          ]) || []
        }
      />

      <DataTable
        title="Product-wise Sales by Vendor"
        headers={["Vendor", "Product", "Quantity", "Amount (₹)"]}
        rows={
          data.sales.productWise?.map((p: any) => [
            p.vendorName || "Unknown",
            p.productName || "Unknown",
            p.totalQuantity,
            fmt(p.totalAmount),
          ]) || []
        }
      />

      <DataTable
        title="Category-wise Purchases by Vendor"
        headers={["Vendor", "Category", "Quantity", "Amount (₹)"]}
        rows={
          data.purchases.categoryWise?.map((c: any) => [
            c.vendorName || "Unknown",
            c._id?.category || c._id,
            c.totalQuantity,
            fmt(c.totalAmount),
          ]) || []
        }
      />

      <DataTable
        title="Category-wise Sales by Vendor"
        headers={["Vendor", "Category", "Quantity", "Amount (₹)"]}
        rows={
          data.sales.categoryWise?.map((c: any) => [
            c.vendorName || "Unknown",
            c._id?.category || c._id,
            c.totalQuantity,
            fmt(c.totalAmount),
          ]) || []
        }
      />
    </>
  );
}

// ─── Product Report View ──────────────────────────────────────────
function ProductReportView({ data }: { data: any }) {
  const s = data.summary;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard label="Total Products" value={`${s.totalProducts}`} />
        <SummaryCard
          label="Total Sales"
          value={`₹${fmt(s.totalSaleAmount)}`}
          sub={`${s.totalQuantitySold} units sold`}
        />
        <SummaryCard
          label="Total Purchases"
          value={`₹${fmt(s.totalPurchaseAmount)}`}
          sub={`${s.totalQuantityPurchased} units purchased`}
        />
      </div>

      <DataTable
        title="Product-wise Details"
        headers={[
          "Product",
          "Category",
          "Brand",
          "Stock",
          "Sold",
          "Sale Amt (₹)",
          "Purchased",
          "Purchase Amt (₹)",
        ]}
        rows={
          data.products?.map((p: any) => [
            p.productName,
            p.category,
            p.brand,
            p.currentStock,
            p.totalQuantitySold,
            fmt(p.totalSaleAmount),
            p.totalQuantityPurchased,
            fmt(p.totalPurchaseAmount),
          ]) || []
        }
        footerRow={
          data.products?.length
            ? [
                "Total",
                "",
                "",
                data.products.reduce(
                  (a: number, p: any) => a + p.currentStock,
                  0
                ),
                s.totalQuantitySold,
                fmt(s.totalSaleAmount),
                s.totalQuantityPurchased,
                fmt(s.totalPurchaseAmount),
              ]
            : undefined
        }
      />
    </>
  );
}
