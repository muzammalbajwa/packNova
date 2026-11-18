"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { quoteHref, type CatalogPage } from "@/content/catalog";
import { closedProgress, filmProgress, introShare } from "@/film/closed";
import { RECIPE_LOADERS, loadEngine, waitForOtherContexts } from "@/film/loaders";
import { detectDevice } from "@/lib/deviceTier";
import { trackProgress } from "@/lib/scroll";
import { FILM_LAYOUT, HERO_COL, STAGE_BOX } from "./filmLayout";

/** Share of a step (0..1) after which its caption replaces the previous one. */
const CAPTION_LAG = 0.12;

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

export default function Pinned({ page, hero, poster }: { page: CatalogPage; hero: ReactNode; poster: ReactNode }) {
  const n = page.steps.length;
  const I = introShare(n);
  const closed = closedProgress(page.recipe, page.skin);
  const secRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const pRef = useRef(0);
  const setProgressRef = useRef<((P: number) => void) | null>(null);
  const [step, setStep] = useState(-1); // -1: the first screen (headline and the finished product), then steps 0 to n-1
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
      eng.attach(hostRef.current, profile.dpr[1], profile.tier === "high" ? "high" : profile.tier === "low" ? "low" : "mid");
      eng.firstFrame = () => setReady(true);
      eng.onLost = () => setReady(false); // the poster comes back while the context is gone
      eng.onRestored = () => { eng.firstFrame = () => setReady(true); };
      // idle sway of the finished product on the first screen; it fades out as the visitor starts to scroll
      eng.idleAmp = 0.17;
      eng.idleLow = profile.tier === "low";
      const apply = (P: number) => {
        eng.idleFade = Math.max(0, 1 - P / (I * 0.4));
        eng.setProgress(filmProgress(P, n, closed));
      };
      setProgressRef.current = apply;
      apply(pRef.current);
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
  }, [page, n, I, closed]);

  // scroll progress: written to the engine and a CSS variable; React state changes only when the step changes
  useEffect(() => {
    const el = secRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    let cur = -2;
    const st = trackProgress(el, (P) => {
      pRef.current = P;
      stickyRef.current?.style.setProperty("--p", P.toFixed(4));
      setProgressRef.current?.(P);
      // the caption of a step arrives a little after the step starts (the key action is under way) and the previous one stays until then
      const raw = ((P - I) / (1 - I)) * n;
      const idx = P < I ? -1 : raw < 1 ? 0 : Math.min(n - 1, Math.floor(raw - CAPTION_LAG));
      if (idx !== cur) {
        cur = idx;
        setStep(idx);
      }
    }, "top top", "bottom bottom");
    ScrollTrigger.refresh();
    return () => st.kill();
  }, [n, I]);

  const goTo = useCallback((i: number) => {
    const el = secRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * (I + (1 - I) * ((i + 0.5) / n)), behavior: "smooth" });
  }, [n, I]);

  const intro = step < 0;
  const s = page.steps[Math.max(0, step)];
  const d = detailFor(page, Math.max(0, step), n);
  const last = step === n - 1;
  return (
    <section id="how" ref={secRef} aria-label={`How ${page.noun} is made`} className="relative [--film-step:64vh] md:[--film-step:76vh]" style={{ height: `calc(${n + 0.6} * var(--film-step) + 100dvh)` }}>
      <ol className="sr-only">{page.steps.map((x) => <li key={x.action}>{x.title}. {x.caption}</li>)}</ol>
      <div ref={stickyRef} className={FILM_LAYOUT} style={{ ["--p" as string]: 0 }}>
        <div className={HERO_COL}>
          {/* the headline: always in the page (it is the h1); out of view and inert once the steps take over */}
          <div className={`transition-[opacity,transform] duration-300 ${intro ? "" : "pointer-events-none absolute inset-x-0 top-0 -translate-y-2 opacity-0"}`} inert={!intro}>
            {hero}
            <p className="mt-5 hidden text-sm font-semibold text-[var(--kraft-ink)] md:block">Scroll to see how it is made · 01 / {String(n).padStart(2, "0")}</p>
          </div>
          {!intro && (
            <div key={step} className="fade-in" aria-live="polite">
              <p className="font-display text-xl text-[var(--kraft-ink)]">{String(step + 1).padStart(2, "0")} <span className="text-[var(--muted)]">/ {String(n).padStart(2, "0")}</span></p>
              <h2 className="font-display mt-1 text-2xl font-medium leading-[1.1] md:mt-2 md:text-4xl">{s.title}</h2>
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
          )}
        </div>
        <div className={STAGE_BOX}>
          <div className="absolute inset-0 grid place-items-center p-6 transition-opacity duration-500" style={{ opacity: ready ? 0 : 1 }} aria-hidden>
            {poster}
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
