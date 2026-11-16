import type { ThemeId } from "@/lib/palette";

/**
 * Template-specific 3D settings. The carton model, the 7 stages, their timing and the fold
 * order are identical in every template; only framing, light, shadow and board finish vary.
 * Fractions are of the canvas viewport (the canvas can be full-bleed or sit in a panel).
 */
export interface LayoutParams {
  /** Horizontal / vertical offset of the model centre, as a fraction of the viewport width / height. */
  offsetX: number;
  offsetY: number;
  /** Room the model may use, as a fraction of the viewport. */
  widthFrac: number;
  heightFrac: number;
}

export interface Story3DConfig {
  /** Which palette (lib/palette.ts) colors the 3D scene: lights, kraft, accent, foil, shadows. */
  theme: ThemeId;
  camera: { z: number; fov: number };
  /** Making-of framing. `wide` applies when the canvas aspect ratio exceeds `wideAspect`. */
  story: { wide: LayoutParams; narrow: LayoutParams; wideAspect: number };
  /** Hero box placement on the shared fixed canvas. */
  hero: { offsetX: number; offsetY: number; narrowOffsetY: number; scale: number };
  light: { keyPos: [number, number, number]; rimPos: [number, number, number] };
  /** Multipliers on the palette's contact shadow. */
  shadow: { opacity: number; spread: number };
  /** Board finish: kraft material roughness (lower = more satin). */
  board: { roughness: number };
  /** Which top corner the route map sits in during the flight (a template keeps it clear of its own controls). */
  map: { side: "left" | "right" };
}

/** Defaults equal the framing the story shipped with (text on the left, model on the right). */
export const DEFAULT_STORY3D: Story3DConfig = {
  theme: "c",
  camera: { z: 7, fov: 32 },
  story: {
    wide: { offsetX: 0.18, offsetY: 0, widthFrac: 0.42, heightFrac: 0.8 },
    narrow: { offsetX: 0, offsetY: 0.2, widthFrac: 0.94, heightFrac: 0.42 },
    wideAspect: 1.1,
  },
  hero: { offsetX: 0.2, offsetY: 0, narrowOffsetY: 0.2, scale: 1 },
  light: { keyPos: [3, 5, 3], rimPos: [-4, 2, -3] },
  shadow: { opacity: 1, spread: 1 },
  board: { roughness: 0.9 },
  map: { side: "right" },
};
