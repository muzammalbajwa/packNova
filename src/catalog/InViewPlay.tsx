"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Sets data-on on its wrapper while it is on screen, so a CSS animation can run only then (without script it stays paused); has a pause button. */
export default function InViewPlay({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-on", e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // a loop that lasts longer than 5 s next to other content needs a way to stop it (WCAG 2.2.2)
  return (
    <div ref={ref} className={className} data-paused={paused ? "" : undefined}>
      {children}
      <button type="button" aria-pressed={paused} onClick={() => setPaused((v) => !v)} className="band-pause mt-2 block text-sm font-semibold underline underline-offset-4">
        {paused ? "Play animation" : "Pause animation"}
      </button>
    </div>
  );
}
