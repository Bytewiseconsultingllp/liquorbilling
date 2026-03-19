import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liquor Billing Software | Complete POS and Inventory Management",
  description:
    "Professional liquor billing software for stores, bars, and distributors. Manage POS sales, inventory, vendor purchases, customer credits, and financial reports.",
  keywords: [
    "liquor billing software",
    "liquor billing",
    "liquor billing pos",
    "liquor pos software",
    "liquor inventory software",
  ],
  alternates: {
    canonical: "/liquor-billing-software",
  },
  openGraph: {
    title: "Liquor Billing Software | POS, Billing and Inventory Platform",
    description:
      "Cloud-based liquor billing software with role-based access, advanced inventory, and finance management.",
    url: "https://liquorbilling.in/liquor-billing-software",
    siteName: "Liquor Billing",
    images: [
      {
        url: "/icon_512X512.svg",
        width: 512,
        height: 512,
        alt: "Liquor Billing logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function LiquorBillingSoftwarePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
        >
          <Image src="/icon_512X512.svg" alt="Liquor Billing logo" width={24} height={24} className="h-6 w-6" />
          Liquor Billing
        </Link>

        <h1 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
          Liquor Billing Software for Modern Liquor Businesses
        </h1>
        <p className="mb-8 text-lg text-slate-600">
          Liquor Billing Software is designed for liquor stores, bars, and distributors that need fast POS billing,
          accurate inventory control, and complete financial visibility.
        </p>

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Fast Liquor Billing POS</h2>
            <p className="text-slate-700">
              Process sales quickly with reliable liquor billing POS workflows, customer profiles, and discount controls.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Inventory and Vendor Tracking</h2>
            <p className="text-slate-700">
              Monitor stock by vendor, avoid stock-outs, and keep your inventory accurate across all transactions.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Finance and Credit Management</h2>
            <p className="text-slate-700">
              Track cashbook entries, credit payments, and expense flows to maintain healthy business operations.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Role-Based Team Access</h2>
            <p className="text-slate-700">
              Give each user the right permissions and keep audit-ready logs for better security and accountability.
            </p>
          </article>
        </section>

        <section className="rounded-xl bg-blue-700 p-6 text-white sm:p-8">
          <h2 className="mb-3 text-2xl font-semibold">Start using Liquor Billing Software</h2>
          <p className="mb-6 text-blue-100">
            Launch your liquor billing POS in minutes and manage billing, inventory, and finance in one place.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="rounded-full bg-white px-6 py-3 text-center font-semibold text-blue-700">
              Create Workspace
            </Link>
            <Link href="/request" className="rounded-full border border-white px-6 py-3 text-center font-semibold text-white">
              Request Access
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
