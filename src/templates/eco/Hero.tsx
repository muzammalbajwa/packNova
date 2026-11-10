import { site } from "@/content/site";
import Button from "@/components/ui/Button";
import HeroStage from "@/shared/HeroStage";
import { templateHref } from "@/shared/links";

/** Friendly cover: big rounded type, sticker chips, a morphing blob behind the box. */
export default function Hero({ base }: { base: string }) {
  const { hero } = site;
  const [before, after] = hero.headline.split(hero.headlineAccent);
  const chips = site.marquee.filter((t) => t === "Eco-friendly" || t === "Made to Order" || t === "Custom Printing");
  return (
    <HeroStage
      posterSrc="/textures/hero-poster-eco.webp"
      posterAlt={hero.posterAlt}
      posterClassName="w-[min(78vw,540px)] max-md:left-1/2 max-md:top-[30%] max-md:-translate-x-1/2 max-md:-translate-y-1/2 md:right-[5vw] md:top-1/2 md:-translate-y-1/2"
      behind={
        <>
          <div className="morph pointer-events-none absolute right-[-6vw] top-[8%] hidden size-[54vw] max-h-[88vh] border-2 border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] md:block" aria-hidden />
          <div className="morph pointer-events-none absolute left-1/2 top-[6%] size-[88vw] -translate-x-1/2 border-2 border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] md:hidden" aria-hidden />
        </>
      }
    >
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-28 pt-24 md:justify-center md:pb-0">
        <p className="w-fit rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--on-accent)]" data-og-eyebrow>
          {hero.eyebrow}
        </p>
        <h1 className="font-display mt-5 max-w-[9ch] text-[clamp(3.2rem,9.4vw,8.4rem)] font-extrabold leading-[0.92] tracking-[-0.03em]">
          {before}
          <span className="relative inline-block text-[var(--accent)]">{hero.headlineAccent}</span>
          {after}
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--muted)]">{hero.sub}</p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-hidden>
          {chips.map((c, i) => (
            <li key={c} className={`sticker rounded-full border-2 border-[var(--accent)] px-3.5 py-1 text-sm font-bold text-[var(--accent)]`} style={{ animationDelay: `${i * 0.7}s` }}>{c}</li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={templateHref(base, hero.primary)} track="hero_primary" className="!px-8 !py-4 !text-base font-bold">{hero.primary.label}</Button>
          <Button href={templateHref(base, hero.secondary)} variant="ghost" track="hero_secondary" className="!px-8 !py-4 !text-base font-bold">{hero.secondary.label}</Button>
        </div>
      </div>
    </HeroStage>
  );
}
