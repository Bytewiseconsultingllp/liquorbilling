import { connectDB } from "@/db/connection";
import { Providers } from "./clientWrapper";
import { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://liquorbilling.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Liquor Billing",
  title: "Liquor Billing | Multi-Tenant SaaS for Liquor POS & Billing Software",
  description: "Cloud-based liquor billing software with POS system, inventory management, financial tracking, sales billing, and role-based team access for liquor stores and distributors.",
  keywords: [
    "liquor billing",
    "liquor billing software",
    "liquor billing pos",
    "liquor pos system",
    "liquor store billing software",
    "inventory management software",
    "billing and invoicing",
  ],
  category: "business software",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Liquor Billing | Complete POS, Billing and Inventory Solution",
    description: "Multi-tenant SaaS platform for liquor stores with sales, inventory, and finance management.",
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
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Liquor Billing | Liquor Billing Software & POS",
    description: "Manage liquor billing, POS sales, inventory, and finance in one secure platform.",
    images: ["/icon_512X512.svg"],
  },
  icons: {
    icon: [{ url: "/icon_512X512.svg", type: "image/svg+xml" }],
    shortcut: ["/icon_512X512.svg"],
    apple: [{ url: "/icon_512X512.svg" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connectDB();

  return (
    <html lang="en">
      <body>
        {" "}
        <Providers>
          
          {children}
          
          </Providers>

      </body>
    </html>
  );
}
