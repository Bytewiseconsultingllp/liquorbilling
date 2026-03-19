import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Liquor Billing",
    short_name: "LiquorBilling",
    description:
      "Liquor billing software with POS, inventory, finance and reporting tools for modern liquor businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#EEF2FF",
    theme_color: "#2563EB",
    icons: [
      {
        src: "/icon_512X512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
