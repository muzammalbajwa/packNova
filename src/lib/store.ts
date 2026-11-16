import { create } from "zustand";
import type { DeviceProfile } from "./deviceTier";
import { DEFAULT_THEME, type ThemeId } from "./palette";
import { DEFAULT_STORY3D, type Story3DConfig } from "@/shared/story3d";

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
  /** True while the hero canvas has lost its WebGL context (the poster is shown again). */
  glLost: boolean;
  /**
   * Fast-changing scroll values (0-1). Components that animate every frame
   * MUST read these with useAppStore.getState() inside useFrame and never
   * subscribe to them with a hook (that would re-render React on every tick).
   */
  heroProgress: number;
  /** 0-1 progress through the pinned "how your box is made" section. */
  makingProgress: number;

  /** Active color theme (palette.ts). 3D materials, lights and the loader follow it. */
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  /** Active template's 3D framing/light/shadow/board settings (see shared/story3d.ts). */
  story3d: Story3DConfig;
  setStory3D: (c: Story3DConfig) => void;

  setProfile: (p: DeviceProfile, reducedMotion: boolean) => void;
  setProgress: (n: number) => void;
  setReady: () => void;
  zoneChange: (delta: 1 | -1) => void;
  setHeroProgress: (n: number) => void;
  setMakingProgress: (n: number) => void;
  /** Set by CTAs ("Want this box?") so the quote form can start with the right product. */
  quotePrefill: { product?: string; note?: string } | null;
  setQuotePrefill: (v: { product?: string; note?: string } | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  reducedMotion: false,
  progress: 0,
  ready: false,
  zones: 0,
  sceneActive: false,
  glLost: false,
  heroProgress: 0,
  makingProgress: 0,
  quotePrefill: null,

  themeId: DEFAULT_THEME,
  setThemeId: (themeId) => set({ themeId }),
  story3d: DEFAULT_STORY3D,
  setStory3D: (story3d) => set({ story3d, themeId: story3d.theme }),
  setProfile: (profile, reducedMotion) => set({ profile, reducedMotion }),
  setProgress: (n) => set((s) => (n > s.progress ? { progress: Math.min(100, n) } : s)),
  setReady: () => set({ ready: true, progress: 100 }),
  zoneChange: (delta) =>
    set((s) => {
      const zones = Math.max(0, s.zones + delta);
      return { zones, sceneActive: zones > 0 };
    }),
  setHeroProgress: (heroProgress) => set({ heroProgress }),
  setMakingProgress: (makingProgress) => set({ makingProgress }),
  setQuotePrefill: (quotePrefill) => set({ quotePrefill }),
}));

// Test and ?perf hook: the scene lifecycle tests read the store from the page (scripts/roundtrip-test.mjs).
if (typeof window !== "undefined") (window as unknown as { __appStore?: typeof useAppStore }).__appStore = useAppStore;
