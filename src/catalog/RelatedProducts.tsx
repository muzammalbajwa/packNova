import Link from "next/link";
import "./pageEnd.css";
import { GROUP_BY_ID, PAGE_END, relatedFor, type CatalogPage } from "@/content/catalog";
import PrefetchLink from "./PrefetchLink";
import ProductIllustration from "./ProductIllustration";

/**
 * The end of a product page: cards for the closest related products (same recipe first, then same group), each with a drawing tinted
 * with that product's own colours. Server-rendered; the hover moves are CSS only (pageEnd.css) and stop under prefers-reduced-motion.
 */
export default function RelatedProducts({ page }: { page: CatalogPage }) {
  const g = GROUP_BY_ID[page.group];
  const items = relatedFor(page, 4);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="rel-h" className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h2 id="rel-h" className="font-display text-balance text-3xl font-medium leading-[1.1] md:text-4xl">{PAGE_END.relatedTitle}</h2>
            <p className="mt-2 max-w-xl text-lg text-[var(--muted)]">{PAGE_END.relatedLine}</p>
          </div>
          <Link href={g.href} className="rel-viewall font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
            {PAGE_END.viewAll(g.label)} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul className="rel-list mt-8 -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0">
          {items.map((r, i) => (
            <li key={r.href} className={`w-[78%] shrink-0 snap-start sm:w-auto ${i === 3 ? "rel-fourth" : ""}`}>
              <PrefetchLink
                recipe={r.recipe}
                href={r.href}
                className="rel-card group flex h-full flex-col overflow-hidden rounded-[var(--r-card)] border border-[var(--line-strong)]"
                style={{ "--ic-base": r.skin.base, "--ic-accent": r.skin.accent === r.skin.base ? r.skin.second : r.skin.accent } as React.CSSProperties}
              >
                <span className="rel-plate block aspect-[4/3] w-full px-4 pb-1 pt-3"><ProductIllustration page={r} /></span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="font-display text-2xl font-medium leading-tight">{r.title}</span>
                  <span className="mt-1.5 text-[var(--muted)]">{r.short}</span>
                  <span className="mt-auto flex items-center gap-2 pt-5 font-semibold text-[var(--accent)]">
                    {PAGE_END.relatedLink}
                    <span aria-hidden="true" className="rel-arrow inline-block">→</span>
                  </span>
                </span>
              </PrefetchLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
