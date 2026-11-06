import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export const dynamic = "force-static"; // required for `output: 'export'`

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.brand.url}/sitemap.xml`,
  };
}
