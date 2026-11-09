"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useAppStore } from "@/lib/store";
import SceneLights from "../SceneLights";
import CartonModel from "./CartonModel";

declare global {
  interface Window {
    /** Renderer of the making-of canvas (window.__glMaking.info.render.calls for draw calls). */
    __glMaking?: import("three").WebGLRenderer;
  }
}

/** frameloop="demand": render again whenever the scroll progress changes. */
function Invalidator({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    return useAppStore.subscribe((s, prev) => {
      if (s.makingProgress !== prev.makingProgress) invalidate();
    });
  }, [invalidate, active]);
  return null;
}

/** The making-of canvas. Renders only while the section is on screen (`active`). */
export default function MakingScene({ active }: { active: boolean }) {
  const profile = useAppStore((s) => s.profile);
  const reduced = useAppStore((s) => s.reducedMotion);
  const cam = useAppStore((s) => s.story3d.camera);
  if (!profile) return null;
  const low = profile.tier === "low";
  const frameloop = !active ? "never" : low || reduced ? "demand" : "always";

  return (
    <Canvas
      dpr={low ? [1, 1] : profile.dpr}
      frameloop={frameloop}
      gl={{ antialias: !low, alpha: true, powerPreference: "high-performance" }}
      // tight near/far keeps depth precision high enough that stacked flaps never z-fight
      camera={{ position: [0, 0, cam.z], fov: cam.fov, near: cam.z - 4, far: cam.z + 7 }}
      onCreated={(state) => {
        window.__glMaking = state.gl;
      }}
      aria-hidden
    >
      <SceneLights low={low} />
      <CartonModel low={low} reducedMotion={reduced} />
      <Invalidator active={active} />
    </Canvas>
  );
}
