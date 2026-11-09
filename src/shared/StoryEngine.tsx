"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "@/content/site";
import { getLenis, trackProgress } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/track";
import { CTA_AT, STAGES, stageIndex } from "@/lib/making";
import { storyConfiguratorHref, storyWhatsappHref } from "@/lib/storyQuote";

// The 3D chunk is shared by every template and only fetched when the section is about to scroll into view.
const MakingScene = dynamic(() => import("@/components/canvas/making/MakingScene"), { ssr: false });

const M = site.making;
export const STAGE_IDS = STAGES.map((s) => s.id);

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
  /** Index (0-6) of the current stage. */
  stage: number;
  /** True from the "ready" moment: show the full call to action. */
  cta: boolean;
  /** Subtle "Want this box? Get a quote" shows from the fold stage until the full CTA. */
  showQuote: boolean;
  stages: typeof M.stages;
  stageIds: string[];
  /** Smooth-scroll to the clearest moment of stage `i` (the step indicator calls this). */
  goTo: (i: number) => void;
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
  /** Template-styled 7-step list for no WebGL / reduced motion (same copy and CTA). */
  fallback: ReactNode;
}

/**
 * Headless "how your box is made" engine. It owns the lazy canvas, the pinned scroll (700vh
 * desktop, 450vh mobile), the progress and the stage state; templates only supply the layout
 * and styling through `overlay`, `behind` and `canvasClassName`. The model, the 7 stages and the
 * fold order are identical everywhere. The pinned frame exposes `--p` (0..1) and `data-stage`
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

  const api: StoryApi = {
    stage,
    cta,
    showQuote: stage >= 4 && !cta && stage < 6,
    stages: M.stages,
    stageIds: STAGE_IDS,
    goTo,
    links,
  };

  return (
    <section
      id="making"
      ref={setRefs}
      aria-label={M.eyebrow}
      // keep in sync with SCROLL_VH in lib/making.ts (Tailwind needs literal class names)
      className="relative z-10 h-[450vh] md:h-[700vh]"
    >
      <div ref={stickyRef} data-stage={stage} className={`sticky top-0 h-dvh overflow-hidden ${stickyClassName}`} style={{ ["--p" as string]: 0 }}>
        {behind}
        {near.inView || live.inView ? (
          <div className={canvasClassName}>
            <MakingScene active={live.inView} />
          </div>
        ) : null}
        <Overlay {...api} />
      </div>
    </section>
  );
}
