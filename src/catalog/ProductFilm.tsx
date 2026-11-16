"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import type { CatalogPage } from "@/content/catalog";
import { hasFilm } from "@/film/loaders";
import { detectDevice } from "@/lib/deviceTier";
import { FILM_LAYOUT, HERO_COL, STAGE_BOX } from "./filmLayout";

const h2 = "font-display text-3xl font-medium leading-[1.1] md:text-4xl";
// the pinned 3D film (GSAP, ScrollTrigger, the film engine's loader code) is its own chunk, fetched only where the film runs
const Pinned = dynamic(() => import("./ProductFilmPinned"), { ssr: false });

/** The steps as a plain list: no WebGL, reduced motion, or a recipe without a film. */
function StaticSteps({ page }: { page: CatalogPage }) {
  return (
    <section id="how" aria-labelledby="how-h" className="border-t border-[var(--line)] px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 id="how-h" className={h2}>How {/^[aeiou]/i.test(page.noun) ? "an" : "a"} {page.noun} is made</h2>
        <ol className="mt-8 border-t border-[var(--line-strong)]">
          {page.steps.map((s, i) => (
            <li key={s.action} className="grid grid-cols-[3.5rem_1fr] gap-x-5 border-b border-[var(--line)] py-5 md:grid-cols-[4rem_1fr_1.2fr]">
              <span className="font-display pt-1 text-lg text-[var(--kraft-ink)]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-xl font-medium md:text-2xl">{s.title}</h3>
              <p className="col-start-2 text-[var(--muted)] md:col-start-auto">{s.caption}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** First screen as the server draws it (and what a visitor without the film sees): the headline on the left, the stage with the poster on the right. */
function Intro({ hero, poster, page, sticky }: { hero: ReactNode; poster: ReactNode; page: CatalogPage; sticky: boolean }) {
  return (
    <div className={sticky ? FILM_LAYOUT : "flex flex-col gap-4 px-4 pb-10 pt-4 md:grid md:grid-cols-[1fr_1.25fr] md:items-center md:gap-10 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:pb-14"}>
      <div className={HERO_COL}>
        {hero}
        {sticky && <p className="mt-5 hidden text-sm font-semibold text-[var(--kraft-ink)] md:block">Scroll to see how it is made · 01 / {String(page.steps.length).padStart(2, "0")}</p>}
      </div>
      <div className={sticky ? STAGE_BOX : "stage order-2 min-h-[40dvh] md:h-[min(66dvh,38rem)]"} aria-hidden>
        <div className="absolute inset-0 grid place-items-center p-6">{poster}</div>
      </div>
    </div>
  );
}

/**
 * The top of a product page: the headline (`hero`) and the 3D film are ONE composition. The film section is the first thing on the page: the
 * headline on the left, the stage on the right with the finished product already on it, and the steps start at scroll 0.
 * The film is much taller than the plain page, so its height is reserved from the first paint and kept while the film code loads (no layout
 * shift); a visitor who gets no film (no WebGL, reduced motion) gets the same first screen followed by the step list.
 */
export default function ProductFilm({ page, hero, poster }: { page: CatalogPage; hero: ReactNode; poster: ReactNode }) {
  const [film, setFilm] = useState(false);
  const [decided, setDecided] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* eslint-disable react-hooks/set-state-in-effect */
    setFilm(detectDevice().webgl && !reduced && hasFilm(page.recipe));
    setDecided(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [page.recipe]);
  const reserve = !decided || film;
  return (
    <div
      id="film-top"
      className={`-mt-[6.25rem] [--film-step:64vh] md:[--film-step:76vh] ${reserve ? "motion-safe:min-h-[calc(var(--n)*var(--film-step)+100dvh)]" : "pt-[6.25rem]"}`}
      style={{ ["--n" as string]: page.steps.length + 0.6 }}
    >
      {film ? <Pinned page={page} hero={hero} poster={poster} /> : decided ? <><Intro hero={hero} poster={poster} page={page} sticky={false} /><StaticSteps page={page} /></> : <Intro hero={hero} poster={poster} page={page} sticky />}
    </div>
  );
}
