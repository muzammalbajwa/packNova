"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAppStore } from "@/lib/store";
import { THEMES, THEME_IDS, THEME_STORAGE_KEY, isThemeId, type ThemeId } from "@/lib/palette";

function apply(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEMES[id].bg);
  useAppStore.getState().setThemeId(id);
}

/**
 * Mirrors the theme chosen by the <head> boot script into the store (so 3D follows it),
 * and shows a small floating switcher only when the URL has ?themes=1.
 */
export default function ThemeSync() {
  const themeId = useAppStore((s) => s.themeId);
  const show = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search).get("themes") === "1",
    () => false,
  );

  useEffect(() => {
    const cur = document.documentElement.getAttribute("data-theme");
    if (isThemeId(cur)) useAppStore.getState().setThemeId(cur);
  }, []);

  if (!show) return null;
  return (
    <div
      role="group"
      aria-label="Compare color themes"
      className="fixed bottom-24 left-3 z-[190] flex flex-col gap-1 rounded-2xl border border-[var(--line-strong)] bg-[var(--glass)] p-2 text-xs backdrop-blur-xl md:bottom-4"
    >
      {THEME_IDS.map((id) => {
        const t = THEMES[id];
        return (
          <button
            key={id}
            type="button"
            aria-pressed={themeId === id}
            onClick={() => apply(id)}
            className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors ${
              themeId === id ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--fg)] hover:bg-[var(--wash)]"
            }`}
          >
            <span className="flex">
              {[t.bg, t.kraft, t.accent].map((c) => (
                <span key={c} className="-ml-1 size-3.5 rounded-full border border-[var(--line-strong)] first:ml-0" style={{ background: c }} />
              ))}
            </span>
            <span className="font-medium uppercase">{id}</span>
            <span className="opacity-80">{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}
