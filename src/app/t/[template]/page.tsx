import type { Metadata } from "next";
import { robotsMeta } from "@/content/launch";
import { notFound } from "next/navigation";
import { TEMPLATE_IDS, TEMPLATE_LOADERS, isTemplateId } from "@/templates/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATE_IDS.map((template) => ({ template }));
}

export async function generateMetadata({ params }: { params: Promise<{ template: string }> }): Promise<Metadata> {
  const { template } = await params;
  const image = isTemplateId(template) ? `/og-${template}.png` : "/og.png";
  return {
    robots: robotsMeta,
    openGraph: { images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function TemplateHome({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params;
  if (!isTemplateId(template)) notFound();
  const { Home } = await TEMPLATE_LOADERS[template]();
  return <Home />;
}
