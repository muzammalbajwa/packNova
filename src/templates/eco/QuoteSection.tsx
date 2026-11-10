import { site } from "@/content/site";
import QuoteForm from "@/components/sections/QuoteForm";
import TrackedA from "@/components/ui/TrackedA";

/** A lime band with rounded top, headline left and a friendly form card right. */
export default function QuoteSection() {
  const q = site.quote;
  const c = site.contact;
  return (
    <section id="quote" className="relative z-10 overflow-hidden rounded-t-[3rem] bg-[var(--accent)] px-6 py-24 text-[var(--on-accent)] md:py-32">
      <span className="morph pointer-events-none absolute -left-20 bottom-[-6rem] size-80 bg-[var(--on-accent)] opacity-10" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.1fr_1fr] md:items-start">
        <div>
          <p className="w-fit rounded-full bg-[var(--on-accent)] px-4 py-1.5 text-sm font-bold text-[var(--accent)]">{q.eyebrow}</p>
          <h2 data-reveal className="font-display mt-5 text-[clamp(2.4rem,5.6vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">{q.heading}</h2>
          <TrackedA event="quote_section_whatsapp" href={c.whatsappHref} className="mt-8 inline-flex rounded-full bg-[var(--on-accent)] px-6 py-3.5 text-base font-bold text-[var(--accent)]">
            {q.whatsappCta}: {c.whatsapp} →
          </TrackedA>
          <ul className="mt-6 space-y-1 text-sm font-semibold">
            <li><a href={c.phoneHref}>{c.phone}</a></li>
            <li><a href={`mailto:${c.email}`}>{c.email}</a></li>
            <li>{c.hours}</li>
          </ul>
        </div>
        <div data-reveal><QuoteForm /></div>
      </div>
    </section>
  );
}
