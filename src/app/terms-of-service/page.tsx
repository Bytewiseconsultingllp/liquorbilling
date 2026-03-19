import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Liquor Billing",
  description: "Terms of Service for Liquor Billing software and liquor billing POS platform.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
          <Image src="/icon_512X512.svg" alt="Liquor Billing logo" width={24} height={24} className="h-6 w-6" />
          Liquor Billing
        </Link>
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mb-4 text-slate-600">Last updated: March 19, 2026</p>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Service Use</h2>
          <p className="text-slate-700">
            Liquor Billing provides cloud software for liquor billing, POS, inventory, and business operations.
            You are responsible for lawful use of the service and account security.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Billing and Subscription</h2>
          <p className="text-slate-700">
            Paid plans are billed monthly according to your selected plan. Custom enterprise pricing is available on request.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Limitation of Liability</h2>
          <p className="text-slate-700">
            To the extent permitted by law, BYTEWISECONSULTING.IN is not liable for indirect, incidental, or consequential
            damages arising from service use.
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
