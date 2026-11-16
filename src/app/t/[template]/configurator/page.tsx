import type { Metadata } from "next";
import { robotsMeta } from "@/content/launch";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { TEMPLATE_IDS, TEMPLATE_LOADERS, isTemplateId } from "@/templates/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATE_IDS.map((template) => ({ template }));
}

export const metadata: Metadata = {
  title: `Configurator | ${site.brand.name}`,
  description: site.configurator.body,
  robots: robotsMeta,
};

export default async function TemplateConfigurator({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params;
  if (!isTemplateId(template)) notFound();
  const { ConfiguratorPage } = await TEMPLATE_LOADERS[template]();
  return <ConfiguratorPage />;
}
