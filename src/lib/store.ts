import { create } from "zustand";
import type { DeviceProfile } from "./deviceTier";

interface AppState {
  profile: DeviceProfile | null;
  reducedMotion: boolean;
  /** 0-100, drives the loading screen. */
  progress: number;
  /** True once the first frame (or the 2D fallback) is on screen. */
  ready: boolean;
  /** Number of [data-scene] zones currently in the viewport. */
  zones: number;
  /** True while at least one scene zone is on screen (canvas renders only then). */
  sceneActive: boolean;
  /**
   * Fast-changing scroll values (0-1). Components that animate every frame
   * MUST read these with useAppStore.getState() inside useFrame and never
   * subscribe to them with a hook (that would re-render React on every tick).
   */
  heroProgress: number;
  storyProgress: number;

  setProfile: (p: DeviceProfile, reducedMotion: boolean) => void;
  setProgress: (n: number) => void;
  setReady: () => void;
  zoneChange: (delta: 1 | -1) => void;
  setHeroProgress: (n: number) => void;
  setStoryProgress: (n: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  reducedMotion: false,
  progress: 0,
  ready: false,
  zones: 0,
  sceneActive: false,
  heroProgress: 0,
  storyProgress: 0,

  setProfile: (profile, reducedMotion) => set({ profile, reducedMotion }),
  setProgress: (n) => set((s) => (n > s.progress ? { progress: Math.min(100, n) } : s)),
  setReady: () => set({ ready: true, progress: 100 }),
  zoneChange: (delta) =>
    set((s) => {
      const zones = Math.max(0, s.zones + delta);
      return { zones, sceneActive: zones > 0 };
    }),
  setHeroProgress: (heroProgress) => set({ heroProgress }),
  setStoryProgress: (storyProgress) => set({ storyProgress }),
}));
