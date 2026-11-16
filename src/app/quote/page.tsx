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
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_1.5fr] md:gap-14">
          <div className="md:pt-2">
            <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{wizard.heading}</h1>
            <p className="mt-4 text-lg text-[var(--muted)]">{wizard.lead}</p>
            <ul className="mt-8 hidden gap-5 border-t border-[var(--line-strong)] pt-6 md:grid">
              {wizard.aside.map((a) => (
                <li key={a.h}>
                  <p className="font-display text-xl font-medium">{a.h}</p>
                  <p className="mt-1 text-[var(--muted)]">{a.p}</p>
                </li>
              ))}
            </ul>
          </div>
          <QuoteWizard />
        </div>
      </section>
    </Shell>
  );
}
