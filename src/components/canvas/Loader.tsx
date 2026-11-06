"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

const MESSAGES = [
  "Folding the cardboard...",
  "Adding lights...",
  "Taping the seams...",
  "Printing the finishing touches...",
  "Ready to ship.",
];

export default function Loader() {
  const progress = useAppStore((s) => s.progress);
  const ready = useAppStore((s) => s.ready);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t1 = setTimeout(() => setLeaving(true), 450);
    const t2 = setTimeout(() => setGone(true), 1150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ready]);

  // Freeze scroll while the loader is up.
  useEffect(() => {
    if (gone) return;
    const el = document.documentElement;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = "";
    };
  }, [gone]);

  if (gone) return null;
  const message = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor((progress / 100) * MESSAGES.length))];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[var(--bg)] transition-opacity duration-700 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <p className="font-display text-sm uppercase tracking-[0.3em] text-[var(--muted)]">{message}</p>
      <div className="h-px w-56 overflow-hidden bg-white/10">
        <div
          className="h-full origin-left bg-[var(--accent)] transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>
      <p className="tabular-nums text-xs text-[var(--muted)]">{Math.round(progress)}%</p>
    </div>
  );
}
