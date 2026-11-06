import ProductIcon, { type IconKind } from "../ui/ProductIcon";

interface Product {
  name: string;
  blurb: string;
  tags: string[];
  icon: IconKind;
}

// Placeholder catalogue: replace with the real product list.
const PRODUCTS: Product[] = [
  { name: "Corrugated Boxes", blurb: "Shipping-strong single, double and triple wall boxes in any size.", tags: ["E / B / C flute", "Die-cut"], icon: "corrugated" },
  { name: "Rigid Boxes", blurb: "Premium lift-off lids, magnetic closures and foil-stamped finishes.", tags: ["Magnetic", "Foil"], icon: "rigid" },
  { name: "Folding Cartons", blurb: "Retail-ready cartons with crisp offset print and custom inserts.", tags: ["Offset", "Window"], icon: "carton" },
  { name: "Pouches", blurb: "Stand-up and flat pouches with zip, spout and matte or gloss barrier film.", tags: ["Zip", "Barrier"], icon: "pouch" },
  { name: "Poly Bags", blurb: "Clear and printed poly bags, self-seal and recyclable options.", tags: ["Self-seal", "Recyclable"], icon: "poly" },
  { name: "Courier Bags", blurb: "Tamper-evident mailers with tear strip, printed inside and out.", tags: ["Tamper-evident", "Printed"], icon: "courier" },
];

export default function Products() {
  return (
    <section id="products" className="relative z-10 bg-[var(--bg)] px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow" data-reveal>
          What we make
        </p>
        <h2
          data-reveal
          className="font-display mt-4 max-w-2xl text-5xl font-bold leading-[0.98] tracking-[-0.025em] md:text-7xl"
        >
          Six ways to wrap a product.
        </h2>

        <ul className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <li key={p.name} className="group relative bg-[var(--bg)]">
              <a href="#quote" data-reveal className="relative block h-full overflow-hidden p-8 md:p-10">
                {/* kraft wash that wipes up on hover */}
                <span className="absolute inset-0 translate-y-full bg-[var(--kraft)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
                <span className="relative flex h-full flex-col transition-colors duration-500 group-hover:text-black">
                  <span className="flex items-start justify-between">
                    <span className="text-sm tabular-nums text-[var(--muted)] transition-colors duration-500 group-hover:text-black/60">
                      0{i + 1}
                    </span>
                    <span className="size-24 text-[var(--kraft)] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-2 group-hover:rotate-[-4deg] group-hover:text-black md:size-28">
                      <ProductIcon kind={p.icon} />
                    </span>
                  </span>
                  <span className="font-display mt-10 text-3xl font-semibold tracking-tight">{p.name}</span>
                  <span className="mt-3 max-w-xs text-[var(--muted)] transition-colors duration-500 group-hover:text-black/70">
                    {p.blurb}
                  </span>
                  <span className="mt-8 flex flex-wrap items-center gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-current/25 px-3 py-1 text-xs opacity-80"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto text-xl transition-transform duration-500 group-hover:translate-x-1">→</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
