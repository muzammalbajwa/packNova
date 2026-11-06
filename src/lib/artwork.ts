import * as THREE from "three";
import { makeCanvas, paintBase, type MaterialKind } from "./textures";

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

export interface ComposeOptions {
  kind: MaterialKind;
  /** physical panel size, only the ratio matters */
  aspect: number;
  maxPx: number;
  art: PanelArt;
  /** extra printing marks drawn on top of the artwork */
  deco?: "pouch" | null;
}

/** Composes background, image, text and (optionally) pouch seal marks into one texture. */
export function composePanel({ kind, aspect, maxPx, art, deco = null }: ComposeOptions) {
  const w = Math.max(64, Math.round(aspect >= 1 ? maxPx : maxPx * aspect));
  const h = Math.max(64, Math.round(aspect >= 1 ? maxPx / aspect : maxPx));
  const [c, g] = makeCanvas(w, h);

  paintBase(g, w, h, kind);
  if (art.bg) {
    g.fillStyle = art.bg;
    g.fillRect(0, 0, w, h);
  }
  if (art.bitmap) {
    const bw = art.bitmap.width;
    const bh = art.bitmap.height;
    const s = art.fit === "cover" ? Math.max(w / bw, h / bh) : Math.min(w / bw, h / bh) * 0.9;
    g.drawImage(art.bitmap, (w - bw * s) / 2, (h - bh * s) / 2, bw * s, bh * s);
  }
  if (art.text.trim()) {
    const lines = art.text.trim().split("\n").slice(0, 3);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = art.textColor;
    let size = Math.min(h * 0.2, 160);
    g.font = `700 ${size}px system-ui, sans-serif`;
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > w * 0.86) size *= (w * 0.86) / widest;
    g.font = `700 ${size}px system-ui, sans-serif`;
    const lh = size * 1.15;
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh));
  }

  if (deco === "pouch") {
    // Heat-sealed top band and side seals: fine crimp lines over the print.
    g.strokeStyle = "rgba(0,0,0,0.22)";
    g.lineWidth = 1;
    const band = h * 0.095;
    for (let y = 0; y < band; y += 3) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(0, band, w, 2);
    const side = w * 0.05;
    for (let x = 0; x < side; x += 3) {
      for (const sx of [x, w - x]) {
        g.beginPath();
        g.moveTo(sx, band);
        g.lineTo(sx, h);
        g.stroke();
      }
    }
    // Tear notches: real cut-outs (alpha 0) on both side edges, just under the seal.
    g.globalCompositeOperation = "destination-out";
    const ny = band + h * 0.03;
    const nw = w * 0.035;
    const nh = h * 0.03;
    for (const dir of [1, -1]) {
      const x0 = dir === 1 ? 0 : w;
      g.beginPath();
      g.moveTo(x0, ny - nh);
      g.lineTo(x0 + dir * nw, ny);
      g.lineTo(x0, ny + nh);
      g.closePath();
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
