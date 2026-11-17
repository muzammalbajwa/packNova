import Link from "next/link";
import { GROUP_BY_ID, PAGE_BY_HREF, quoteHref, ROUTES, type CatalogPage } from "@/content/catalog";
import Crumbs from "./Crumbs";
import PrefetchLink from "./PrefetchLink";
import ProductFilm from "./ProductFilm";
import ProductPoster from "./ProductPoster";
import QuoteBand from "./QuoteBand";
import RelatedProducts from "./RelatedProducts";
import Shell from "./Shell";

const h2 = "font-display text-3xl font-medium leading-[1.1] md:text-4xl";

/** A product page. Phase 1: plain content. The 3D film is mounted by <ProductFilm> (added in phase 2). */
export default function CategoryPage({ page }: { page: CatalogPage }) {
  const g = GROUP_BY_ID[page.group];
  const qHref = quoteHref(page.quote.product, page.quote.note);
  // The headline block. It is the left half of the first screen, next to the live stage (see ProductFilm), so it is short:
  // the title, one line of promise, one line of description and the two actions. The longer "what it is" text opens the Details section.
  const hero = (
    <>
      <div className="hidden md:block"><Crumbs trail={[{ label: "Home", href: "/" }, { label: g.label, href: g.href }, { label: page.title }]} /></div>
      <h1 className="font-display text-3xl font-medium leading-[1.08] md:mt-5 md:text-5xl">{page.title}</h1>
      <p className="font-display mt-2 text-xl text-[var(--kraft-ink)] md:mt-3 md:text-2xl">{page.hero.headline}</p>
      <p className="mt-2 text-base text-[var(--muted)] md:mt-4 md:text-lg">{page.short}</p>
      <div className="mt-4 flex flex-row gap-2.5 md:mt-6">
        <Link href={qHref} className="inline-flex flex-1 items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-4 py-3 text-base font-semibold text-[var(--on-accent)] hover:bg-[var(--fg)] md:flex-none md:px-6"><span className="md:hidden">Get a quote</span><span className="hidden md:inline">Get a quote for {page.title}</span></Link>
        <Link href={ROUTES.configurator} className="inline-flex flex-1 items-center justify-center rounded-[var(--r-btn)] border border-[var(--line-strong)] px-4 py-3 text-base font-semibold hover:border-[var(--fg)] md:flex-none md:px-6">Design your box</Link>
      </div>
    </>
  );
  return (
    <Shell>
      <ProductFilm page={page} hero={hero} poster={<ProductPoster page={page} className="h-full max-h-[22rem] w-full" />} />

      <section aria-labelledby="specs-h" className="border-t border-[var(--line)] px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div>
            <h2 id="specs-h" className={h2}>Details</h2>
            <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">{page.what}</p>
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

      {page.variants && (
        <section aria-labelledby="var-h" className="border-t border-[var(--line)] px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 id="var-h" className={h2}>Styles</h2>
            <ul className="mt-6 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {page.variants.map((href) => {
                const v = PAGE_BY_HREF[href];
                return v ? (
                  <li key={href} className="bg-[var(--bg)]">
                    <PrefetchLink recipe={v.recipe} href={href} className="group block h-full p-5 hover:bg-[var(--sand)]">
                      <span className="font-display text-xl font-medium">{v.title}</span>
                      <span className="mt-1 block text-[var(--muted)]">{v.short}</span>
                      <span className="mt-3 block font-semibold text-[var(--accent)] group-hover:underline underline-offset-4">See the style →</span>
                    </PrefetchLink>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        </section>
      )}

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

      <RelatedProducts page={page} />
      <QuoteBand product={page.title} note={page.quote.note} />
    </Shell>
  );
}
