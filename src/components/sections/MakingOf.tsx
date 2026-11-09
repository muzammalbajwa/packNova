"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/content/site";
import { getLenis, trackProgress } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/track";
import { CTA_AT, STAGES, stageIndex } from "@/lib/making";
import { storyConfiguratorHref, storyWhatsappHref } from "@/lib/storyQuote";
import StageArt from "../ui/StageArt";

// The 3D chunk is only fetched when the section is about to scroll into view.
const MakingScene = dynamic(() => import("../canvas/making/MakingScene"), { ssr: false });

const M = site.making;
const STAGE_IDS = STAGES.map((s) => s.id);

/** Final call to action. Both buttons carry the story box (type + size) into the quote flow. */
function StoryCta({ className = "" }: { className?: string }) {
  const setPrefill = useAppStore((s) => s.setQuotePrefill);
  return (
    <div className={className}>
      <h3 className="font-display text-[1.9rem] font-bold leading-[1.02] tracking-[-0.025em] md:text-6xl">{M.cta.title}</h3>
      <p className="mt-4 hidden max-w-md text-lg leading-relaxed text-[var(--muted)] md:block">{M.cta.body}</p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 md:mt-7">
        <a
          href={storyConfiguratorHref()}
          onClick={() => track("story_cta_configurator")}
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-7 py-3 text-base md:py-3.5 font-medium text-[var(--on-accent)] transition-colors duration-300 hover:bg-[var(--fg)]"
        >
          {M.cta.primary}
        </a>
        <a
          href={storyWhatsappHref()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setPrefill({ product: M.quoteProduct, note: M.quoteNote });
            track("story_cta_whatsapp");
          }}
          className="inline-flex items-center justify-center rounded-full border border-[var(--line-strong)] px-7 py-3 text-base md:py-3.5 font-medium text-[var(--fg)] transition-colors duration-300 hover:border-[var(--fg)]"
        >
          {M.cta.secondary}
        </a>
      </div>
    </div>
  );
}

/** Seven illustrated steps. Shown without WebGL, with reduced motion, and before JS decides. */
function MakingList() {
  return (
    <section id="making" aria-labelledby="making-h" className="relative z-10 bg-[var(--bg)] px-6 py-24 md:py-36">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">{M.eyebrow}</p>
        <h2 id="making-h" className="font-display mt-4 max-w-2xl text-5xl font-bold leading-[0.98] tracking-[-0.03em] md:text-7xl">
          From flat board to finished box.
        </h2>
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {M.stages.map((s, i) => (
            <li key={s.step} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <StageArt id={STAGE_IDS[i]} className="size-24" />
              <p className="mt-4 font-display text-sm tabular-nums text-[var(--accent)]">
                {String(i + 1).padStart(2, "0")} / {String(M.stages.length).padStart(2, "0")}
              </p>
              <h3 className="font-display mt-1 text-2xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[var(--muted)]">{s.line}</p>
            </li>
          ))}
        </ol>
        <StoryCta className="mt-16" />
      </div>
    </section>
  );
}

