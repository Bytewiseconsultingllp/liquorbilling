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
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/icon_512X512.svg" alt="Liquor Billing logo" width={30} height={30} className="h-8 w-8" />
            <span className="text-lg font-bold text-slate-900">Liquor Billing</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 sm:px-5 sm:text-sm">
              Sign in
            </Link>
            <Link href="/register" className="rounded-full bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 sm:px-5 sm:text-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <div className="px-4 py-12 sm:px-6 lg:px-10">
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
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} Liquor Billing. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/privacy-policy" className="hover:text-blue-700">Privacy Policy</Link>
            <span className="text-slate-400">|</span>
            <Link href="/terms-of-service" className="hover:text-blue-700">Terms of Service</Link>
            <span className="text-slate-400">|</span>
            <a href="tel:8332936831" className="hover:text-blue-700">8332936831</a>
            <span className="text-slate-400">|</span>
            <a href="mailto:sales@bytewiseconsulting.in" className="hover:text-blue-700">sales@bytewiseconsulting.in</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
