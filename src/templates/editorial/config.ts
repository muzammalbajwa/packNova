import type { Story3DConfig } from "@/shared/story3d";

/** Editorial: the box lives in the right half of the story; soft, high key light. */
export const config: Story3DConfig = {
  theme: "a",
  camera: { z: 7, fov: 32 },
  story: {
    // the canvas is the right half of the screen (aspect < 1.1), so the centred "narrow" frame applies
    wide: { offsetX: 0, offsetY: 0, widthFrac: 0.9, heightFrac: 0.8 },
    narrow: { offsetX: 0, offsetY: 0, widthFrac: 0.84, heightFrac: 0.8 },
    wideAspect: 1.1,
  },
  hero: { offsetX: 0.2, offsetY: 0, narrowOffsetY: 0.2, scale: 1 },
  light: { keyPos: [3, 5, 3], rimPos: [-4, 2, -3] },
  shadow: { opacity: 1, spread: 1.1 },
  board: { roughness: 0.92 },
};
