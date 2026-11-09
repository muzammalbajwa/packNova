import { site } from "@/content/site";

/**
 * Renders NOTHING until real data exists in content/site.ts (`reviews.items` / `reviews.clients`).
 * Nothing here is ever invented.
 */
export default function Reviews() {
  const { eyebrow, heading, items, clients } = site.reviews;
  if (items.length === 0 && clients.length === 0) return null;

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="relative z-10 bg-[var(--bg)] px-6 pb-24 md:pb-36">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="reviews-h" className="font-display mt-4 text-4xl font-bold leading-tight tracking-[-0.025em] md:text-6xl">
          {heading}
        </h2>
        {items.length > 0 && (
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <li key={`${r.name}-${r.quote.slice(0, 16)}`} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7">
                <blockquote className="text-lg leading-relaxed">&ldquo;{r.quote}&rdquo;</blockquote>
                <p className="mt-5 text-sm font-medium">{r.name}</p>
                {r.role && <p className="text-sm text-[var(--muted)]">{r.role}</p>}
              </li>
            ))}
          </ul>
        )}
        {clients.length > 0 && (
          <ul className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-5 text-[var(--muted)]">
            {clients.map((c) => (
              <li key={c.name}>
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logo} alt={c.name} className="h-8 w-auto" loading="lazy" />
                ) : (
                  <span className="font-display text-xl font-semibold">{c.name}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
