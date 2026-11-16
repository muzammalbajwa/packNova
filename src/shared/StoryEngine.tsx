"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/content/site";
import { getLenis, trackProgress } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/track";
import { CHAPTERS, CTA_AT, STAGES, chapterOf, stageIndex } from "@/lib/making";
import { storyConfiguratorHref, storyWhatsappHref } from "@/lib/storyQuote";

// The 3D chunk is shared by every template and only fetched when the section is about to scroll into view.
const MakingScene = dynamic(() => import("@/components/canvas/making/MakingScene"), { ssr: false });

const M = site.making;
export const STAGE_IDS: string[] = STAGES.map((s) => s.id);

/** The two step-indicator chapters ("Made", "Shipped") with their copy and stage range. */
export const CHAPTER_LIST = CHAPTERS.map((c, i) => ({ ...c, label: M.chapters[i].label, count: c.to - c.from + 1 }));
export type Chapter = (typeof CHAPTER_LIST)[number];

/** CTA targets and handlers every template wires into its own buttons. */
export function useStoryLinks(base: string) {
  const setPrefill = useAppStore((s) => s.setQuotePrefill);
  return {
    configuratorHref: storyConfiguratorHref(base),
    whatsappHref: storyWhatsappHref(),
    quoteHref: "#quote",
    onConfigurator: () => track("story_cta_configurator"),
    onWhatsapp: () => {
      setPrefill({ product: M.quoteProduct, note: M.quoteNote });
      track("story_cta_whatsapp");
    },
    onQuote: (stage?: string) => {
      setPrefill({ product: M.quoteProduct, note: M.quoteNote });
      track("story_quote_button", { stage });
    },
  };
}

export interface StoryApi {
  /** Index (0-11) of the current stage: 0-6 are the "Made" chapter, 7-11 the "Shipped" chapter. */
  stage: number;
  /** Index (0-1) of the chapter that contains the current stage. */
  chapter: number;
  chapters: Chapter[];
  /** True from the "ready" moment (inside the last stage, "Delivered"): show the full call to action. */
  cta: boolean;
  /** Subtle "Want this box? Get a quote" shows from the fold stage to the end of the "Made" chapter. */
  showQuote: boolean;
  stages: typeof M.stages;
  stageIds: string[];
  /** Smooth-scroll to the clearest moment of stage `i` (the step indicator calls this). */
  goTo: (i: number) => void;
  /** Smooth-scroll to the first stage of chapter `c` (used by a collapsed chapter chip). */
  goToChapter: (c: number) => void;
  links: ReturnType<typeof useStoryLinks>;
}

interface Props {
  base: string;
  /** Positions the canvas inside the pinned frame (full-bleed, half, panel, card...). */
  canvasClassName: string;
  /** Extra classes on the pinned frame. */
  stickyClassName?: string;
  /** Decoration rendered behind the canvas, inside the pinned frame. */
  behind?: ReactNode;
  /** Template-specific title, step copy, step indicator and CTA, drawn over the canvas. */
  overlay: ComponentType<StoryApi>;
  /** Template-styled 12-step list (two chapters) for no WebGL / reduced motion (same copy and CTA). */
  fallback: ReactNode;
}

/**
 * Headless "how your box is made, and shipped" engine. It owns the lazy canvas, the pinned scroll (1200vh
 * desktop, 780vh mobile: the original 7-stage film plus the shipping journey), the progress and the stage
 * state; templates only supply the layout and styling through `overlay`, `behind` and `canvasClassName`.
 * The model, the 12 stages and the fold order are identical everywhere. The pinned frame exposes `--p` (0..1) and `data-stage`
 * so templates can style progress bars and states in plain CSS without per-frame React state.
 */
export default function StoryEngine(props: Props) {
  const profile = useAppStore((s) => s.profile);
  const reduced = useAppStore((s) => s.reducedMotion);
  return profile?.webgl && !reduced ? <Pinned {...props} /> : <>{props.fallback}</>;
}

function scrollToProgress(el: HTMLElement, p: number) {
  const top = el.getBoundingClientRect().top + window.scrollY;
  const y = top + (el.offsetHeight - window.innerHeight) * p;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

function Pinned({ base, canvasClassName, stickyClassName = "", behind, overlay: Overlay }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [cta, setCta] = useState(false);
  const links = useStoryLinks(base);

  // The canvas is mounted (and its shaders/textures warmed) before the visitor can reach the section. High tier (desktop): in
  // idle time right after the page is ready. Mid and low tier (phones): the build costs about 1.5 s of main-thread time on a
  // phone, so it waits for the first sign of a visitor (scroll, touch, key, pointer) instead of competing with the page load.
  // "live" only switches it to continuous rendering. `__eagerStory` is set by the test scripts (they never send input).
  const ready = useAppStore((s) => s.ready);
  const tier = useAppStore((s) => s.profile?.tier);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!ready || !tier) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void; __eagerStory?: boolean };
    const cleanups: (() => void)[] = [];
    const idle = () => {
      if (w.requestIdleCallback) {
        const h = w.requestIdleCallback(() => setMounted(true), { timeout: 1200 });
        cleanups.push(() => w.cancelIdleCallback?.(h));
      } else {
        const h = window.setTimeout(() => setMounted(true), 300);
        cleanups.push(() => window.clearTimeout(h));
      }
    };
    if (tier === "high" || w.__eagerStory) idle();
    else {
      const events = ["scroll", "wheel", "touchstart", "pointerdown", "pointermove", "keydown"] as const;
      const go = () => {
        events.forEach((e) => window.removeEventListener(e, go));
        idle();
      };
      events.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
      cleanups.push(() => events.forEach((e) => window.removeEventListener(e, go)));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [ready, tier]);
  const live = useInView({ rootMargin: "0px" });
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      sectionRef.current = node;
      live.ref(node);
    },
    [live],
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
        stickyRef.current?.style.setProperty("--p", p.toFixed(4));
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
    ScrollTrigger.refresh(); // the section replaced the static list: re-measure every trigger
    return () => st.kill();
  }, []);

  const goTo = useCallback((i: number) => {
    track("story_step_click", { step: STAGE_IDS[i] });
    if (sectionRef.current) scrollToProgress(sectionRef.current, STAGES[i].anchor);
  }, []);
  const goToChapter = useCallback((c: number) => {
    track("story_chapter_click", { chapter: CHAPTERS[c].id });
    if (sectionRef.current) scrollToProgress(sectionRef.current, STAGES[CHAPTERS[c].from].anchor);
  }, []);

  const api: StoryApi = {
    stage,
    chapter: chapterOf(stage),
    chapters: CHAPTER_LIST,
    cta,
    showQuote: stage >= 4 && stage <= 6,
    stages: M.stages,
    stageIds: STAGE_IDS,
    goTo,
    goToChapter,
    links,
  };

  return (
    <section
      id="making"
      ref={setRefs}
      aria-label={M.eyebrow}
      // keep in sync with SCROLL_VH in lib/making.ts (Tailwind needs literal class names)
      className="relative z-10 h-[780vh] md:h-[1200vh]"
    >
      <div ref={stickyRef} data-stage={stage} // opaque: the fixed hero canvas (the closed box) must never show through behind the story
      className={`sticky top-0 h-dvh overflow-hidden bg-[var(--bg)] ${stickyClassName}`} style={{ ["--p" as string]: 0 }}>
        {behind}
        {mounted || live.inView ? (
          <div className={canvasClassName}>
            <MakingScene active={live.inView} />
          </div>
        ) : null}
        <Overlay {...api} />
      </div>
    </section>
  );
}
