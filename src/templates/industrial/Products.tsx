import { site } from "@/content/site";
import ProductIcon from "@/components/ui/ProductIcon";
import TrackedA from "@/components/ui/TrackedA";

/** A product table: one hard-bordered row per product, inverts on hover. */
export default function Products() {
  const { products } = site;
  return (
    <section id="products" className="relative z-10 grid-paper px-5 py-24 md:px-10 md:py-36">
      <p className="eyebrow uppercase">§ 02 — {products.eyebrow}</p>
      <h2 data-reveal className="font-display mt-4 max-w-4xl text-5xl font-bold uppercase leading-[0.92] tracking-[-0.04em] md:text-7xl">{products.heading}</h2>
      <ul className="mt-14 border-t border-[var(--fg)] bg-[var(--surface)]">
        {products.items.map((p, i) => (
          <li key={p.id} data-reveal className="border-b border-[var(--fg)]">
            <TrackedA
              href="#quote"
              event="product_card_quote"
              data={{ product: p.id }}
              prefill={{ product: p.name }}
              className="group grid items-center gap-x-6 gap-y-3 px-4 py-6 transition-colors duration-150 hover:bg-[var(--accent)] hover:text-[var(--on-accent)] md:grid-cols-[4rem_5rem_1.2fr_1.6fr_1.2fr] md:px-6"
            >
              <span className="mono text-sm text-[var(--accent)] group-hover:text-[var(--on-accent)]">{String(i + 1).padStart(2, "0")}</span>
              <span className="size-14 text-[var(--kraft-ink)] group-hover:text-[var(--on-accent)]"><ProductIcon kind={p.icon} /></span>
              <span>
                <span className="font-display block text-2xl font-bold uppercase tracking-tight">{p.name}</span>
                <span className="mono text-xs text-[var(--muted)] group-hover:text-[var(--on-accent)]">{p.spec}</span>
              </span>
              <span className="text-[var(--muted)] group-hover:text-[var(--on-accent)]">{p.description}</span>
              <span className="mono text-xs uppercase text-[var(--muted)] group-hover:text-[var(--on-accent)]">
                {products.bestForLabel}: <span className="normal-case text-[var(--fg)] group-hover:text-[var(--on-accent)]">{p.bestFor.join(", ")}</span>
              </span>
            </TrackedA>
          </li>
        ))}
      </ul>
    </section>
  );
}
