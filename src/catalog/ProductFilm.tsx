"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { quoteHref, type CatalogPage } from "@/content/catalog";
import { RECIPE_LOADERS, hasFilm, loadEngine, waitForOtherContexts } from "@/film/loaders";
import { detectDevice } from "@/lib/deviceTier";
import { trackProgress } from "@/lib/scroll";
import ProductPoster from "./ProductPoster";

const h2 = "font-display text-3xl font-medium leading-[1.1] md:text-4xl";

/** The page detail that sits next to a step (what it is, materials, sizes, finishes, uses, order, a question). */
function detailFor(page: CatalogPage, i: number, n: number): { label: string; body: string } {
  const spec = (l: string) => page.specs.find((s) => s.label === l)?.value ?? "";
  const kinds = 7;
  const k = n < 2 ? 0 : Math.round((i * (kinds - 1)) / (n - 1));
  switch (k) {
    case 0: return { label: "What it is", body: page.short };
    case 1: return { label: "Materials", body: spec("Materials") };
    case 2: return { label: "Sizes", body: spec("Sizes") };
    case 3: return { label: "Finishes", body: page.finishes.join(", ") };
    case 4: return { label: "Good for", body: page.uses.join(", ") };
    case 5: return { label: "Minimum order and lead time", body: `${spec("Minimum order")} ${spec("Lead time")}` };
    default: return { label: page.faq[0].q, body: page.faq[0].a };
  }
}

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

function Pinned({ page }: { page: CatalogPage }) {
  const n = page.steps.length;
  const secRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const pRef = useRef(0);
  const setProgressRef = useRef<((p: number) => void) | null>(null);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  // build the film in idle time: one canvas for the whole page, fetched as its own chunks
  useEffect(() => {
    let dead = false;
    let detach: (() => void) | null = null;
    const profile = detectDevice();
    const start = async () => {
      const [{ getEngine }, mod] = await Promise.all([loadEngine(), RECIPE_LOADERS[page.recipe]!(), waitForOtherContexts()]);
      if (dead || !hostRef.current) return;
      const eng = getEngine();
      eng.attach(hostRef.current, profile.dpr[1]);
      eng.firstFrame = () => setReady(true);
      setProgressRef.current = (p) => eng.setProgress(p);
      eng.setProgress(pRef.current);
      await eng.mount(mod.default({ skin: page.skin, steps: page.steps, low: profile.tier === "low" }));
      detach = () => eng.detach();
    };
    const warm = !!window.__film; // the renderer from the previous film page is still alive: no need to wait for idle time
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
    const h = warm ? window.setTimeout(() => void start(), 0) : w.requestIdleCallback ? w.requestIdleCallback(() => void start(), { timeout: 1500 }) : window.setTimeout(() => void start(), 200);
    const ric = !warm && !!w.requestIdleCallback;
    return () => {
      dead = true;
      if (ric) w.cancelIdleCallback?.(h);
      else window.clearTimeout(h);
      setProgressRef.current = null;
      detach?.();
    };
  }, [page]);

  // scroll progress: written to the engine and a CSS variable; React state changes only when the step changes
  useEffect(() => {
    const el = secRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    let cur = -1;
    const st = trackProgress(el, (p) => {
      pRef.current = p;
      stickyRef.current?.style.setProperty("--p", p.toFixed(4));
      setProgressRef.current?.(p);
      const idx = Math.min(n - 1, Math.floor(p * n));
      if (idx !== cur) {
        cur = idx;
        setStep(idx);
      }
    }, "top top", "bottom bottom");
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [n]);

  const goTo = useCallback((i: number) => {
    const el = secRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * ((i + 0.5) / n), behavior: "smooth" });
  }, [n]);

  const s = page.steps[step];
  const d = detailFor(page, step, n);
  const last = step === n - 1;
  return (
    <section id="how" ref={secRef} aria-labelledby="how-h" className="relative border-t border-[var(--line)] [--film-step:64vh] md:[--film-step:76vh]" style={{ height: `calc(${n} * var(--film-step) + 100dvh)` }}>
      <h2 id="how-h" className="sr-only">How {page.noun} is made</h2>
      <ol className="sr-only">{page.steps.map((x) => <li key={x.action}>{x.title}. {x.caption}</li>)}</ol>
      <div ref={stickyRef} className="sticky top-0 flex h-dvh flex-col gap-3 overflow-hidden px-4 pb-[4.9rem] pt-[6.4rem] md:grid md:grid-cols-[1fr_1.25fr] md:items-center md:gap-10 md:px-6 md:pb-20 md:pt-[6.8rem]" style={{ ["--p" as string]: 0 }}>
        <div className="relative z-10 order-2 mx-auto w-full max-w-xl md:order-1 md:mx-0 md:max-w-md md:pl-4 lg:pl-10">
          <div key={step} className="fade-in" aria-live="polite">
            <p className="font-display text-xl text-[var(--kraft-ink)]">{String(step + 1).padStart(2, "0")} <span className="text-[var(--muted)]">/ {String(n).padStart(2, "0")}</span></p>
            <h3 className="font-display mt-1 text-2xl font-medium leading-[1.1] md:mt-2 md:text-4xl">{s.title}</h3>
            <p className="mt-2 text-base text-[var(--muted)] md:mt-3 md:text-lg">{s.caption}</p>
            <div className="mt-4 border-t border-[var(--line-strong)] pt-3 md:mt-6 md:pt-4">
              <p className="text-sm font-semibold text-[var(--kraft-ink)]">{d.label}</p>
              <p className="mt-1 text-base md:text-lg">{d.body}</p>
              {last && (
                <Link href={quoteHref(page.quote.product, page.quote.note)} className="mt-4 inline-flex rounded-[var(--r-btn)] bg-[var(--accent)] px-5 py-3 font-semibold text-[var(--on-accent)] hover:bg-[var(--fg)]">
                  Get a quote for {page.title}
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="relative order-1 min-h-0 flex-1 overflow-hidden rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] md:order-2 md:h-full md:max-h-[34rem] md:flex-none">
          <div className="absolute inset-0 grid place-items-center p-6 transition-opacity duration-500" style={{ opacity: ready ? 0 : 1 }} aria-hidden>
            <ProductPoster page={page} className="h-full max-h-80 w-full" />
          </div>
          <div ref={hostRef} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: ready ? 1 : 0 }} />
        </div>
        <nav aria-label="Steps" className="relative z-20 order-3 md:absolute md:inset-x-0 md:bottom-5 md:px-3">
          <div className="mx-auto mb-2 h-px max-w-3xl bg-[var(--line)]"><div className="h-0.5 origin-left bg-[var(--accent)] [transform:scaleX(var(--p))]" /></div>
          <ol className="mx-auto flex max-w-3xl items-center justify-between gap-1 overflow-x-auto">
            {page.steps.map((x, i) => (
              <li key={x.action}>
                <button type="button" aria-current={i === step ? "step" : undefined} aria-label={`${i + 1}. ${x.title}`} onClick={() => goTo(i)} className={`rounded-[var(--r-btn)] px-3 py-2 text-sm font-semibold ${i === step ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--muted)] hover:bg-[var(--wash)]"}`}>{i + 1}</button>
              </li>
            ))}
          </ol>
        </nav>
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
