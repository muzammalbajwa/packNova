import { site } from "@/content/site";
import Button from "@/components/ui/Button";
import HeroStage from "@/shared/HeroStage";
import { templateHref } from "@/shared/links";

/** Drawing sheet: headline block left, the box in a ticked frame with W/H/D dimension lines right. */
export default function Hero({ base }: { base: string }) {
  const { hero } = site;
  return (
    <HeroStage
      posterSrc="/textures/hero-poster-industrial.webp"
      posterAlt={hero.posterAlt}
      posterClassName="w-[min(70vw,470px)] max-md:left-1/2 max-md:top-[31%] max-md:-translate-x-1/2 max-md:-translate-y-1/2 md:right-[7vw] md:top-1/2 md:-translate-y-1/2"
      behind={
        <div className="ticks pointer-events-none absolute inset-y-24 right-6 hidden w-[46vw] md:block" aria-hidden>
          <span className="mono absolute left-3 top-3 text-[11px] uppercase text-[var(--muted)]">FIG. 01</span>
          <span className="mono absolute bottom-3 left-3 text-[11px] uppercase text-[var(--muted)]">W × H × D</span>
          <span className="absolute inset-x-8 bottom-9 h-px bg-[var(--fg)]" />
          <span className="absolute bottom-[1.9rem] left-8 h-3 w-px bg-[var(--fg)]" />
          <span className="absolute bottom-[1.9rem] right-8 h-3 w-px bg-[var(--fg)]" />
        </div>
      }
    >
      <div className="relative z-10 flex h-full max-w-[100vw] flex-col justify-end px-5 pb-28 pt-24 md:justify-center md:px-10 md:pb-0">
        <p className="eyebrow border-l-2 border-[var(--accent)] pl-3 uppercase" data-og-eyebrow>
          {hero.eyebrow}
        </p>
        <h1 className="font-display mt-5 max-w-[11ch] text-[clamp(2.9rem,8.4vw,7.6rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em] md:max-w-[9ch]">
          {hero.headline.split(hero.headlineAccent)[0]}
          <span className="text-[var(--accent)]">{hero.headlineAccent}</span>
        </h1>
        <p className="mt-6 max-w-sm border-t border-[var(--fg)] pt-4 text-lg leading-snug text-[var(--muted)]">{hero.sub}</p>
        <div className="mt-8 flex flex-wrap gap-0">
          <Button href={templateHref(base, hero.primary)} track="hero_primary" className="mono uppercase">{hero.primary.label} →</Button>
          <Button href={templateHref(base, hero.secondary)} variant="ghost" track="hero_secondary" className="mono border-l-0 uppercase">{hero.secondary.label}</Button>
        </div>
      </div>
    </HeroStage>
  );
}
