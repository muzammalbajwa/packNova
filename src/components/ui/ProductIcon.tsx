"use client";

import { useEffect, useId, useRef } from "react";
import "./product-icons.css";

export type IconKind = "corrugated" | "rigid" | "carton" | "pouch" | "poly" | "courier" | "paper";

/** Filled kraft tone + thin outline, both from `currentColor` (so every template's tokens apply). */
const P = ({ points, o, className = "" }: { points: string; o: number; className?: string }) => (
  <polygon className={className} points={points} fill="currentColor" fillOpacity={o} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
);

/** One run of the longest icon animation is 1.4s; the play flag outlives it slightly. */
const PLAY_MS = 1500;

/**
 * Layered line-art icons for the product cards. Every moving piece is a named part (`p-*`), animated in
 * `product-icons.css` with transform/opacity/stroke-dashoffset only. The animation plays when the pointer
 * enters the card, when focus moves into it, on tap, and (touch devices) once when the card scrolls into
 * view. It always finishes at the resting pose, so leaving or re-entering mid-animation never jumps.
 */
export default function ProductIcon({ kind }: { kind: IconKind }) {
  const ref = useRef<SVGSVGElement>(null);
  const gid = `pi-glow-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const card = svg.closest<HTMLElement>(".group") ?? (svg as unknown as HTMLElement);
    let timer: number | undefined;
    const play = () => {
      if (svg.dataset.play === "1") return; // already playing: never restart mid-way
      svg.dataset.play = "1";
      timer = window.setTimeout(() => svg.removeAttribute("data-play"), PLAY_MS);
    };
    card.addEventListener("pointerenter", play);
    card.addEventListener("pointerdown", play);
    card.addEventListener("focusin", play);

    // touch screens have no hover: play once as the card comes into view
    let io: IntersectionObserver | undefined;
    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            play();
            io?.disconnect();
          }
        },
        { threshold: 0.6 },
      );
      io.observe(card);
    }
    return () => {
      card.removeEventListener("pointerenter", play);
      card.removeEventListener("pointerdown", play);
      card.removeEventListener("focusin", play);
      io?.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 120 120" className={`pi pi-${kind} size-full`} fill="none" aria-hidden="true" focusable="false" overflow="visible">
      {kind === "corrugated" && (
        <>
          <P points="20,42 60,62 60,104 20,84" o={0.32} />
          <P points="100,42 60,62 60,104 100,84" o={0.5} />
          {/* the opening, only visible while the flaps are up */}
          <polygon className="pp p-inner" points="60,22 100,42 60,62 20,42" fill="currentColor" fillOpacity={0.55} />
          <P className="pp p-flapL" points="20,42 60,22 80,32 40,52" o={0.18} />
          <P className="pp p-flapR" points="40,52 80,32 100,42 60,62" o={0.18} />
          <path className="pp p-tape" d="M34 55 L86 29" pathLength={100} stroke="var(--pi-accent, var(--accent))" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {kind === "carton" && (
        <>
          <path className="pp p-fold" d="M34 30V104M62 30V104M90 30V104M24 40H100M24 96H100" stroke="var(--pi-accent, var(--accent))" strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" />
          <g className="pp p-lid">
            <P points="34,40 62,28 90,40 62,52" o={0.2} />
          </g>
          <g className="pp p-left">
            <P points="34,40 62,52 62,108 34,96" o={0.32} />
            <path d="M34 56 L62 68" stroke="var(--pi-accent, var(--accent))" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="pp p-right">
            <P points="62,52 90,40 90,96 62,108" o={0.5} />
          </g>
        </>
      )}
      {kind === "rigid" && (
        <>
          <defs>
            <radialGradient id={gid} cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="var(--pi-accent, var(--accent))" stopOpacity="0.95" />
              <stop offset="1" stopColor="var(--pi-accent, var(--accent))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <P points="20,58 60,76 60,106 20,88" o={0.3} />
          <P points="100,58 60,76 60,106 100,88" o={0.48} />
          <polygon className="pp p-glow" points="22,58 60,41 98,58 60,75" fill={`url(#${gid})`} />
          <g className="pp p-rigidlid">
            <P points="16,38 60,58 60,70 16,50" o={0.34} />
            <P points="104,38 60,58 60,70 104,50" o={0.52} />
            <P points="60,18 104,38 60,58 16,38" o={0.2} />
          </g>
        </>
      )}
      {kind === "pouch" && (
        <g className="pp p-body">
          <path d="M36 24h48l8 74q-32 14-64 0z" fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path className="pp p-zipL" d="M37 40h23" stroke="var(--pi-accent, var(--accent))" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 5" />
          <path className="pp p-zipR" d="M60 40h23" stroke="var(--pi-accent, var(--accent))" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 5" />
          <path className="pp p-notch" d="M38 47l7 3-7 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M44 66h32M48 78h24" stroke="currentColor" strokeOpacity={0.6} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {(kind === "courier" || kind === "poly") && (
        <>
          <path d="M26 30h68v72H26z" fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <rect className="pp p-strip" x="40" y="62" width="40" height="8" rx="2" fill="var(--pi-accent, var(--accent))" />
          <path className="pp p-flap" d="M26 30l34 24 34-24z" fill="currentColor" fillOpacity={0.14} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )}
      {kind === "paper" && (
        <>
          <g className="pp p-bag">
            <path className="pp p-handle" d="M42 46C42 20 78 20 78 46" stroke="var(--pi-accent, var(--accent))" strokeWidth="3" strokeLinecap="round" />
            <P points="30,44 90,44 94,104 26,104" o={0.28} />
            <path d="M30 44h60" stroke="currentColor" strokeOpacity={0.6} strokeWidth="2" />
            <path d="M60 44v60" stroke="currentColor" strokeOpacity={0.3} strokeWidth="1.5" />
          </g>
          <g className="pp p-leaf">
            <path d="M88 52C88 38 100 33 108 35C108 47 99 54 88 52Z" fill="var(--pi-accent, var(--accent))" fillOpacity={0.92} />
            <path d="M89 51C95 46 100 42 105 38" stroke="currentColor" strokeOpacity={0.45} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        </>
      )}
    </svg>
  );
}
