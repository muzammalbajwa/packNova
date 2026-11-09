import { site } from "@/content/site";
import QuoteForm from "@/components/sections/QuoteForm";
import TrackedA from "@/components/ui/TrackedA";

/** A full gold band: centred headline, then the form card. */
export default function QuoteSection() {
  const q = site.quote;
  const c = site.contact;
  return (
    <section id="quote" className="relative z-10 overflow-hidden bg-[var(--accent)] px-6 py-28 text-[var(--on-accent)] md:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.32em] opacity-80">{q.eyebrow}</p>
        <h2 data-reveal className="font-display mt-5 text-[clamp(2.4rem,6vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">{q.heading}</h2>
        <TrackedA event="quote_section_whatsapp" href={c.whatsappHref} className="mt-7 inline-block border-b border-current pb-0.5 text-base font-medium">
          {q.whatsappCta}: {c.whatsapp} →
        </TrackedA>
        <p className="mt-3 text-sm opacity-85">
          <a href={c.phoneHref}>{c.phone}</a> · <a href={`mailto:${c.email}`}>{c.email}</a> · {c.hours}
        </p>
      </div>
      <div data-reveal className="mx-auto mt-12 max-w-2xl">
        <QuoteForm />
      </div>
    </section>
  );
}
