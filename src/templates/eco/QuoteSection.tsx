import { site } from "@/content/site";
import QuoteForm from "@/components/sections/QuoteForm";
import TrackedA from "@/components/ui/TrackedA";
import { copy } from "./copy";

/** Forest green band: heading and contact lines on the left, the form on a cream panel on the right. */
export default function QuoteSection() {
  const q = site.quote;
  const c = site.contact;
  return (
    <section id="quote" className="relative z-10 bg-[var(--accent)] px-6 py-20 text-[var(--on-accent)] md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.1fr] md:items-start md:gap-16">
        <div data-reveal="subtle">
          <h2 className="font-display text-4xl font-medium leading-[1.12] md:text-5xl">{copy.quote.heading}</h2>
          <p className="mt-4 max-w-md text-lg opacity-90">{copy.quote.lead}</p>
          <TrackedA event="quote_section_whatsapp" href={c.whatsappHref} className="mt-8 inline-flex rounded-[var(--r-btn)] border border-[var(--on-accent)] px-6 py-3 text-base font-semibold hover:bg-[var(--on-accent)] hover:text-[var(--accent)]">
            {q.whatsappCta}: {c.whatsapp}
          </TrackedA>
          <ul className="mt-6 space-y-1 text-base">
            <li><a href={c.phoneHref} className="underline underline-offset-4">{c.phone}</a></li>
            <li><a href={`mailto:${c.email}`} className="underline underline-offset-4">{c.email}</a></li>
            <li>{c.hours}</li>
          </ul>
        </div>
        <div data-reveal="subtle"><QuoteForm /></div>
      </div>
    </section>
  );
}
