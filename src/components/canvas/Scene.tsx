"use client";

import { useEffect } from "react";
import { Canvas, useThree, type RootState } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { useAppStore } from "@/lib/store";
import Box3D from "./Box3D";
import SceneLights from "./SceneLights";

/** Re-renders on demand when scroll values change (frameloop="demand" tiers). */
function DemandInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
    return useAppStore.subscribe((s, prev) => {
      if (s.heroProgress !== prev.heroProgress) {
        invalidate();
      }
    });
  }, [invalidate]);
  return null;
}

/** Maps asset loading to the loader bar, then flags the first frame as ready. */
function ReadySignal() {
  const { progress } = useProgress();
  useEffect(() => {
    useAppStore.getState().setProgress(85 + progress * 0.15);
  }, [progress]);

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => useAppStore.getState().setReady());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);
  return null;
}

declare global {
  interface Window {
    /** Exposed for performance checks: window.__gl.info.render.calls */
    __gl?: import("three").WebGLRenderer;
    /** Full R3F state (scene, camera, gl) for tooling such as poster export. */
    __r3f?: RootState;
  }
}

export default function Scene() {
  const profile = useAppStore((s) => s.profile);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const active = useAppStore((s) => s.sceneActive);
  if (!profile) return null;

  // Off-screen: stop rendering entirely. Low tier / reduced motion: render only
  // when scroll changes. Otherwise: continuous (idle float needs every frame).
  const frameloop = !active ? "never" : profile.tier === "low" || reducedMotion ? "demand" : "always";

  return (
    <Canvas
      dpr={profile.dpr}
      frameloop={frameloop}
      gl={{ antialias: profile.tier !== "low", alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.5, 5], fov: 35 }}
      onCreated={(state) => {
        window.__gl = state.gl;
        window.__r3f = state;
      }}
    >
      <SceneLights low={profile.tier === "low"} />
      <Box3D detail={profile.detail} reducedMotion={reducedMotion} />
      <DemandInvalidator />
      <ReadySignal />
    </Canvas>
  );
}
