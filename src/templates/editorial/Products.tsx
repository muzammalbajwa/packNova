import { site } from "@/content/site";
import ProductIcon from "@/components/ui/ProductIcon";
import TrackedA from "@/components/ui/TrackedA";

/** An editorial grid: huge numerals, hairline rules, copy set like a table of contents. */
export default function Products() {
  const { products } = site;
  return (
    <section id="products" className="relative z-10 bg-[var(--bg)] px-6 py-28 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-t border-[var(--fg)] pt-4 md:grid-cols-[1fr_2fr]">
          <p className="eyebrow">{products.eyebrow}</p>
          <h2 data-reveal className="font-display max-w-3xl text-5xl font-light leading-[0.98] tracking-[-0.025em] md:text-7xl">
            {products.heading}
          </h2>
        </div>
        <ul className="mt-20 grid md:grid-cols-2 lg:grid-cols-3">
          {products.items.map((p, i) => (
            <li key={p.id} data-reveal className="border-t border-[var(--line-strong)] py-10 md:pr-10">
              <TrackedA
                href="#quote"
                event="product_card_quote"
                data={{ product: p.id }}
                prefill={{ product: p.name }}
                className="group block"
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-8xl font-extralight italic leading-none text-[var(--kraft-ink)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="size-20 text-[var(--kraft-ink)] transition-transform duration-700 group-hover:-translate-y-1">
                    <ProductIcon kind={p.icon} />
                  </span>
                </div>
                <h3 className="font-display mt-8 text-3xl font-normal tracking-tight">{p.name}</h3>
                <p className="mt-1 text-sm italic text-[var(--muted)]">{p.spec}</p>
                <p className="mt-4 max-w-xs text-[var(--muted)]">{p.description}</p>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {products.bestForLabel}: <span className="normal-case tracking-normal text-[var(--fg)]">{p.bestFor.join(", ")}</span>
                </p>
              </TrackedA>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
