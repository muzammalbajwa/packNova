import { site } from "@/content/site";
import ProductIcon from "@/components/ui/ProductIcon";
import TrackedA from "@/components/ui/TrackedA";

/** Glass cards that light up on hover. */
export default function Products() {
  const { products } = site;
  return (
    <section id="products" className="relative z-10 bg-[var(--bg)] px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-center">{products.eyebrow}</p>
        <h2 data-reveal className="font-display mx-auto mt-5 max-w-3xl text-center text-5xl font-bold leading-[0.95] tracking-[-0.035em] md:text-7xl">
          {products.heading}
        </h2>
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.items.map((p, i) => (
            <li key={p.id} data-reveal>
              <TrackedA
                href="#quote"
                event="product_card_quote"
                data={{ product: p.id }}
                prefill={{ product: p.name }}
                className="glass group relative flex h-full flex-col overflow-hidden rounded-[var(--r-card)] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[var(--accent)]"
              >
                <span className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[var(--accent)] opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25" />
                <span className="flex items-start justify-between">
                  <span className="text-sm tabular-nums text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="size-20 text-[var(--accent)]">
                    <ProductIcon kind={p.icon} />
                  </span>
                </span>
                <h3 className="font-display mt-8 text-2xl font-bold tracking-tight">{p.name}</h3>
                <p className="mt-1 text-sm text-[var(--accent)]">{p.spec}</p>
                <p className="mt-3 text-[var(--muted)]">{p.description}</p>
                <p className="mt-auto pt-6 text-xs text-[var(--muted)]">
                  {products.bestForLabel}: <span className="text-[var(--fg)]">{p.bestFor.join(" · ")}</span>
                </p>
              </TrackedA>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
