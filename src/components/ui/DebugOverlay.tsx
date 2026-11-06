"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useAppStore } from "@/lib/store";

const subscribe = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => "";

/** Live stats, only shown with ?debug=1. Writes to the DOM directly (no React re-render per frame). */
function Overlay() {
  const out = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let windowStart = last;

    const loop = (now: number) => {
      frames++;
      worst = Math.max(worst, now - last);
      last = now;
      if (now - windowStart >= 500) {
        const fps = (frames * 1000) / (now - windowStart);
        const gl = window.__gl;
        const p = useAppStore.getState().profile;
        if (out.current) {
          out.current.textContent = [
            `fps    ${fps.toFixed(0)}  (worst frame ${worst.toFixed(0)} ms)`,
            `calls  ${gl ? gl.info.render.calls : "-"}   tris ${gl ? gl.info.render.triangles : "-"}`,
            `memory geometries ${gl ? gl.info.memory.geometries : "-"}  textures ${gl ? gl.info.memory.textures : "-"}`,
            `tier   ${p?.tier ?? "-"}   dpr ${window.devicePixelRatio}   webgl ${p ? (p.webgl ? "yes" : "no") : "-"}`,
          ].join("\n");
        }
        frames = 0;
        worst = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <pre
      ref={out}
      aria-hidden
      className="pointer-events-none fixed bottom-3 left-3 z-[200] rounded-lg bg-black/80 px-3 py-2 font-mono text-[11px] leading-snug text-lime-300"
    >
      debug...
    </pre>
  );
}

export default function DebugOverlay() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  if (new URLSearchParams(search).get("debug") !== "1") return null;
  return <Overlay />;
}
