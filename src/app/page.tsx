import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liquor Billing Software | Liquor Billing POS for Stores and Bars",
  description:
    "Liquor Billing is professional liquor billing software with POS billing, inventory control, customer and vendor management, and financial reporting for liquor stores, bars, and distributors.",
  keywords: [
    "liquor billing",
    "liquor billing software",
    "liquor billing pos",
    "liquor store pos",
    "bar billing software",
    "inventory billing software",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Liquor Billing Software | Fast POS and Billing for Liquor Stores",
    description:
      "Grow faster with liquor billing POS software built for sales, inventory, and financial accuracy.",
    url: "https://liquorbilling.in",
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
  twitter: {
    card: "summary_large_image",
    title: "Liquor Billing | Liquor Billing POS Software",
    description:
      "Complete liquor billing software with POS, stock management, and finance tools.",
    images: ["/icon_512X512.svg"],
  },
};

export default function HomePage() {
  const faqItems = [
    {
      q: "What is Liquor Billing exactly?",
      a: "Liquor Billing is a cloud-based POS and management software specifically designed for liquor stores, bars, and distributors. It combines sales billing, inventory management, financial tracking, and team collaboration in one platform.",
    },
    {
      q: "How is Liquor Billing different from other POS systems?",
      a: "We're built specifically for the liquor business. Multi-vendor inventory tracking, vendor priority allocation, role-based access, compliance-ready audit logs, and liquor-specific reporting set us apart.",
    },
    {
      q: "Is my data secure and private?",
      a: "Yes. Each organization has a completely isolated workspace. We use enterprise-grade encryption, SSL/TLS for all data in transit, regular security audits, and comply with data protection standards.",
    },
    {
      q: "Can I try Liquor Billing for free?",
      a: "Absolutely! All plans come with a 14-day free trial. No credit card required. Full access to all features—try everything before committing.",
    },
    {
      q: "How does billing and pricing work?",
      a: "We offer flexible monthly plans starting at $25/month. You're billed monthly. Cancel anytime. Enterprise customers get custom pricing with dedicated support.",
    },
    {
      q: "What support do you offer?",
      a: "We provide email support for all plans, live chat for Professional & Enterprise, comprehensive documentation, video tutorials, and onboarding assistance.",
    },
  ];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Liquor Billing",
    url: "https://liquorbilling.in",
    logo: "https://liquorbilling.in/icon_512X512.svg",
    email: "sales@bytewiseconsulting.in",
    telephone: "+91-8332936831",
    sameAs: ["https://www.bytewiseconsulting.in"],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Liquor Billing",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Liquor billing software and liquor billing POS platform for billing, inventory, finance, and reporting.",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "25",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Professional",
        price: "50",
        priceCurrency: "USD",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 50%, #F8FAFF 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .btn-primary { background: linear-gradient(135deg, #2563EB, #0EA5E9); transition: all 0.2s; box-shadow: 0 4px 20px rgba(37,99,235,0.25); }
        .btn-primary:hover { box-shadow: 0 6px 28px rgba(37,99,235,0.35); transform: translateY(-1px); }
        .card-hover { transition: all 0.2s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(37,99,235,0.12); }
      `}</style>

      <nav className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-10 lg:py-5 bg-white/70 backdrop-blur-md border-b border-blue-100/80 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Image src="/icon_512X512.svg" alt="Liquor Billing logo" width={32} height={32} className="h-8 w-8 rounded-md bg-white ring-1 ring-blue-100 p-1" />
          <span style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg sm:text-xl font-bold text-blue-700 tracking-tight">Liquor Billing</span>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/login" className="px-3 py-2 sm:px-5 text-xs sm:text-sm font-medium text-slate-600 hover:text-blue-700 border border-slate-200 rounded-full hover:border-blue-300 transition-all bg-white whitespace-nowrap">Sign in</Link>
          <Link href="/register" className="btn-primary px-3 py-2 sm:px-5 text-xs sm:text-sm font-semibold text-white rounded-full whitespace-nowrap">Get started</Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center flex-1 px-4 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-semibold text-blue-700 rounded-full bg-blue-50 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
          Multi-tenant SaaS platform
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight text-slate-900 max-w-4xl mb-6">
          Liquor Billing Software<br />
          <span style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>for fast, accurate POS billing.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 max-w-xl mb-10 leading-relaxed font-light">
          Liquor Billing POS gives your team a dedicated workspace with user management, role-based access, inventory control, and powerful finance tools in one place.
        </p>
        <div className="flex w-full max-w-md sm:max-w-none sm:w-auto flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/register" className="btn-primary px-8 py-3.5 text-base font-semibold text-white rounded-full text-center">Create your workspace →</Link>
          <Link href="/request" className="px-8 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:border-blue-300 hover:text-blue-700 transition-all text-center">Request access</Link>
        </div>
      </section>

      <section id="features" className="px-4 py-16 sm:px-6 lg:px-10 lg:py-20 border-t border-blue-100 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">Features</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-center text-slate-900 mb-12">Everything your team needs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🏢", title: "Multi-tenant", desc: "Each organization gets their own isolated workspace and subdomain.", color: "#EEF2FF" },
              { icon: "🔐", title: "Role-based access", desc: "Owners, admins, and members — each with the right level of access.", color: "#F0F9FF" },
              { icon: "⚡", title: "Instant setup", desc: "Workspaces are provisioned instantly after admin approval.", color: "#EDE9FE" },
            ].map((f) => (
              <div key={f.title} className="card-hover p-7 rounded-2xl border border-blue-100 h-full" style={{ background: f.color }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-10 lg:py-20 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center items-stretch">
            <div className="card-hover p-8 rounded-2xl bg-white border border-blue-100 h-full">
              <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl font-bold text-blue-700 mb-2">500+</h3>
              <p className="text-slate-600">Liquor businesses trust us</p>
            </div>
            <div className="card-hover p-8 rounded-2xl bg-white border border-blue-100 h-full">
              <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl font-bold text-blue-700 mb-2">10K+</h3>
              <p className="text-slate-600">Daily transactions processed</p>
            </div>
            <div className="card-hover p-8 rounded-2xl bg-white border border-blue-100 h-full">
              <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl font-bold text-blue-700 mb-2">99.9%</h3>
              <p className="text-slate-600">Platform uptime guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases / Benefits Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-10 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">What You Can Do</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-center text-slate-900 mb-6">Built for Modern Liquor Businesses</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">From seamless sales billing to precise inventory tracking, manage every aspect of your liquor business with our comprehensive POS software.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "📊", title: "Sales & POS Billing", desc: "Lightning-fast liquor billing with item-level tracking, customer discounts, and instant receipts." },
              { icon: "📦", title: "Multi-Vendor Inventory", desc: "Track stock across multiple vendors with priority-based allocation and real-time adjustments." },
              { icon: "💰", title: "Financial Management", desc: "Complete cashbook, ledger entries, expense tracking, and customer credit management in one place." },
              { icon: "👥", title: "Team Management", desc: "Assign role-based access to owners, managers, staff with complete audit trails of all activities." },
              { icon: "📈", title: "Powerful Reporting", desc: "Sales reports, customer ledgers, vendor analysis, and business metrics at your fingertips." },
              { icon: "🔒", title: "Enterprise Security", desc: "Multi-tenant isolation, encrypted workspace, role-based permissions, and compliance-ready audit logs." },
            ].map((item) => (
              <div key={item.title} className="card-hover p-6 rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 h-full">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-10 lg:py-20 bg-linear-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">Getting Started</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-center text-slate-900 mb-12">Get Running in Minutes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            {[
              { num: "01", title: "Create Workspace", desc: "Sign up and create your liquor business workspace instantly" },
              { num: "02", title: "Add Your Team", desc: "Invite team members and assign roles and permissions" },
              { num: "03", title: "Setup Products", desc: "Add your liquor products and vendor information" },
              { num: "04", title: "Start Selling", desc: "Begin processing sales, inventory, and transactions" },
            ].map((step, idx) => (
              <div key={step.num} className="relative h-full">
                <div className="card-hover p-6 rounded-2xl border border-blue-200 bg-white text-center h-full">
                  <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-blue-700 mb-3">{step.num}</div>
                  <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
                {idx < 3 && <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-blue-300 transform -translate-y-1/2"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Comparison Section */}
      <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-10 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">Plans</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-center text-slate-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-slate-600 mb-12">Choose the perfect plan for your liquor billing needs. Scale as you grow.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "$25",
                period: "/month",
                desc: "Perfect for small liquor stores",
                features: [
                  "POS Sales Billing",
                  "Basic Inventory",
                  "Up to 5 team members",
                  "Customer profiles",
                  "Basic reports (4-5 days SLA)",
                ],
                cta: "Start Free Trial",
              },
              {
                name: "Professional",
                price: "$50",
                period: "/month",
                desc: "For growing liquor businesses",
                features: [
                  "Everything in Starter",
                  "Advanced Inventory",
                  "Up to 15 team members",
                  "Financial dashboards",
                  "Advanced reporting",
                ],
                cta: "Start Free Trial",
                highlighted: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "For large distributors",
                features: [
                  "Everything in Professional",
                  "Unlimited team members",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantee",
                ],
                cta: "Request Demo",
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card-hover rounded-2xl border-2 p-8 transition-all ${
                  plan.highlighted
                    ? "border-blue-700 bg-blue-50 ring-2 ring-blue-200 ring-offset-2"
                    : "border-blue-100 bg-white"
                } h-full flex flex-col`}
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-600 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-blue-700">{plan.price}</span>
                  <span className="text-slate-600 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">✓</span>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`mt-auto w-full py-2.5 px-4 rounded-full font-semibold transition-all ${
                  plan.highlighted
                    ? "btn-primary text-white"
                    : "border border-blue-300 text-blue-700 hover:bg-blue-50"
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-10 lg:py-20 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">Success Stories</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-center text-slate-900 mb-12">Loved by Liquor Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "Liquor Billing transformed how we manage sales and inventory. No more spreadsheets, just accurate real-time data.",
                author: "Rajesh Patel",
                role: "Owner, Premium Liquor Store",
                rating: 5,
              },
              {
                quote: "The role-based access and audit trails give us complete control over our team. We've reduced billing errors by 95%.",
                author: "Priya Sharma",
                role: "Manager, City Liquor Distributors",
                rating: 5,
              },
              {
                quote: "Setup took 15 minutes and we were processing sales instantly. Customer service is phenomenal. Highly recommend!",
                author: "Amit Verma",
                role: "Owner, Bar & Lounge",
                rating: 5,
              },
            ].map((testimonial) => (
              <div key={testimonial.author} className="card-hover p-8 rounded-2xl bg-white border border-blue-100 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className="text-amber-400">⭐</span>
                    ))}
                </div>
                <p className="text-slate-700 mb-4 italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="mt-auto">
                  <p className="font-semibold text-slate-900">{testimonial.author}</p>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-4 py-16 sm:px-6 lg:px-10 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold text-blue-500 uppercase tracking-widest mb-3">Questions?</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-bold text-center text-slate-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group border border-blue-100 rounded-xl overflow-hidden bg-white cursor-pointer hover:border-blue-300 transition-colors"
              >
                <summary className="p-6 flex items-center justify-between font-semibold text-slate-900 hover:bg-blue-50">
                  {item.q}
                  <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-blue-100">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-10 lg:py-24 bg-linear-to-r from-blue-700 via-blue-600 to-indigo-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl sm:text-4xl font-bold mb-4">Ready to transform your liquor business?</h2>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">Join 500+ liquor stores already using Liquor Billing to streamline operations and boost profitability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <Link href="/register" className="bg-white text-blue-700 px-8 py-3.5 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl">
              Start Free Trial Today →
            </Link>
            <Link href="/request" className="border-2 border-white text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white hover:bg-opacity-10 transition-all">
              Schedule a Demo
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-8">No credit card required. 14-day free trial. Full access to all features.</p>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="px-4 py-14 sm:px-6 lg:px-10 lg:py-16 bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icon_512X512.svg" alt="Liquor Billing logo" width={28} height={28} className="h-7 w-7 rounded-md bg-white ring-1 ring-slate-600 p-1" />
                <h3 style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg font-bold text-white">Liquor Billing</h3>
              </div>
              <p className="text-sm leading-relaxed">Complete SaaS platform for liquor billing, POS, and inventory management. Built for modern liquor businesses.</p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/liquor-billing-software" className="hover:text-blue-400 transition">Liquor Billing Software</Link></li>
                <li><Link href="#features" className="hover:text-blue-400 transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-blue-400 transition">Pricing</Link></li>
                <li><Link href="#faq" className="hover:text-blue-400 transition">FAQ</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Security</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-blue-400 transition">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition">Careers</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-white mb-4">Get in Touch</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <a href="tel:8332936831" className="hover:text-blue-400 transition">833-293-6831</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>✉️</span>
                  <a href="mailto:sales@bytewiseconsulting.in" className="hover:text-blue-400 transition">sales@bytewiseconsulting.in</a>
                </li>
                <li className="text-xs text-slate-400 mt-4">Available Mon-Fri, 9AM-6PM IST</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
              <p className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>© {new Date().getFullYear()} Liquor Billing. All rights reserved.</span>
                <span className="text-slate-500">|</span>
                <Link href="/privacy-policy" className="hover:text-blue-400">Privacy Policy</Link>
                <span className="text-slate-500">|</span>
                <Link href="/terms-of-service" className="hover:text-blue-400">Terms of Service</Link>
              </p>
              <p className="text-xs text-slate-500">
                Developed by <a href="https://www.bytewiseconsulting.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold">BYTEWISECONSULTING.IN</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
