"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { detectDevice } from "@/lib/deviceTier";
import { useAppStore } from "@/lib/store";

const subscribe = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => "";

declare global {
  interface Window {
    /** True while the perf overlay is on: the film engine then records its draw time into __filmMs. */
    __perfOn?: boolean;
    __filmMs?: { buf: Float32Array; n: number };
  }
}

const N = 240; // frames kept for the rolling average and the 99th percentile
const sorted = new Float32Array(N);

/** p-th percentile (0..1) of the first `n` values of `buf`, using a preallocated scratch array. */
function pct(buf: Float32Array, n: number, p: number) {
  if (!n) return 0;
  const len = Math.min(n, N);
  sorted.set(buf.subarray(0, len));
  sorted.subarray(0, len).sort();
  return sorted[Math.min(len - 1, Math.floor(len * p))];
}

/**
 * Live stats, shown only with ?perf=1 (or ?debug=1). It works in every build (dev, staging, production) and does nothing
 * when the flag is absent: this component returns null and nothing here runs. It writes to the DOM directly
 * (no React re-render per frame). Shows page frame rate and frame-time p99, the film's draw time, draw calls, triangles,
 * geometries, textures and the JS heap (Chrome only).
 */
function Overlay() {
  const out = useRef<HTMLPreElement>(null);

  useEffect(() => {
    window.__perfOn = true;
    window.__filmMs = { buf: new Float32Array(N), n: 0 };
    const profile = useAppStore.getState().profile ?? detectDevice(); // film pages do not boot the store profile
    const frames = new Float32Array(N);
    let count = 0;
    let raf = 0;
    let last = performance.now();
    let lastText = last;
    const loop = (now: number) => {
      frames[count % N] = now - last;
      count++;
      last = now;
      if (now - lastText >= 500) {
        lastText = now;
        const n = Math.min(count, N);
        let sum = 0;
        for (let i = 0; i < n; i++) sum += frames[i];
        const fps = n ? 1000 / (sum / n) : 0;
        const p99 = pct(frames, count, 0.99);
        const film = window.__film && window.__film.renderer.domElement.isConnected ? window.__film.renderer : null;
        const gl = film ?? (window.__glMaking?.domElement.isConnected ? window.__glMaking : null) ?? window.__gl ?? null;
        const which = film ? "film" : window.__glMaking?.domElement.isConnected ? "story" : window.__gl ? "hero" : "-";
        const fm = window.__filmMs;
        const fmN = fm ? Math.min(fm.n, N) : 0;
        let fmAvg = 0;
        if (fm && fmN) {
          for (let i = 0; i < fmN; i++) fmAvg += fm.buf[i];
          fmAvg /= fmN;
        }
        const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
        const p = useAppStore.getState().profile ?? profile;
        if (out.current) {
          out.current.textContent = [
            `fps    ${fps.toFixed(0)}  frame p99 ${p99.toFixed(1)} ms  (last ${n})`,
            `film   draw avg ${fmAvg.toFixed(2)} ms  p99 ${fm ? pct(fm.buf, fm.n, 0.99).toFixed(2) : "-"} ms  (${fmN} draws)`,
            `gl     ${which}: calls ${gl ? gl.info.render.calls : "-"}  tris ${gl ? gl.info.render.triangles : "-"}`,
            `memory geometries ${gl ? gl.info.memory.geometries : "-"}  textures ${gl ? gl.info.memory.textures : "-"}  heap ${mem ? (mem.usedJSHeapSize / 1048576).toFixed(0) + " MB" : "n/a"}`,
            `tier   ${p?.tier ?? "-"}  dpr ${window.devicePixelRatio}  webgl ${p ? (p.webgl ? "yes" : "no") : "-"}`,
          ].join("\n");
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.__perfOn = false;
    };
  }, []);

  return (
    <pre
      ref={out}
      aria-hidden
      className="pointer-events-none fixed bottom-3 left-3 z-[200] max-w-[95vw] overflow-hidden rounded-lg bg-black/80 px-3 py-2 font-mono text-[11px] leading-snug text-lime-300"
    >
      perf...
    </pre>
  );
}

export default function DebugOverlay() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const q = new URLSearchParams(search);
  if (q.get("perf") !== "1" && q.get("debug") !== "1") return null;
  return <Overlay />;
}
