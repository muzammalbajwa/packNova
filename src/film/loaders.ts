import type { RecipeId } from "@/content/catalog";
import type { RecipeFactory } from "./types";

/**
 * One dynamic import per recipe: each is its own chunk, fetched only on pages that use it.
 * This file has no three.js import, so the nav can use it to prefetch on hover.
 */
export const RECIPE_LOADERS: Partial<Record<RecipeId, () => Promise<{ default: RecipeFactory }>>> = {
  "rigid-box": () => import("./recipes/rigid-box"),
  "corrugated-box": () => import("./recipes/corrugated-box"),
  "folding-carton": () => import("./recipes/folding-carton"),
  "paper-bag": () => import("./recipes/paper-bag"),
  pouch: () => import("./recipes/pouch"),
  "label-tag": () => import("./recipes/label-tag"),
  "tray-sleeve": () => import("./recipes/tray-sleeve"),
};

export const hasFilm = (r: RecipeId) => r in RECIPE_LOADERS;

export const loadEngine = () => import("./engine");

let engineWarm = false;
/** Start downloading the shared 3D chunk (three.js and the film engine) without starting anything: used at idle time and when a menu item is hovered or touched. */
export function warmEngine() {
  if (engineWarm) return;
  engineWarm = true;
  void loadEngine();
}

/** Same, plus the configurator's own code (for the "Design your box" menu item). */
export function warmConfigurator() {
  warmEngine();
  void import("./configurator");
}

const warmed = new Set<string>();
/** Start downloading the film engine and the recipe of a page (called when a nav item or card is hovered or touched). */
export function prefetchFilm(recipe: RecipeId) {
  if (!hasFilm(recipe) || warmed.has(recipe)) return;
  warmed.add(recipe);
  void loadEngine();
  void RECIPE_LOADERS[recipe]?.();
}

/**
 * Waits (up to `timeout` ms) until the homepage canvases have given up their WebGL contexts, so that the film renderer
 * and the homepage engine never hold a context at the same time. React Three Fiber releases a canvas a moment after it unmounts.
 */
export async function waitForOtherContexts(timeout = 2500) {
  const t0 = performance.now();
  const alive = () => [window.__gl, window.__glMaking].some((r) => r && !r.getContext().isContextLost());
  while (alive() && performance.now() - t0 < timeout) await new Promise((r) => setTimeout(r, 40));
}
