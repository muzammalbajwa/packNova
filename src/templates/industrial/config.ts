import type { Story3DConfig } from "@/shared/story3d";

/** Industrial: the box sits in a framed blueprint panel; raking light from the top left, matte board. */
export const config: Story3DConfig = {
  theme: "d",
  camera: { z: 7, fov: 30 },
  story: {
    // the panel is roughly square, so both frames match
    wide: { offsetX: 0, offsetY: 0, widthFrac: 0.86, heightFrac: 0.78 },
    narrow: { offsetX: 0, offsetY: 0, widthFrac: 0.86, heightFrac: 0.78 },
    wideAspect: 1.1,
  },
  hero: { offsetX: 0.2, offsetY: 0, narrowOffsetY: 0.2, scale: 0.95 },
  light: { keyPos: [-3, 5, 3], rimPos: [4, 1, -3] },
  shadow: { opacity: 0.75, spread: 0.9 },
  board: { roughness: 0.97 },
  map: { side: "right" },
};
