import * as THREE from "three";
import { makeCanvas, paintBase, type MaterialKind } from "./textures";

export * from "./artwork-data";
import type { Panel, PanelArt } from "./artwork-data";

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
    const band = h * 0.11; // matches POUCH_SEAL in PackModel
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
    g.fillStyle = "#000"; // must be fully opaque: destination-out removes alpha in proportion to it
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
