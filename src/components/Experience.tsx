"use client";

import { useEffect } from "react";
import { detectDevice } from "@/lib/deviceTier";
import { initReveal, initScroll } from "@/lib/scroll";
import { useAppStore } from "@/lib/store";
import Loader from "./canvas/Loader";
import SceneLoader from "./canvas/SceneLoader";

/** Boots device detection, smooth scroll, the loader and the 3D canvas. */
export default function Experience() {
  useEffect(() => {
    const { setProfile, setProgress, setReady } = useAppStore.getState();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const profile = detectDevice();
    setProfile(profile, reduced);
    setProgress(40);

    const cleanupScroll = initScroll(reduced);
    const cleanupReveal = initReveal(reduced);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let creep: ReturnType<typeof setInterval> | undefined;

    if (profile.webgl) {
      // Creep the bar while the 3D chunk downloads; Scene.tsx finishes it.
      creep = setInterval(() => {
        const p = useAppStore.getState().progress;
        if (p < 85) setProgress(p + 4);
      }, 150);
    } else {
      timers.push(setTimeout(setReady, 500)); // 2D fallback is instant
    }
    timers.push(setTimeout(setReady, 8000)); // failsafe: never trap the user

    return () => {
      cleanupReveal();
      cleanupScroll();
      if (creep) clearInterval(creep);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <Loader />
      <SceneLoader />
    </>
  );
}
