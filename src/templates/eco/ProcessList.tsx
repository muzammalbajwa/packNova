"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./process.css";

/**
 * The steps list of "How an order works". The steps are server-rendered children; this only marks, while scrolling, which step is
 * at the middle of the screen (data-state on each <li>, data-i / --fill on the list) so CSS can highlight it and fill the progress line.
 * No React state, no re-render, no scroll listener: one IntersectionObserver on a zero-height line through the viewport middle.
 * Without script every step stays fully visible (the dimming only starts once `data-js` is set).
 */
export default function ProcessList({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = ref.current;
    if (!ol || !("IntersectionObserver" in window)) return;
    const items = Array.from(ol.children) as HTMLElement[];
    const mark = (n: number) => {
      items.forEach((li, i) => (li.dataset.state = i < n ? "past" : i === n ? "active" : "next"));
      ol.style.setProperty("--fill", String((n + 1) / items.length));
    };
    ol.dataset.js = "";
    mark(0);
    // On any change, find the step under the middle of the screen (before the list: the first, after it: the last). Recomputing from
    // positions, not from which entry fired, keeps it right when a fast scroll jumps over a step.
    const io = new IntersectionObserver(() => {
      const mid = window.innerHeight / 2;
      let n = 0;
      items.forEach((li, i) => {
        if (li.getBoundingClientRect().top <= mid) n = i;
      });
      mark(n);
    }, { rootMargin: "-50% 0px -50% 0px" });
    items.forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);
  return <ol ref={ref} className="process-list relative border-t border-[var(--line-strong)] pl-6 lg:pl-8">{children}</ol>;
}
