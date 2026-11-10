import { site } from "@/content/site";
import ProductIcon from "@/components/ui/ProductIcon";
import TrackedA from "@/components/ui/TrackedA";

/** Chunky rounded cards with a number sticker; the icon hops on hover. */
export default function Products() {
  const { products } = site;
  return (
    <section id="products" className="relative z-10 bg-[var(--bg)] px-5 py-24 md:py-36">
      <div className="mx-auto max-w-6xl">
        <p className="w-fit rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--on-accent)]">{products.eyebrow}</p>
        <h2 data-reveal className="font-display mt-5 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] md:text-7xl">{products.heading}</h2>
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.items.map((p, i) => (
            <li key={p.id} data-reveal>
              <TrackedA
                href="#quote"
                event="product_card_quote"
                data={{ product: p.id }}
                prefill={{ product: p.name }}
                className="group relative flex h-full flex-col rounded-[var(--r-card)] bg-[var(--surface)] p-7 transition-transform duration-500 [transition-timing-function:var(--spring)] hover:-translate-y-2 hover:rotate-[-1deg] hover:shadow-[0_26px_36px_-22px_rgba(0,0,0,0.7)] focus-visible:-translate-y-2"
              >
                <span className="absolute -top-3 left-6 grid size-10 place-items-center rounded-full bg-[var(--accent)] font-display text-lg font-extrabold text-[var(--on-accent)] [transition-timing-function:var(--spring)] group-hover:rotate-12">{i + 1}</span>
                <span className="blob mx-auto mt-4 grid size-32 place-items-center bg-[var(--bg)] text-[var(--accent)] transition-transform duration-500 [transition-timing-function:var(--spring)] group-hover:scale-110 group-hover:-rotate-6">
                  <span className="size-20"><ProductIcon kind={p.icon} /></span>
                </span>
                <h3 className="font-display mt-6 text-2xl font-bold tracking-tight">{p.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--accent)]">{p.spec}</p>
                <p className="mt-3 text-[var(--muted)]">{p.description}</p>
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-5">
                  {p.bestFor.map((b) => (<li key={b} className="rounded-full bg-[var(--wash)] px-3 py-1 text-xs font-semibold">{b}</li>))}
                </ul>
              </TrackedA>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
