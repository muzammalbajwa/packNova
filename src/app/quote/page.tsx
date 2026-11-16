import type { Metadata } from "next";
import Shell from "@/catalog/Shell";
import { pageMetadata } from "@/catalog/seo";
import QuoteConfigSummary from "@/components/sections/QuoteConfigSummary";
import QuoteForm from "@/components/sections/QuoteForm";
import { site } from "@/content/site";
import { copy } from "@/templates/eco/copy";

export const metadata: Metadata = pageMetadata(`Get a quote | ${site.brand.name}`, copy.quote.lead, "/quote/");

/** Phase 1 version: the existing form. Replaced by the multi-step form in phase 5. */
export default function Page() {
  return (
    <Shell>
      <section className="px-6 pb-24 pt-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{copy.quote.heading}</h1>
          <p className="mt-4 text-lg text-[var(--muted)]">{copy.quote.lead}</p>
          <div className="mt-8"><QuoteConfigSummary /><QuoteForm /></div>
        </div>
      </section>
    </Shell>
  );
}
