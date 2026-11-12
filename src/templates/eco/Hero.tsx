import Button from "@/components/ui/Button";
import HeroStage from "@/shared/HeroStage";
import { templateHref } from "@/shared/links";
import { copy } from "./copy";

/** Plain left-aligned cover: one heading, one paragraph, two buttons. The live 3D box sits on the right. */
export default function Hero({ base }: { base: string }) {
  const { hero } = copy;
  return (
    <HeroStage
      posterSrc="/textures/hero-poster-eco.webp"
      posterAlt={hero.posterAlt}
      posterClassName="w-[min(78vw,520px)] max-md:left-1/2 max-md:top-[30%] max-md:-translate-x-1/2 max-md:-translate-y-1/2 md:right-[6vw] md:top-1/2 md:-translate-y-1/2"
    >
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-28 pt-24 md:justify-center md:pb-0">
        <p className="text-base font-semibold text-[var(--kraft-ink)]" data-og-eyebrow>{hero.kicker}</p>
        <h1 className="font-display mt-3 max-w-[14ch] text-[clamp(2.5rem,4.6vw,4rem)] font-medium leading-[1.06]">{hero.headline}</h1>
        <p className="mt-6 max-w-[34rem] text-lg text-[var(--muted)]">{hero.sub}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={templateHref(base, hero.primary)} track="hero_primary" className="!px-7 !py-3.5 !text-base !font-semibold">{hero.primary.label}</Button>
          <Button href={templateHref(base, hero.secondary)} variant="ghost" track="hero_secondary" className="!px-7 !py-3.5 !text-base !font-semibold">{hero.secondary.label}</Button>
        </div>
      </div>
    </HeroStage>
  );
}
