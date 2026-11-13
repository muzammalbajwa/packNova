import type { MetadataRoute } from "next";
import { GROUPS, PAGES, ROUTES } from "@/content/catalog";
import { site } from "@/content/site";

export const dynamic = "force-static"; // required for `output: 'export'`

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.brand.url.replace(/\/$/, "");
  const at = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${base}${path}`, changeFrequency: "monthly", priority });
  return [
    at("/", 1),
    ...GROUPS.map((g) => at(g.href, 0.8)),
    ...PAGES.map((p) => at(p.href, 0.7)),
    at(ROUTES.configurator, 0.7),
    at(ROUTES.quote, 0.6),
    at(ROUTES.contact, 0.6),
  ];
}
