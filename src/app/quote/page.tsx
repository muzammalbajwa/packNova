import type { Metadata } from "next";
import Shell from "@/catalog/Shell";
import { pageMetadata } from "@/catalog/seo";
import QuoteWizard from "@/components/quote/QuoteWizard";
import { wizard } from "@/content/quoteWizard";
import { site } from "@/content/site";

export const metadata: Metadata = pageMetadata(`Get a quote | ${site.brand.name}`, wizard.lead, "/quote/");

export default function Page() {
  return (
    <Shell>
      <section className="px-6 pb-24 pt-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{wizard.heading}</h1>
          <QuoteWizard />
        </div>
      </section>
    </Shell>
  );
}
