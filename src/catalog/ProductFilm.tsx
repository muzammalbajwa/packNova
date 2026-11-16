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

/** "How it is made": the pinned 3D film where it can run, the plain step list everywhere else. */
export default function ProductFilm({ page }: { page: CatalogPage }) {
  const [film, setFilm] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFilm(detectDevice().webgl && !reduced && hasFilm(page.recipe)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [page.recipe]);
  return film ? <Pinned page={page} /> : <StaticSteps page={page} />;
}
