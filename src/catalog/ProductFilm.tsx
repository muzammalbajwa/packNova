"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { CatalogPage } from "@/content/catalog";
import { hasFilm } from "@/film/loaders";
import { detectDevice } from "@/lib/deviceTier";

const h2 = "font-display text-3xl font-medium leading-[1.1] md:text-4xl";
// the pinned 3D film (GSAP, ScrollTrigger, the film engine's loader code) is its own chunk, fetched only where the film runs
const Pinned = dynamic(() => import("./ProductFilmPinned"), { ssr: false });

/** The steps as a plain list: server render, no WebGL, reduced motion, or a recipe without a film yet. */
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

/**
 * "How it is made": the pinned 3D film where it can run, the plain step list everywhere else.
 * The film section is much taller than the list, so its height is reserved from the first paint (unless the visitor asked for reduced motion)
 * and kept while the film code loads: nothing below it jumps (no layout shift). Once we know there will be no film, the reservation is dropped.
 */
export default function ProductFilm({ page }: { page: CatalogPage }) {
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
      className={`[--film-step:64vh] md:[--film-step:76vh] ${reserve ? "motion-safe:min-h-[calc(var(--n)*var(--film-step)+100dvh)]" : ""}`}
      style={{ ["--n" as string]: page.steps.length }}
    >
      {film ? <Pinned page={page} /> : <StaticSteps page={page} />}
    </div>
  );
}
