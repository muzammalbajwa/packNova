"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { resolveHref } from "@/lib/links";
import SceneZone from "../canvas/SceneZone";
import Button from "../ui/Button";
import { trackProgress } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";

export default function Hero() {
  const track = useRef<HTMLDivElement>(null);
  const live = useAppStore((s) => s.ready && !!s.profile?.webgl);
  const { hero } = site;
  const [before, after] = hero.headline.split(hero.headlineAccent);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const st = trackProgress(el, (p) => useAppStore.getState().setHeroProgress(p));
    return () => st.kill();
  }, []);

  return (
    <SceneZone id="top" className="relative h-[240vh]">
      {/* Scroll distance that drives the box opening (0 -> 1). */}
      <div ref={track} className="absolute inset-0" />
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_50%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_70%)]" />

        {/* Static poster: eager + high priority, faded out once the live canvas is ready. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/textures/hero-poster.webp"
          alt={hero.posterAlt}
          width={800}
          height={800}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className={`absolute w-[min(78vw,560px)] transition-opacity duration-700 max-md:left-1/2 max-md:top-[26%] max-md:-translate-x-1/2 max-md:-translate-y-1/2 md:right-[6vw] md:top-1/2 md:-translate-y-1/2 ${
            live ? "opacity-0" : "opacity-100"
          }`}
        />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-14 md:justify-center md:pb-0">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 className="font-display mt-5 max-w-[10ch] text-[clamp(3.1rem,9vw,7.6rem)] font-bold leading-[0.92] tracking-[-0.03em]">
            {before}
            <em className="text-[var(--kraft-ink)] not-italic">{hero.headlineAccent}</em>
            {after}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--muted)]">{hero.sub}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href={resolveHref(hero.primary)} track="hero_primary">{hero.primary.label}</Button>
            <Button href={resolveHref(hero.secondary)} variant="ghost" track="hero_secondary">
              {hero.secondary.label}
            </Button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--muted)] md:flex">
          <span className="h-px w-10 bg-[var(--muted)]/50" /> {hero.scrollHint}{" "}
          <span className="h-px w-10 bg-[var(--muted)]/50" />
        </div>
      </div>
    </SceneZone>
  );
}
