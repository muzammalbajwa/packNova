import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEMPLATE_IDS, TEMPLATE_LOADERS, isTemplateId } from "@/templates/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATE_IDS.map((template) => ({ template }));
}

export const metadata: Metadata = { robots: { index: false } };

export default async function TemplateHome({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params;
  if (!isTemplateId(template)) notFound();
  const { Home } = await TEMPLATE_LOADERS[template]();
  return <Home />;
}
