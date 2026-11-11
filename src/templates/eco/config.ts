import type { Story3DConfig } from "@/shared/story3d";

/** Eco: the box sits in a big rounded card; warm, soft light and a slightly higher camera feel. */
export const config: Story3DConfig = {
  theme: "c",
  camera: { z: 7, fov: 34 },
  story: {
    // the card is wider than tall on desktop and a squat panel on phones; one frame fits both
    wide: { offsetX: 0, offsetY: 0, widthFrac: 0.8, heightFrac: 0.84 },
    narrow: { offsetX: 0, offsetY: 0, widthFrac: 0.84, heightFrac: 0.86 },
    wideAspect: 1.1,
  },
  hero: { offsetX: 0.2, offsetY: 0, narrowOffsetY: 0.2, scale: 1.05 },
  light: { keyPos: [3, 5, 4], rimPos: [-4, 3, -2] },
  shadow: { opacity: 1.1, spread: 1.15 },
  board: { roughness: 0.88 },
  map: { side: "right" },
};
