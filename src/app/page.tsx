import type { Metadata } from "next";
import { site } from "@/content/site";
import { robotsMeta } from "@/content/launch";
import Home from "@/templates/eco/Home";

export const metadata: Metadata = {
  title: site.seo.title,
  description: site.seo.description,
  robots: robotsMeta, // noindex on staging; indexable only in the production build (content/launch.ts)
  openGraph: { images: [{ url: "/og-eco.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og-eco.png"] },
};

/** The site root is the eco design (the template picker was removed). */
export default function Page() {
  return <Home />;
}
