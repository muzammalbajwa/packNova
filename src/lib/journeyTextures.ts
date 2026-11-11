import * as THREE from "three";
import { site } from "@/content/site";
import type { Theme } from "./palette";
import { SHEET, flatRect, PANEL_BY_ID, W, H, D, buildArtTextures, type PanelId } from "./dieline";
import { makeCanvas, mulberry32 } from "./textures";

/**
 * Small canvas textures for the shipping journey. All are generated once, at mount (idle time), and uploaded
 * by the warm-up, so nothing is drawn or uploaded while the visitor scrolls.
 */

const tex = (c: HTMLCanvasElement, repeat = false) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

/** Conveyor belt: ribs across the direction of travel, so the scrolling offset reads as motion. */
export function beltTexture(dark: string, light: string): THREE.CanvasTexture {
  const [c, g] = makeCanvas(64, 64);
  g.fillStyle = dark;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = light;
  g.globalAlpha = 0.22;
  g.fillRect(0, 0, 8, 64);
  g.globalAlpha = 0.1;
  g.fillRect(8, 0, 4, 64);
  return tex(c, true);
}

/** Shipping label: brand, destination line, a barcode (a generic pattern, it encodes nothing). */
export function labelTexture(theme: Theme): THREE.CanvasTexture {
  const [c, g] = makeCanvas(512, 340);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 340);
  g.strokeStyle = "#111";
  g.lineWidth = 6;
  g.strokeRect(10, 10, 492, 320);
  g.fillStyle = theme.accent;
  g.fillRect(10, 10, 492, 74);
  g.fillStyle = theme.onAccent;
  g.font = "800 46px system-ui, sans-serif";
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.fillText(site.brand.name, 34, 48);
  g.fillStyle = "#111";
  g.font = "700 38px system-ui, sans-serif";
  g.fillText(site.making.scene.labelTo, 34, 128);
  const rnd = mulberry32(17);
  let x = 34;
  while (x < 478) {
    const w = 3 + Math.floor(rnd() * 3) * 3;
    if (rnd() > 0.3) g.fillRect(x, 168, w, 120);
    x += w + 3 + Math.floor(rnd() * 2) * 3;
  }
  g.font = "500 22px ui-monospace, monospace";
  g.fillText("0000 0000 0000", 34, 308);
  return tex(c);
}

/** Flat stylized map card: land, a graticule, the two labelled end points. Pixel size 640 x 400. */
export function mapTexture(theme: Theme): { texture: THREE.CanvasTexture; w: number; h: number } {
  const w = 640;
  const h = 400;
  const [c, g] = makeCanvas(w, h);
  const r = 26;
  const mix = (a: string, b: string, t: number) => `#${new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString()}`;
  const sea = theme.dark ? mix(theme.surface, theme.bg, 0.25) : mix(theme.surface, theme.accent, 0.1);
  const land = theme.dark ? mix(theme.surface, theme.fg, 0.2) : mix(theme.surface, theme.kraft, 0.45);
  g.clearRect(0, 0, w, h);
  g.beginPath();
  g.roundRect(2, 2, w - 4, h - 4, r);
  g.clip();
  g.fillStyle = sea;
  g.fillRect(0, 0, w, h);
  // land blobs (deterministic)
  const rnd = mulberry32(5);
  g.fillStyle = land;
  const blobs: [number, number, number][] = [[150, 250, 120], [210, 160, 90], [470, 130, 110], [520, 280, 130], [330, 300, 70]];
  for (const [bx, by, br] of blobs) {
    // smooth blob: quadratic curves through the midpoints of a wobbly ring
    const n = 10;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = br * (0.72 + rnd() * 0.5);
      pts.push([bx + Math.cos(a) * rr * 1.25, by + Math.sin(a) * rr * 0.8]);
    }
    g.beginPath();
    g.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % n];
      g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    g.closePath();
    g.fill();
  }
  // graticule
  g.strokeStyle = theme.fg;
  g.globalAlpha = 0.1;
  g.lineWidth = 1.5;
  for (let x = 0; x <= w; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y <= h; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.globalAlpha = 1;
  // end points: start at the lower left, destination at the upper right (the dots and pin are meshes on top)
  g.fillStyle = theme.fg;
  g.font = "700 30px system-ui, sans-serif";
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  g.fillText(site.brand.name, 34, h - 34);
  g.textAlign = "right";
  g.fillText(site.making.scene.mapTo, w - 34, 56);
  g.beginPath();
  g.roundRect(2, 2, w - 4, h - 4, r);
  g.lineWidth = 5;
  g.strokeStyle = theme.fg;
  g.globalAlpha = 0.85;
  g.stroke();
  return { texture: tex(c), w, h };
}

/**
 * The four printed faces of the finished carton, cropped from the dieline artwork, for the instanced copies.
 * Order matches BoxGeometry material groups: +x (right), -x (left), +y, -y, +z (front), -z (back); the top and
 * bottom are plain kraft. Returns small textures plus the kraft colour for the plain faces.
 */
export function boxFaceTextures(theme: Theme): { faces: Record<"right" | "left" | "front" | "back", THREE.CanvasTexture>; dispose: () => void } {
  const px = 512;
  const t = buildArtTextures(theme, px, true);
  const src = (t.baked as THREE.CanvasTexture).image as HTMLCanvasElement;
  const cw = px;
  const ch = src.height;
  const k = cw / SHEET.w;
  const crop = (id: PanelId, dimW: number) => {
    const [x0, y0, x1, y1] = flatRect(PANEL_BY_ID[id]);
    const X = ((x0 - SHEET.x0) / SHEET.w) * cw;
    const Y = ch - ((y1 - SHEET.y0) / SHEET.h) * ch;
    const sw = (x1 - x0) * k;
    const sh = (y1 - y0) * k;
    const outW = Math.round(dimW * 160);
    const outH = Math.round(H * 160);
    const [c, g] = makeCanvas(outW, outH);
    g.drawImage(src, X, Y, sw, sh, 0, 0, outW, outH);
    return tex(c);
  };
  const faces = { front: crop("front", W), back: crop("back", W), left: crop("left", D), right: crop("right", D) };
  // the intermediate sheet textures are not needed any more
  [t.art, t.foil, t.waste, t.lines, t.baked].forEach((x) => x?.dispose());
  return { faces, dispose: () => Object.values(faces).forEach((x) => x.dispose()) };
}
