"use client";

import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";

// three / R3F / drei live in their own chunk; the page renders without them.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

export default function SceneLoader() {
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
