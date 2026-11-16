// Plain artwork data and helpers. Deliberately free of three.js so pages that only need the types
// (quote flow, configurator teaser) do not pull the 3D engine into their initial JS.

export type Panel = "front" | "back" | "left" | "right" | "top";
export const ALL_PANELS: Panel[] = ["front", "back", "left", "right", "top"];

export interface PanelArt {
  bitmap: ImageBitmap | null;
  fileName: string;
  text: string;
  textColor: string;
  /** null = keep the material's own color */
  bg: string | null;
  fit: "cover" | "contain";
}

export type ArtMap = Record<Panel, PanelArt>;

export const emptyPanel = (): PanelArt => ({
  bitmap: null,
  fileName: "",
  text: "",
  textColor: "#ffffff",
  bg: null,
  fit: "cover",
});

export const emptyArt = (): ArtMap => ({
  front: emptyPanel(),
  back: emptyPanel(),
  left: emptyPanel(),
  right: emptyPanel(),
  top: emptyPanel(),
});

export const hasArt = (a: PanelArt) => !!(a.bitmap || a.text.trim() || a.bg);


/* ---------- panel texture composite ---------- */
