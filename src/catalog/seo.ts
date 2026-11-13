import type { Metadata } from "next";
import { site } from "@/content/site";

/**
 * Metadata shared by every new page: canonical, Open Graph, and noindex while this is staging
 * (robots.txt also disallows everything). TODO(launch): remove `robots` here and in app/robots.ts.
 */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = `${site.brand.url.replace(/\/$/, "")}${path}`;
  const image = { url: "/og-eco.png", width: 1200, height: 630, alt: site.brand.tagline };
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: { type: "website", siteName: site.brand.name, title, description, url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
