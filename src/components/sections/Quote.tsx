import { site } from "@/content/site";
import TrackedA from "../ui/TrackedA";
import QuoteForm from "./QuoteForm";

export default function Quote() {
  const q = site.quote;
  return (
    <section id="quote" className="relative z-10 overflow-hidden bg-[var(--accent)] px-6 py-28 text-[var(--on-accent)] md:py-40">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.1fr_1fr] md:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] opacity-70" data-reveal>
            {q.eyebrow}
          </p>
          <h2
            data-reveal
            className="font-display mt-5 text-[clamp(2.4rem,6vw,5.2rem)] font-bold leading-[0.96] tracking-[-0.03em]"
          >
            {q.heading}
          </h2>
          <TrackedA
            event="quote_section_whatsapp"
            data-reveal
            href={site.contact.whatsappHref}
            className="mt-8 inline-flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--on-accent)_50%,transparent)] pb-0.5 text-base font-medium transition-colors hover:border-[var(--on-accent)]"
          >
            {q.whatsappCta}: {site.contact.whatsapp} →
          </TrackedA>
          <ul data-reveal className="mt-6 space-y-1 text-sm font-medium opacity-80">
            <li>
              <a href={site.contact.phoneHref}>{site.contact.phone}</a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
            </li>
            <li>{site.contact.hours}</li>
          </ul>
        </div>
        <div data-reveal>
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
