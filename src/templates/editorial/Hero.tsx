import { site } from "@/content/site";
import Button from "@/components/ui/Button";
import HeroStage from "@/shared/HeroStage";
import { templateHref } from "@/shared/links";

/** Magazine cover: oversized serif headline pinned left, thin rules, the box on the right. */
export default function Hero({ base }: { base: string }) {
  const { hero } = site;
  const [before, after] = hero.headline.split(hero.headlineAccent);
  return (
    <HeroStage
      posterSrc="/textures/hero-poster-editorial.webp"
      posterAlt={hero.posterAlt}
      posterClassName="w-[min(78vw,540px)] max-md:left-1/2 max-md:top-[30%] max-md:-translate-x-1/2 max-md:-translate-y-1/2 md:right-[5vw] md:top-1/2 md:-translate-y-1/2"
    >
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-28 pt-24 md:justify-center md:pb-0">
        <div className="flex items-center gap-4 border-t border-[var(--fg)] pt-3 md:max-w-[52%]">
          <span className="font-display text-sm italic">No. 01</span>
          <p className="eyebrow" data-og-eyebrow>
            {hero.eyebrow}
          </p>
        </div>
        <h1 className="font-display mt-6 max-w-[9ch] text-[clamp(3.4rem,10.5vw,9.5rem)] font-light leading-[0.9] tracking-[-0.03em] md:max-w-[8ch]">
          {before}
          <em className="text-[var(--kraft-ink)]">{hero.headlineAccent}</em>
          {after}
        </h1>
        <p className="mt-7 max-w-sm border-l border-[var(--fg)] pl-5 text-lg leading-relaxed text-[var(--muted)]">{hero.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button href={templateHref(base, hero.primary)} track="hero_primary">
            {hero.primary.label}
          </Button>
          <Button href={templateHref(base, hero.secondary)} variant="ghost" track="hero_secondary">
            {hero.secondary.label}
          </Button>
        </div>
        <p className="absolute bottom-6 right-6 hidden text-xs uppercase tracking-[0.3em] text-[var(--muted)] md:block">{hero.scrollHint} ↓</p>
      </div>
    </HeroStage>
  );
}
