"use client";

import { useMemo } from "react";
import { TYPE_BY_ID, type BoxConfig } from "@/lib/box";
import { dieline, dielineSvg } from "@/lib/boxDieline";

/** The flat dieline of the current configuration: true-size SVG file to download, drawn live from the sizes. */
export default function DielineView({ cfg }: { cfg: BoxConfig }) {
  const d = useMemo(() => dieline(cfg), [cfg]);
  const label = TYPE_BY_ID[cfg.type].label;
  const sw = Math.max(d.w, d.h) / 600;
  const fs = Math.max(d.w, d.h) / 55;
  const download = () => {
    const blob = new Blob([dielineSvg(d, `${label} dieline preview`)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cfg.type}-dieline-preview.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div>
      <p className="rounded-[var(--r-field)] border border-[var(--kraft)] bg-[var(--wash)] px-4 py-3 text-sm font-semibold">Preview only. Our team will confirm the final dieline before anything is made.</p>
      <figure className="mt-4 overflow-x-auto rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-3">
        <svg viewBox={`0 0 ${d.w} ${d.h}`} role="img" aria-label={`${label} dieline, ${d.sheet}`} className="mx-auto block max-h-[26rem] w-full">
          <g fill="none" strokeLinejoin="round">
            <path d={d.cuts} stroke="#b1432f" strokeWidth={sw} />
            <path d={d.folds} stroke="#2a5d7c" strokeWidth={sw} strokeDasharray={`${sw * 6} ${sw * 4}`} />
          </g>
          <g fill="currentColor" fontFamily="Arial, sans-serif">
            {d.labels.map((l) => (
              <text key={l.text} x={l.x} y={l.y} fontSize={fs} textAnchor="middle" transform={l.rot ? `rotate(${l.rot} ${l.x} ${l.y})` : undefined}>{l.text}</text>
            ))}
          </g>
        </svg>
        <figcaption className="mt-2 text-sm text-[var(--muted)]">{d.sheet}. <span className="font-semibold text-[#b1432f]">Solid red: cut.</span> <span className="font-semibold text-[#2a5d7c]">Dashed blue: fold.</span></figcaption>
      </figure>
      <button type="button" onClick={download} className="mt-4 inline-flex rounded-[var(--r-btn)] border border-[var(--line-strong)] px-5 py-3 font-semibold hover:border-[var(--fg)]">Download SVG (true size, preview)</button>
    </div>
  );
}
