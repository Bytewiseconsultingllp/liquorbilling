import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Liquor Billing",
  description: "Privacy Policy for Liquor Billing software and liquor billing POS platform.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
          <Image src="/icon_512X512.svg" alt="Liquor Billing logo" width={24} height={24} className="h-6 w-6" />
          Liquor Billing
        </Link>
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mb-4 text-slate-600">Last updated: March 19, 2026</p>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Information We Collect</h2>
          <p className="text-slate-700">
            We collect account details, business information, billing data, and usage analytics necessary to provide
            Liquor Billing software and support services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">How We Use Data</h2>
          <p className="text-slate-700">
            We use data to operate and improve the liquor billing POS platform, process transactions, provide support,
            secure accounts, and comply with legal obligations.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Data Security</h2>
          <p className="text-slate-700">
            We apply technical and organizational safeguards including encryption, role-based access control, and
            monitoring to protect your data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Contact Us</h2>
          <p className="text-slate-700">Phone: 8332936831</p>
          <p className="text-slate-700">Email: sales@bytewiseconsulting.in</p>
        </section>
      </div>
    </main>
  );
}
