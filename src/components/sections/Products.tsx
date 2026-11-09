import { site } from "@/content/site";
import ProductIcon from "../ui/ProductIcon";

export default function Products() {
  const { products } = site;
  return (
    <section id="products" className="relative z-10 bg-[var(--bg)] px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow" data-reveal>
          {products.eyebrow}
        </p>
        <h2
          data-reveal
          className="font-display mt-4 max-w-2xl text-5xl font-bold leading-[0.98] tracking-[-0.025em] md:text-7xl"
        >
          {products.heading}
        </h2>

        <ul className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {products.items.map((p, i) => (
            <li key={p.id} className="group relative bg-[var(--bg)]">
              <a href="#quote" data-reveal className="relative block h-full overflow-hidden p-8 md:p-10">
                {/* kraft wash that wipes up on hover */}
                <span className="absolute inset-0 translate-y-full bg-[var(--accent)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0" />
                <span className="relative flex h-full flex-col transition-colors duration-500 group-hover:text-[var(--on-accent)]">
                  <span className="flex items-start justify-between">
                    <span className="text-sm tabular-nums text-[var(--muted)] transition-colors duration-500 group-hover:text-[var(--on-accent)]/60">
                      0{i + 1}
                    </span>
                    <span className="size-24 text-[var(--kraft-ink)] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-2 group-hover:rotate-[-4deg] group-hover:text-[var(--on-accent)] md:size-28">
                      <ProductIcon kind={p.icon} />
                    </span>
                  </span>
                  <span className="font-display mt-10 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                    {p.name}
                  </span>
                  <span className="mt-1 text-sm text-[var(--accent)] transition-colors duration-500 group-hover:text-[var(--on-accent)]">
                    {p.spec}
                  </span>
                  <span className="mt-3 max-w-xs text-[var(--muted)] transition-colors duration-500 group-hover:text-[var(--on-accent)]">
                    {p.description}
                  </span>
                  <span className="mt-8 flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs uppercase tracking-[0.2em] opacity-60">{products.bestForLabel}</span>
                    {p.bestFor.map((t) => (
                      <span key={t} className="rounded-full border border-current/25 px-3 py-1 text-xs opacity-85">
                        {t}
                      </span>
                    ))}
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
