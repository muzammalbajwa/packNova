import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export const dynamic = "force-static"; // required for `output: 'export'`

// TODO(launch): staging is not indexed. Change to `{ userAgent: "*", allow: "/" }` when the real domain goes live.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
    sitemap: `${site.brand.url}/sitemap.xml`,
  };
}
