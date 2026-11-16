"use client";

import { useEffect } from "react";
import { warmEngine } from "@/film/loaders";
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

    // Once the homepage has settled, fetch the shared 3D chunk in idle time so the first product film opens without a wait.
    // Only on devices that can run it, and not on slow or data-saving connections.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (profile.webgl && !conn?.saveData && !/2g/.test(conn?.effectiveType ?? "")) {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      timers.push(setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(warmEngine, { timeout: 4000 }) : warmEngine()), 6000));
    }

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
