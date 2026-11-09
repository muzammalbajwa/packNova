/**
 * ONE source of truth for color. The CSS variables (generated into <head> by layout.tsx),
 * the 3D lights/materials/shadows and the loader all read from here. Pure data: safe to
 * import from server and client code.
 */
export type ThemeId = "a" | "b" | "c" | "d";

export interface SceneLook {
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  key: number;
  keyColor: string;
  rim: number;
  rimColor: string;
  /** Image-based light strength. Lower on light themes so kraft does not wash out. */
  env: number;
  /** Contact-shadow opacity multiplier (higher on light backgrounds). */
  shadow: number;
  /** Contact-shadow footprint multiplier (softer, wider on light backgrounds). */
  shadowSpread: number;
  toneExposure: number;
}

export interface Theme {
  id: ThemeId;
  name: string;
  dark: boolean;
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  kraft: string;
  /** Darker kraft that is safe as TEXT/icon color on bg and surface (kraft itself is a material color). */
  kraftInk: string;
  accent: string;
  /** Text/icon color to put ON the accent color (buttons, accent sections). */
  onAccent: string;
  scene: SceneLook;
}

const DARK_SCENE: Omit<SceneLook, "rimColor"> = {
  hemiSky: "#fff1dc",
  hemiGround: "#1a1008",
  hemi: 0.35,
  key: 2.4,
  keyColor: "#ffe9cf",
  rim: 1.6,
  env: 0.26,
  shadow: 1,
  shadowSpread: 1,
  toneExposure: 1,
};

const LIGHT_SCENE: Omit<SceneLook, "rimColor"> = {
  hemiSky: "#ffffff",
  hemiGround: "#7a6a58",
  hemi: 0.5,
  key: 2.7,
  keyColor: "#fff4e6",
  rim: 0.9,
  env: 0.16,
  shadow: 0.62,
  shadowSpread: 1.2,
  toneExposure: 0.92,
};

export const THEMES: Record<ThemeId, Theme> = {
  a: {
    id: "a",
    name: "Ivory and Ink",
    dark: false,
    bg: "#F5F0E8",
    surface: "#FFFFFF",
    fg: "#111318",
    muted: "#59554D",
    kraft: "#B8895A",
    kraftInk: "#8A5E30",
    accent: "#0F5C4D",
    onAccent: "#FFFFFF",
    scene: { ...LIGHT_SCENE, rimColor: "#9fe3d0" },
  },
  b: {
    id: "b",
    name: "Midnight and Gold",
    dark: true,
    bg: "#0B1220",
    surface: "#121B2E",
    fg: "#F4F1EA",
    muted: "#9AA3B5",
    kraft: "#C9A574",
    kraftInk: "#C9A574",
    accent: "#E8B04B",
    onAccent: "#0B1220",
    scene: { ...DARK_SCENE, rimColor: "#ffc766" },
  },
  c: {
    id: "c",
    name: "Forest and Lime",
    dark: true,
    bg: "#0E1F1A",
    surface: "#15302A",
    fg: "#F2EFE6",
    muted: "#9DB3A9",
    kraft: "#C8A27A",
    kraftInk: "#C8A27A",
    accent: "#C6F24E",
    onAccent: "#0E1F1A",
    scene: { ...DARK_SCENE, rimColor: "#c6f24e", rim: 1.1 },
  },
  d: {
    id: "d",
    name: "Paper and Cobalt",
    dark: false,
    bg: "#F4F4F1",
    surface: "#FFFFFF",
    fg: "#0F1222",
    muted: "#565A6B",
    kraft: "#B98A55",
    kraftInk: "#85582B",
    accent: "#2B4BFF",
    onAccent: "#FFFFFF",
    scene: { ...LIGHT_SCENE, rimColor: "#9db0ff" },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = "a";
export const THEME_STORAGE_KEY = "packnova-theme";

export const isThemeId = (v: unknown): v is ThemeId => typeof v === "string" && v in THEMES;

const cssBlock = (t: Theme) =>
  `--bg:${t.bg};--surface:${t.surface};--fg:${t.fg};--muted:${t.muted};--kraft:${t.kraft};--kraft-ink:${t.kraftInk};` +
  `--accent:${t.accent};--on-accent:${t.onAccent};color-scheme:${t.dark ? "dark" : "light"};`;

/** CSS for every theme. Default theme is on :root so first paint is correct without JS. */
export function themeCss(): string {
  const root = `:root{${cssBlock(THEMES[DEFAULT_THEME])}}`;
  const rest = THEME_IDS.map((id) => `:root[data-theme="${id}"]{${cssBlock(THEMES[id])}}`).join("");
  return root + rest;
}

/** Runs in <head> before paint: picks the theme from ?theme= or localStorage. */
export const THEME_BOOT_SCRIPT = `(function(){try{var ids=${JSON.stringify(THEME_IDS)};var d=${JSON.stringify(
  DEFAULT_THEME,
)};var k=${JSON.stringify(THEME_STORAGE_KEY)};var q=new URLSearchParams(location.search).get("theme");var t=null;if(q&&ids.indexOf(q)>-1){t=q;try{localStorage.setItem(k,q)}catch(e){}}else{try{t=localStorage.getItem(k)}catch(e){}}if(!t||ids.indexOf(t)<0)t=d;document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

/* ---------- contrast helpers (also used by scripts/contrast.mjs) ---------- */
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
