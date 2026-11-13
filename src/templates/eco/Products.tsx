import { site } from "@/content/site";
import ProductIcon from "@/components/ui/ProductIcon";
import Link from "next/link";
import { HOME_CATEGORY_HREF } from "@/content/catalog";
import { copy } from "./copy";

/** A wide list with 1px rules. Each row is one link to the quote form; the icon keeps its hover animation. */
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
        <ul className="mt-12 border-t border-[var(--line-strong)]">
          {items.map((p) => (
            <li key={p.id} data-reveal="subtle" className="border-b border-[var(--line)]">
              <Link
                href={HOME_CATEGORY_HREF[p.id]}
                className="group grid items-center gap-x-8 gap-y-3 py-6 transition-colors hover:bg-[var(--sand)] focus-visible:bg-[var(--sand)] md:grid-cols-[88px_1.3fr_1.4fr_auto] md:px-4"
              >
                <span className="block size-16 text-[var(--accent)] md:size-[72px]"><ProductIcon kind={p.icon} /></span>
                <span>
                  <span className="font-display block text-2xl font-medium leading-tight">{p.name}</span>
                </span>
                <span>
                  <span className="block text-[var(--muted)]">{p.description}</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]"><span className="font-semibold text-[var(--kraft-ink)]">{c.bestFor}:</span> {p.bestFor.join(", ")}</span>
                </span>
                <span className="text-base font-semibold text-[var(--accent)] underline-offset-4 group-hover:underline">{c.action} →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