function scrollToProgress(el: HTMLElement, p: number) {
  const top = el.getBoundingClientRect().top + window.scrollY;
  const y = top + (el.offsetHeight - window.innerHeight) * p;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

function MakingPinned() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const railY = useRef<HTMLDivElement>(null);
  const railX = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [cta, setCta] = useState(false);
  const setPrefill = useAppStore((s) => s.setQuotePrefill);

  // "near" mounts the canvas shortly before the section; "live" renders only while it is on screen.
  const near = useInView({ rootMargin: "100% 0px" });
  const live = useInView({ rootMargin: "0px" });
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      sectionRef.current = node;
      near.ref(node);
      live.ref(node);
    },
    [near, live],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let cur = -1;
    let ctaOn = false;
    const st = trackProgress(
      el,
      (p) => {
        useAppStore.getState().setMakingProgress(p);
        if (railY.current) railY.current.style.transform = `scaleY(${p})`;
        if (railX.current) railX.current.style.transform = `scaleX(${p})`;
        const idx = stageIndex(p);
        if (idx !== cur) {
          cur = idx;
          setStage(idx); // only on stage change, never per frame
        }
        const on = p >= CTA_AT;
        if (on !== ctaOn) {
          ctaOn = on;
          setCta(on);
        }
      },
      "top top",
      "bottom bottom",
    );
    // the section changed height when it replaced the static list: re-measure every trigger
    ScrollTrigger.refresh();
    return () => st.kill();
  }, []);

  const showQuote = stage >= 4 && !cta && stage < 6;
  const s = M.stages;

  return (
    <section
      id="making"
      ref={setRefs}
      aria-label={M.eyebrow}
      // keep in sync with SCROLL_VH in lib/making.ts (Tailwind needs literal class names)
      className="relative z-10 h-[450vh] bg-[var(--bg)] md:h-[700vh]"
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        {near.inView || live.inView ? (
          <div className="absolute inset-0">
            <MakingScene active={live.inView} />
          </div>
        ) : null}

        {/* copy */}
        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-[7.75rem] md:justify-center md:pb-0">
          <p className="eyebrow mb-5">{M.eyebrow}</p>
          <div className="relative min-h-[15.5rem] md:min-h-[20rem] md:max-w-[30rem]" aria-live="polite">
            {s.map((c, i) => {
              const last = i === s.length - 1;
              const active = i === stage;
              return (
                <div
                  key={c.step}
                  aria-hidden={!active}
                  className={`absolute inset-x-0 top-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${
                    active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
                  }`}
                >
                  <span className="font-display text-sm tabular-nums text-[var(--accent)]">
                    {String(i + 1).padStart(2, "0")} / {String(s.length).padStart(2, "0")}
                  </span>
                  {last && cta ? (
                    <StoryCta className="pointer-events-auto mt-2" />
                  ) : (
                    <>
                      <h2 className="font-display mt-2 text-4xl font-bold leading-[1] tracking-[-0.03em] md:text-6xl">{c.title}</h2>
                      <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">{c.line}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {showQuote && (
            <a
              href="#quote"
              onClick={() => {
                setPrefill({ product: M.quoteProduct, note: M.quoteNote });
                track("story_quote_button", { stage: STAGE_IDS[stage] });
              }}
              className="pointer-events-auto mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--fg)] transition-colors hover:border-[var(--fg)] hover:bg-[var(--wash)]"
            >
              {M.quoteButton} <span aria-hidden>→</span>
            </a>
          )}
        </div>

        {/* step indicator: vertical on desktop, along the bottom on mobile */}
        <nav
          aria-label={M.stepsLabel}
          className="absolute inset-x-4 bottom-[4.75rem] z-20 md:inset-x-auto md:bottom-auto md:right-8 md:top-1/2 md:-translate-y-1/2"
        >
          <div className="relative md:pl-1">
            <div className="absolute left-3 right-3 top-[0.72rem] h-px bg-[var(--line)] md:inset-x-auto md:bottom-3 md:left-[0.72rem] md:right-auto md:top-3 md:h-auto md:w-px">
              <div ref={railX} className="h-full w-full origin-left bg-[var(--accent)] md:hidden" style={{ transform: "scaleX(0)" }} />
              <div ref={railY} className="hidden h-full w-full origin-top bg-[var(--accent)] md:block" style={{ transform: "scaleY(0)" }} />
            </div>
            <ol className="relative flex justify-between md:flex-col md:gap-5">
              {s.map((c, i) => (
                <li key={c.step}>
                  <button
                    type="button"
                    aria-current={i === stage ? "step" : undefined}
                    aria-label={`${i + 1}. ${c.step}`}
                    onClick={() => {
                      track("story_step_click", { step: STAGE_IDS[i] });
                      if (sectionRef.current) scrollToProgress(sectionRef.current, STAGES[i].anchor);
                    }}
                    className="group flex items-center gap-3 md:flex-row"
                  >
                    <span
                      className={`grid size-6 place-items-center rounded-full border text-[11px] font-medium tabular-nums transition-colors duration-300 ${
                        i === stage
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                          : i < stage
                            ? "border-[var(--accent)] bg-[var(--bg)] text-[var(--fg)]"
                            : "border-[var(--line-strong)] bg-[var(--bg)] text-[var(--muted)] group-hover:border-[var(--fg)]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={`hidden text-sm transition-colors duration-300 md:inline ${
                        i === stage ? "font-medium text-[var(--fg)]" : "text-[var(--muted)] group-hover:text-[var(--fg)]"
                      }`}
                    >
                      {c.step}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      </div>
    </section>
  );
}

export default function MakingOf() {
  const profile = useAppStore((s) => s.profile);
  const reduced = useAppStore((s) => s.reducedMotion);
  return profile?.webgl && !reduced ? <MakingPinned /> : <MakingList />;
}


