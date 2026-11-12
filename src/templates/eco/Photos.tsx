import { site } from "@/content/site";
import { copy } from "./copy";

/**
 * Two empty-by-default slots. They render NOTHING until real photos are added to `site.media` in content/site.ts,
 * so the page never shows a placeholder or a stock picture. Real client logos and reviews use the shared Reviews section.
 */
export function ProductPhotos() {
  const { products } = site.media;
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="photos-h" className="relative z-10 bg-[var(--bg)] px-6 pb-20 md:pb-28">
      <div className="mx-auto max-w-6xl">
        <h2 id="photos-h" className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{copy.photos.productsHeading}</h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((ph) => (
            <li key={ph.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.src} alt={ph.alt} width={ph.width} height={ph.height} loading="lazy" decoding="async" className="h-auto w-full rounded-[var(--r-card)] border border-[var(--line)]" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FactoryPhoto() {
  const ph = site.media.factory;
  if (!ph) return null;
  return (
    <section aria-labelledby="factory-h" className="relative z-10 bg-[var(--bg)] px-6 pb-20 md:pb-28">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_1.6fr] md:gap-16">
        <div>
          <h2 id="factory-h" className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{copy.photos.factoryHeading}</h2>
          {ph.caption && <p className="mt-4 max-w-sm text-lg text-[var(--muted)]">{ph.caption}</p>}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ph.src} alt={ph.alt} width={ph.width} height={ph.height} loading="lazy" decoding="async" className="h-auto w-full rounded-[var(--r-card)] border border-[var(--line)]" />
      </div>
    </section>
  );
}
