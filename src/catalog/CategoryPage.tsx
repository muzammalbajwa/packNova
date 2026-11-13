import Link from "next/link";
import { GROUP_BY_ID, PAGE_BY_HREF, quoteHref, ROUTES, type CatalogPage } from "@/content/catalog";
import Crumbs from "./Crumbs";
import ProductFilm from "./ProductFilm";
import ProductPoster from "./ProductPoster";
import Shell from "./Shell";

const h2 = "font-display text-3xl font-medium leading-[1.1] md:text-4xl";

/** A product page. Phase 1: plain content. The 3D film is mounted by <ProductFilm> (added in phase 2). */
export default function CategoryPage({ page }: { page: CatalogPage }) {
  const g = GROUP_BY_ID[page.group];
  const qHref = quoteHref(page.quote.product, page.quote.note);
  return (
    <Shell>
      <section className="px-6 pb-14 pt-10 md:pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
         <div>
          <Crumbs trail={[{ label: "Home", href: "/" }, { label: g.label, href: g.href }, { label: page.title }]} />
          <h1 className="font-display mt-6 max-w-3xl text-4xl font-medium leading-[1.08] md:text-6xl">{page.title}</h1>
          <p className="font-display mt-3 text-2xl text-[var(--kraft-ink)] md:text-3xl">{page.hero.headline}</p>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">{page.what}</p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Link href={qHref} className="inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[var(--on-accent)] hover:bg-[var(--fg)]">Get a quote for {page.title}</Link>
            <Link href={ROUTES.configurator} className="inline-flex items-center justify-center rounded-[var(--r-btn)] border border-[var(--line-strong)] px-6 py-3 text-base font-semibold hover:border-[var(--fg)]">Design your box</Link>
          </div>
         </div>
         <ProductPoster page={page} className="mx-auto hidden w-full max-w-md md:block" />
        </div>
      </section>

      <ProductFilm page={page} />

      <section aria-labelledby="specs-h" className="border-t border-[var(--line)] px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div>
            <h2 id="specs-h" className={h2}>Details</h2>
            <dl className="mt-6 border-t border-[var(--line-strong)]">
              {page.specs.map((s) => (
                <div key={s.label} className="grid gap-1 border-b border-[var(--line)] py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="font-semibold text-[var(--kraft-ink)]">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid content-start gap-10">
            <div>
              <h2 className="font-display text-2xl font-medium">Finishes</h2>
              <ul className="mt-3 space-y-1.5 text-[var(--muted)]">{page.finishes.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium">Good for</h2>
              <ul className="mt-3 space-y-1.5 text-[var(--muted)]">{page.uses.map((u) => <li key={u}>{u}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-h" className="border-t border-[var(--line)] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-h" className={h2}>Questions</h2>
          <div className="mt-6 border-t border-[var(--line-strong)]">
            {page.faq.map((f) => (
              <details key={f.q} className="group border-b border-[var(--line)] py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="text-[var(--kraft-ink)] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-[var(--muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--accent)] px-6 py-16 text-[var(--on-accent)] md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-medium md:text-4xl">Want {page.title}?</h2>
            <p className="mt-2 max-w-md text-lg opacity-90">Tell us the size and the quantity. We reply with a quote.</p>
          </div>
          <Link href={qHref} className="inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--on-accent)] px-7 py-3.5 text-base font-semibold text-[var(--accent)]">Get a quote for {page.title}</Link>
        </div>
      </section>

      <section aria-labelledby="rel-h" className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 id="rel-h" className="font-display text-2xl font-medium">Related products</h2>
          <ul className="mt-5 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
            {page.related.map((href) => {
              const r = PAGE_BY_HREF[href];
              return r ? (
                <li key={href} className="bg-[var(--bg)]">
                  <Link href={href} className="block h-full p-5 hover:bg-[var(--sand)]">
                    <span className="font-display text-xl font-medium">{r.title}</span>
                    <span className="mt-1 block text-[var(--muted)]">{r.short}</span>
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      </section>
    </Shell>
  );
}
