"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import SceneZone from "../canvas/SceneZone";
import { trackProgress } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";

// Layout + 2D-fallback styling per chapter. Text comes from content/site.ts.
const LOOKS = [
  { side: "md:mr-auto", filter: "hue-rotate(195deg) saturate(0.9) brightness(0.9)" },
  { side: "md:ml-auto", filter: "grayscale(1) brightness(0.55) contrast(1.1)" },
  { side: "md:mr-auto", filter: "grayscale(1) brightness(0.55) contrast(1.1)" },
] as const;

const CHAPTERS = site.story.chapters.map((c, i) => ({
  ...c,
  ...LOOKS[i],
  n: `0${i + 1}`,
}));

export default function Story() {
  const track = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const live = useAppStore((s) => s.ready && !!s.profile?.webgl);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let current = 0;
    const st = trackProgress(
      el,
      (p) => {
        useAppStore.getState().setStoryProgress(p);
        const idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
        if (idx !== current) {
          current = idx;
          setChapter(idx); // fires only on chapter change, never per frame
        }
      },
      "top top",
      "bottom bottom",
    );
    return () => st.kill();
  }, []);

  return (
    <SceneZone id="story" className="relative h-[420vh]">
      <div ref={track} className="absolute inset-0" />
      <div className="sticky top-0 h-dvh overflow-hidden">
        {/* 2D fallback / pre-canvas poster, restyled per chapter */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/textures/hero-poster.webp"
          alt=""
          width={800}
          height={800}
          loading="lazy"
          decoding="async"
          style={{ filter: CHAPTERS[chapter].filter }}
          className={`absolute w-[min(70vw,480px)] transition-all duration-700 max-md:left-1/2 max-md:top-[26%] max-md:-translate-x-1/2 max-md:-translate-y-1/2 md:top-1/2 md:-translate-y-1/2 ${
            chapter === 1 ? "md:left-[8vw]" : "md:right-[8vw]"
          } ${live ? "opacity-0" : "opacity-100"}`}
        />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-16 md:justify-center md:pb-0">
          <p className="eyebrow mb-6">{site.story.eyebrow}</p>
          <div className="relative min-h-[15rem] md:min-h-[18rem]">
            {CHAPTERS.map((c, i) => (
              <div
                key={c.title}
                aria-hidden={i !== chapter}
                className={`absolute inset-x-0 top-0 max-w-md transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${c.side} ${
                  i === chapter ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
                }`}
              >
                <span className="font-display text-sm tabular-nums text-[var(--accent)]">{c.n} / 0{CHAPTERS.length}</span>
                <h2 className="font-display mt-2 text-6xl font-bold tracking-[-0.03em] md:text-8xl">{c.title}</h2>
                <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2" aria-hidden>
            {CHAPTERS.map((c, i) => (
              <span
                key={c.title}
                className={`h-0.5 w-16 rounded-full transition-colors duration-500 ${
                  i <= chapter ? "bg-[var(--accent)]" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </SceneZone>
  );
}
