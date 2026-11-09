import { site } from "@/content/site";
import QuoteForm from "@/components/sections/QuoteForm";
import TrackedA from "@/components/ui/TrackedA";

export default function QuoteSection() {
  const q = site.quote;
  const c = site.contact;
  return (
    <section id="quote" className="relative z-10 border-t border-[var(--fg)] bg-[var(--surface)] px-6 py-28 md:py-40">
      <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow">{q.eyebrow}</p>
          <h2 data-reveal className="font-display mt-6 text-[clamp(2.6rem,6vw,5.4rem)] font-light leading-[0.98] tracking-[-0.025em]">
            {q.heading}
          </h2>
          <TrackedA
            event="quote_section_whatsapp"
            href={c.whatsappHref}
            className="mt-9 inline-block border-b border-[var(--fg)] pb-0.5 text-base font-medium"
          >
            {q.whatsappCta}: {c.whatsapp} →
          </TrackedA>
          <ul className="mt-8 space-y-2 border-t border-[var(--line-strong)] pt-6 text-sm text-[var(--muted)]">
            <li><a href={c.phoneHref}>{c.phone}</a></li>
            <li><a href={`mailto:${c.email}`}>{c.email}</a></li>
            <li>{c.hours}</li>
          </ul>
        </div>
        <div data-reveal className="[&_form]:bg-[var(--bg)]">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
