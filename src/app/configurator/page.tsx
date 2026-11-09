import type { Metadata } from "next";
import { site } from "@/content/site";
import { TEMPLATE_LOADERS } from "@/templates/registry";

export const metadata: Metadata = {
  title: `Configurator | ${site.brand.name}`,
  description: site.configurator.body,
};

// Kept for old links: shows the configurator in the default template (editorial).
export default async function ConfiguratorPage() {
  const { ConfiguratorPage: Page } = await TEMPLATE_LOADERS.editorial();
  return <Page />;
}
