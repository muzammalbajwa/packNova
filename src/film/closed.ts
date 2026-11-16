import type { RecipeId, Skin } from "@/content/catalog";

/**
 * The film progress at which the FINISHED product is on show. The product page opens on this pose (slowly swaying), and the first part of the
 * scroll rewinds the film from here back to step 1: the film stays one continuous function of scroll progress, with no jump.
 * Boxes and cartons: the moment the lid or flaps are shut. Pages with seasonal props use the final shot, where the props have arrived.
 * Three-free (no three.js import): the page code can read it without loading any 3D.
 */
export function closedProgress(recipe: RecipeId, skin: Skin): number {
  if (skin.props.some((p) => p !== "ribbon" && p !== "bow")) return 1;
  switch (recipe) {
    case "corrugated-box": return 6 / 7 - 0.012;
    case "folding-carton":
    case "rigid-box": return 5 / 6;
    default: return 1; // paper bag, pouch, label or tag, tray and sleeve: the last step is the finished product
  }
}

/** Share of the whole scroll that the rewind takes, for `n` steps (the rewind lasts about 0.6 of one step). */
export const introShare = (n: number) => 0.6 / (n + 0.6);

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Scroll fraction P (0..1) -> film progress for the recipe. P = 0: finished product. P = introShare: step 1 begins. P = 1: last step. */
export function filmProgress(P: number, n: number, closed: number): number {
  const I = introShare(n);
  if (P >= I) return Math.min(1, (P - I) / (1 - I));
  return closed * (1 - smooth(Math.max(0, P) / I));
}
