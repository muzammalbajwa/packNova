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
};

export const hasFilm = (r: RecipeId) => r in RECIPE_LOADERS;

export const loadEngine = () => import("./engine");

const warmed = new Set<string>();
/** Start downloading the film engine and the recipe of a page (called when a nav item or card is hovered or touched). */
export function prefetchFilm(recipe: RecipeId) {
  if (!hasFilm(recipe) || warmed.has(recipe)) return;
  warmed.add(recipe);
  void loadEngine();
  void RECIPE_LOADERS[recipe]?.();
}
