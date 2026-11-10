import type { Story3DConfig } from "@/shared/story3d";

/** Cinematic: full-bleed canvas, the box centred and large, a low dramatic key light. */
export const config: Story3DConfig = {
  theme: "b",
  camera: { z: 7, fov: 30 },
  story: {
    wide: { offsetX: 0, offsetY: 0.17, widthFrac: 0.55, heightFrac: 0.7 },
    narrow: { offsetX: 0, offsetY: 0.2, widthFrac: 0.9, heightFrac: 0.42 },
    wideAspect: 1.1,
  },
  hero: { offsetX: 0, offsetY: -0.05, narrowOffsetY: 0.03, scale: 0.95 },
  light: { keyPos: [2, 4, 4], rimPos: [-5, 1.5, -2] },
  shadow: { opacity: 1, spread: 1 },
  board: { roughness: 0.82 },
};
