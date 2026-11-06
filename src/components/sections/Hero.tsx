"use client";

import { useEffect, useRef } from "react";
import SceneZone from "../canvas/SceneZone";
import Button from "../ui/Button";
import { trackProgress } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const live = useAppStore((s) => s.ready && !!s.profile?.webgl);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const st = trackProgress(el, (p) => useAppStore.getState().setHeroProgress(p));
    return () => st.kill();
  }, []);

  return (
    <SceneZone id="top" className="relative h-[220vh]">
      <div ref={root} className="absolute inset-0" />
      <div className="sticky top-0 flex h-dvh items-center">
        {/* Static poster: eager + high priority, hidden once the live canvas is ready. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/textures/hero-poster.svg"
          alt="Kraft packaging box"
          width={800}
          height={800}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className={`absolute left-1/2 top-1/2 w-[min(80vw,640px)] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${
            live ? "opacity-0" : "opacity-100"
          }`}
        />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
          <h1 className="font-display max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
            Packaging that earns the unboxing.
          </h1>
          <p className="mt-6 max-w-md text-[var(--muted)]">
            Placeholder copy. Custom boxes, cartons and pouches, made to order.
          </p>
          <div className="mt-8 flex gap-3">
            <Button href="#quote">Get a Quote</Button>
            <Button href="#products" variant="ghost">
              Explore Products
            </Button>
          </div>
        </div>
      </div>
    </SceneZone>
  );
}
