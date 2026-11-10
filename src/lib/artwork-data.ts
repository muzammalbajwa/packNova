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

/* ---------- upload validation ---------- */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const MAX_BITMAP_EDGE = 1536; // downscale big uploads: keeps GPU memory and decode time sane

export type LoadResult = { ok: true; bitmap: ImageBitmap } | { ok: false; error: string };

export async function loadArtwork(file: File): Promise<LoadResult> {
  const okType = ACCEPTED_TYPES.includes(file.type) || (!file.type && /\.(png|jpe?g)$/i.test(file.name));
  if (!okType) return { ok: false, error: "Please choose a PNG or JPG image." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 10 MB.` };
  }
  try {
    const probe = await createImageBitmap(file);
    const scale = Math.min(1, MAX_BITMAP_EDGE / Math.max(probe.width, probe.height));
    if (scale === 1) return { ok: true, bitmap: probe };
    const small = await createImageBitmap(file, {
      resizeWidth: Math.round(probe.width * scale),
      resizeHeight: Math.round(probe.height * scale),
      resizeQuality: "high",
    });
    probe.close();
    return { ok: true, bitmap: small };
  } catch {
    return { ok: false, error: "That image could not be read. Try another PNG or JPG." };
  }
}

/* ---------- panel texture composite ---------- */
