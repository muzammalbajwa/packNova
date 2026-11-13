"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

// three / R3F / drei live in their own chunk; the page renders without them.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function SceneLoader() {
  // the homepage engine is about to create canvases: release the product film's WebGL context first (one context at a time)
  useEffect(() => {
    window.__filmDestroy?.();
  }, []);
  const profile = useAppStore((s) => s.profile);
  const ready = useAppStore((s) => s.ready);
  // the canvas keeps its last frame when it stops rendering, so hide it whenever no hero zone is on screen
  const active = useAppStore((s) => s.sceneActive);
  if (!profile?.webgl) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
      style={{ opacity: ready && active ? 1 : 0 }}
    >
      <Scene />
    </div>
  );
}
