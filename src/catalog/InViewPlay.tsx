"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Sets data-on on its wrapper while it is on screen, so a CSS animation can run only then (without script it stays paused). */
export default function InViewPlay({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-on", e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
