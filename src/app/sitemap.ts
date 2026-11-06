import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export const dynamic = "force-static"; // required for `output: 'export'`

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.brand.url.replace(/\/$/, "");
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/configurator/`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
