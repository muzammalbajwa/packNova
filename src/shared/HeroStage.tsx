"use client";

import { useEffect, useRef, type ReactNode } from "react";
import SceneZone from "@/components/canvas/SceneZone";
import { trackProgress } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";

interface Props {
  /** Template-specific poster (a render of the hero box in this template's colors). */
  posterSrc: string;
  posterAlt: string;
  /** Position/size classes for the poster (it sits where the live 3D box will be). */
  posterClassName: string;
  /** Decoration behind the box. */
  behind?: ReactNode;
  /** The template's hero copy and buttons. */
  children: ReactNode;
}

/**
 * Hero scroll engine: pins the hero for 240vh, writes the 0..1 progress that opens the box on the
 * shared fixed canvas, and shows a static poster until the live canvas is ready.
 */
export default function HeroStage({ posterSrc, posterAlt, posterClassName, behind, children }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const live = useAppStore((s) => s.ready && !!s.profile?.webgl);

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
        {behind}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          alt={posterAlt}
          width={800}
          height={800}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className={`absolute transition-opacity duration-700 ${posterClassName} ${live ? "opacity-0" : "opacity-100"}`}
        />
        {children}
      </div>
    </SceneZone>
  );
}
