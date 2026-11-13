import type { Metadata } from "next";
import { site } from "@/content/site";
import ConfiguratorPage from "@/templates/eco/ConfiguratorPage";

export const metadata: Metadata = {
  title: `Configurator | ${site.brand.name}`,
  description: site.configurator.body,
  robots: { index: false }, // TODO(launch): remove with the root page's noindex
};

export default function Page() {
  return <ConfiguratorPage />;
}
