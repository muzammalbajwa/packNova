import type { Metadata } from "next";
import { site } from "@/content/site";
import Home from "@/templates/eco/Home";

export const metadata: Metadata = {
  title: site.seo.title,
  description: site.seo.description,
  // TODO(launch): staging is not indexed. Remove this line (and the one in /configurator) when the real domain goes live.
  robots: { index: false },
  openGraph: { images: [{ url: "/og-eco.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og-eco.png"] },
};

/** The site root is the eco design (the template picker was removed). */
export default function Page() {
  return <Home />;
}
