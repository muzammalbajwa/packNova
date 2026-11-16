import type { Metadata } from "next";
import Shell from "@/catalog/Shell";
import { pageMetadata } from "@/catalog/seo";
import ConfiguratorApp from "@/configurator/ConfiguratorApp";
import { site } from "@/content/site";

const lead = "Pick a product, set the size, material and colour, and watch the box fold up. It is a preview: our team confirms the final dieline and the price after we see your request.";
export const metadata: Metadata = pageMetadata(`Design your box | ${site.brand.name}`, lead, "/configurator/");

export default function Page() {
  return (
    <Shell>
      <section className="px-6 pb-24 pt-10">
        <div className="mx-auto mb-8 max-w-6xl">
          <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">Design your box</h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">{lead}</p>
        </div>
        <ConfiguratorApp />
      </section>
    </Shell>
  );
}
