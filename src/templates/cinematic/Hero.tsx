import { site } from "@/content/site";
import Button from "@/components/ui/Button";
import HeroStage from "@/shared/HeroStage";
import { templateHref } from "@/shared/links";

/** Giant centred headline over a centred box; a soft spotlight behind it. */
export default function Hero({ base }: { base: string }) {
  const { hero } = site;
  const [before, after] = hero.headline.split(hero.headlineAccent);
  return (
    <HeroStage
      posterSrc="/textures/hero-poster-cinematic.webp"
      posterAlt={hero.posterAlt}
      posterClassName="left-1/2 top-[58%] w-[min(86vw,620px)] -translate-x-1/2 -translate-y-1/2 max-md:top-[44%]"
      behind={<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_58%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_72%)]" />}
    >
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center px-6 pb-28 pt-[16vh] text-center md:pb-12">
        <p className="eyebrow" data-og-eyebrow>{hero.eyebrow}</p>
        <h1 className="font-display mt-5 text-[clamp(3.2rem,11vw,10rem)] font-extrabold leading-[0.86] tracking-[-0.045em]">
          {before}
          <span className="bg-[linear-gradient(120deg,var(--accent),var(--kraft))] bg-clip-text text-transparent">{hero.headlineAccent}</span>
          {after}
        </h1>
        <div className="mt-auto flex w-full flex-col items-center gap-6 md:flex-row md:justify-between">
          <p className="glass max-w-xs rounded-[var(--r-card)] px-5 py-4 text-left text-base leading-relaxed text-[var(--muted)] max-md:max-w-sm">{hero.sub}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={templateHref(base, hero.primary)} track="hero_primary">{hero.primary.label}</Button>
            <Button href={templateHref(base, hero.secondary)} variant="ghost" track="hero_secondary">{hero.secondary.label}</Button>
          </div>
          <p className="hidden text-xs uppercase tracking-[0.3em] text-[var(--muted)] md:block">{hero.scrollHint} ↓</p>
        </div>
      </div>
    </HeroStage>
  );
}
