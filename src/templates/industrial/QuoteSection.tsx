import { site } from "@/content/site";
import QuoteForm from "@/components/sections/QuoteForm";
import TrackedA from "@/components/ui/TrackedA";

export default function QuoteSection() {
  const q = site.quote;
  const c = site.contact;
  return (
    <section id="quote" className="relative z-10 border-y border-[var(--fg)] bg-[var(--accent)] px-5 py-24 text-[var(--on-accent)] md:px-10 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mono text-xs uppercase opacity-90">§ 06 — {q.eyebrow}</p>
          <h2 data-reveal className="font-display mt-4 text-[clamp(2.5rem,5.6vw,5rem)] font-bold uppercase leading-[0.92] tracking-[-0.04em]">{q.heading}</h2>
          <TrackedA event="quote_section_whatsapp" href={c.whatsappHref} className="mono mt-8 inline-block border border-current px-4 py-3 text-sm uppercase">
            {q.whatsappCta}: {c.whatsapp} →
          </TrackedA>
          <table className="mono mt-8 w-full max-w-sm border-collapse text-xs">
            <tbody>
              {[["TEL", c.phone], ["MAIL", c.email], ["HOURS", c.hours]].map(([k, v]) => (
                <tr key={k} className="border-t border-current/60"><td className="py-2 pr-4 opacity-80">{k}</td><td className="py-2">{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div data-reveal className="self-start border border-[var(--fg)]"><QuoteForm /></div>
      </div>
    </section>
  );
}
