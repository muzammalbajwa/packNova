import type * as THREE from "three";
import type { ProcessStep, Skin } from "@/content/catalog";

/** What a recipe module receives. */
export interface RecipeCtx {
  skin: Skin;
  steps: ProcessStep[];
  /** Low tier: fewer segments, smaller textures. */
  low: boolean;
}

/**
 * A built recipe. `update` is a pure function of progress p (0..1): it sets every transform, visibility and
 * uniform, so jumping or scrubbing backwards always draws the right frame. It must not allocate.
 */
export interface RecipeInstance {
  root: THREE.Object3D;
  update(p: number, cam: THREE.PerspectiveCamera): void;
  /** Frees every geometry, material and texture the recipe created. */
  dispose(): void;
}

export type RecipeFactory = (ctx: RecipeCtx) => RecipeInstance;
