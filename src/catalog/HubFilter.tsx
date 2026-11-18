"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count line and filter chips of a hub. The cards are server-rendered (the full list works without script); this only hides the cards that do
 * not carry the chosen tag (the `hidden` attribute on the <li>), keeps the count line, which is also the live region, up to date, and drops the
 * feature card's size while a filter is on. The chips stay invisible (their space reserved, so nothing shifts) until the script runs.
 */
export default function HubFilter({ chips, total, noun, labels }: { chips: { tag: string; count: number }[]; total: number; noun: [string, string]; labels: { filter: string; all: string } }) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    root.current?.setAttribute("data-js", "");
  }, []);
  const [shown, setShown] = useState(total);
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("#hub-grid > li");
    let n = 0;
    items.forEach((li) => {
      const on = !active || (li.dataset.tags ?? "").split("|").includes(active);
      li.hidden = !on;
      if (on) n++;
      if (li.dataset.feature !== undefined) li.toggleAttribute("data-wide", !active);
    });
    setShown(n); // eslint-disable-line react-hooks/set-state-in-effect
  }, [active]);
  const word = (n: number) => (n === 1 ? noun[0] : noun[1]);
  return (
    <div ref={root} className="hub-filter mt-8">
      <p role="status" className="font-display text-xl text-[var(--kraft-ink)]">
        {shown === total ? `${total} ${word(total)}` : `${shown} of ${total} ${word(total)}`}
      </p>
      {chips.length > 0 && (
        <div role="group" aria-label={labels.filter} className="hub-chips mt-4 flex flex-wrap gap-2">
          {[{ tag: null as string | null, label: `${labels.all} ${total}` }, ...chips.map((c) => ({ tag: c.tag as string | null, label: `${c.tag} ${c.count}` }))].map((c) => (
            <button
              key={c.tag ?? "all"}
              type="button"
              aria-pressed={active === c.tag}
              onClick={() => setActive(c.tag)}
              className="hub-chip rounded-[var(--r-btn)] border border-[var(--line-strong)] px-4 py-2 text-base font-semibold transition-colors hover:border-[var(--fg)] aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent)] aria-pressed:text-[var(--on-accent)]"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
