import { site } from "@/content/site";
import ProductIcon from "@/components/ui/ProductIcon";
import PrefetchLink from "@/catalog/PrefetchLink";
import "@/catalog/pageEnd.css";
import { HOME_CATEGORY_HREF, PAGE_BY_HREF } from "@/content/catalog";
import { copy } from "./copy";

/**
 * Six cards, one per product family. Each has a big animated drawing on the grid plate (it plays on hover, focus and tap), the name,
 * one line, who it is for, and the action. Same card language as the related-products cards at the end of every product page.
 */
export default function Products() {
  const { items } = site.products;
  const c = copy.products;
  return (
    <section id="products" className="relative z-10 bg-[var(--bg)] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <h2 data-reveal="subtle" className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{c.heading}</h2>
          <p data-reveal="subtle" className="max-w-md text-lg text-[var(--muted)] md:pt-3">{c.lead}</p>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id} data-reveal="subtle">
              <PrefetchLink
                href={HOME_CATEGORY_HREF[p.id]}
                recipe={PAGE_BY_HREF[HOME_CATEGORY_HREF[p.id]]?.recipe}
                className="rel-card group flex h-full flex-col overflow-hidden rounded-[var(--r-card)] border border-[var(--line-strong)]"
              >
                <span className="rel-plate block aspect-[16/10] w-full px-6 py-5 text-[var(--accent)]"><ProductIcon kind={p.icon} /></span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="font-display text-2xl font-medium leading-tight">{p.name}</span>
                  <span className="mt-1.5 text-[var(--muted)]">{p.description}</span>
                  <span className="mt-3 text-sm text-[var(--muted)]"><span className="font-semibold text-[var(--kraft-ink)]">{c.bestFor}:</span> {p.bestFor.join(", ")}</span>
                  <span className="mt-auto flex items-center gap-2 pt-5 font-semibold text-[var(--accent)]">
                    {c.action}
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
