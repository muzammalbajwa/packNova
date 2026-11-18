"use client";

import { useMemo } from "react";
import { TYPE_BY_ID, fmt, type BoxConfig } from "@/lib/box";
import { dieline } from "@/lib/boxDieline";

/** The flat dieline of the current configuration, drawn live from the sizes, on a blueprint plate with the overall sheet size called out. */
export default function DielineView({ cfg }: { cfg: BoxConfig }) {
  const d = useMemo(() => dieline(cfg), [cfg]);
  const label = TYPE_BY_ID[cfg.type].label;
  const big = Math.max(d.w, d.h);
  const sw = big / 600;
  const fs = big / 55;
  const m = big * 0.1; // room for the callouts on the right and at the bottom
  const tick = m * 0.18;
  const ink = "var(--accent)";
  const lenW = `${fmt(d.w, cfg.unit)} ${cfg.unit}`;
  const lenH = `${fmt(d.h, cfg.unit)} ${cfg.unit}`;
  return (
    <div>
      <p className="mb-4 rounded-[var(--r-field)] border border-[var(--kraft)] bg-[var(--wash)] px-4 py-3 text-sm font-semibold">Preview only. Our team will confirm the final dieline before anything is made.</p>
      <figure className="cfg-blueprint overflow-hidden p-4 md:p-6">
        <svg viewBox={`0 0 ${d.w + m * 1.3} ${d.h + m * 1.3}`} role="img" aria-label={`${label} dieline, ${d.sheet}`} className="mx-auto block max-h-[28rem] w-full">
          <g fill="none" strokeLinejoin="round">
            <path d={d.cuts} stroke="#b1432f" strokeWidth={sw} />
            <path d={d.folds} stroke="#2a5d7c" strokeWidth={sw} strokeDasharray={`${sw * 6} ${sw * 4}`} />
          </g>
          <g fill="currentColor" fontFamily="Arial, sans-serif">
            {d.labels.map((l) => (
              <text key={l.text} x={l.x} y={l.y} fontSize={fs} textAnchor="middle" transform={l.rot ? `rotate(${l.rot} ${l.x} ${l.y})` : undefined}>{l.text}</text>
            ))}
          </g>
          {/* dimension callouts: overall sheet width under the drawing, overall height on its right */}
          <g stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round">
            <path d={`M0 ${d.h + m * 0.55} H${d.w} M0 ${d.h + m * 0.55 - tick} V${d.h + m * 0.55 + tick} M${d.w} ${d.h + m * 0.55 - tick} V${d.h + m * 0.55 + tick}`} />
            <path d={`M${d.w + m * 0.55} 0 V${d.h} M${d.w + m * 0.55 - tick} 0 H${d.w + m * 0.55 + tick} M${d.w + m * 0.55 - tick} ${d.h} H${d.w + m * 0.55 + tick}`} />
          </g>
          <g fill={ink} fontFamily="Arial, sans-serif" fontWeight={700} fontSize={fs * 1.25}>
            <text x={d.w / 2} y={d.h + m * 0.55 + fs * 1.9} textAnchor="middle">{lenW}</text>
            <text x={d.w + m * 0.55 + fs * 1.9} y={d.h / 2} textAnchor="middle" transform={`rotate(90 ${d.w + m * 0.55 + fs * 1.9} ${d.h / 2})`}>{lenH}</text>
          </g>
        </svg>
        <figcaption className="mt-3 text-sm text-[var(--muted)]">{d.sheet}. <span className="font-semibold text-[#b1432f]">Solid red: cut.</span> <span className="font-semibold text-[#2a5d7c]">Dashed blue: fold.</span></figcaption>
      </figure>
    </div>
  );
}
