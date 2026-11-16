import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { INDEXABLE } from "@/content/launch";

export const dynamic = "force-static"; // required for `output: 'export'`

// Staging is not indexed. The production build (NEXT_PUBLIC_ALLOW_INDEXING=1, see content/launch.ts) allows everything.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: INDEXABLE ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
    sitemap: `${site.brand.url}/sitemap.xml`,
  };
}
