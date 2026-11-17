import * as THREE from "three";

/** Everything here is procedural (canvas): no image downloads, nothing to license. */

export function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

/** Deterministic PRNG so renders are reproducible and lint-pure. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finish(c: HTMLCanvasElement, srgb = true, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Kraft stock color of the active theme (palette.ts). Set before textures are built. */
let kraftBase = "#bd9460";
export const setKraftBase = (hex: string) => {
  kraftBase = hex;
};

export type MaterialKind = "kraft" | "white" | "black";

/* Painters draw a material's base look into any canvas size, so the same look is used
   for the tiling textures and for per-panel artwork composites. */
export function paintBase(g: CanvasRenderingContext2D, w: number, h: number, kind: MaterialKind) {
  const rnd = mulberry32(kind === "kraft" ? 7 : kind === "white" ? 5 : 9);
  const area = (w * h) / (256 * 256);
  if (kind === "kraft") {
    g.fillStyle = kraftBase;
    g.fillRect(0, 0, w, h);
    const step = Math.max(2, Math.round(h / 42));
    for (let y = 0, i = 0; y < h; y += step, i++) {
      g.fillStyle = i % 2 === 0 ? "rgba(90,60,25,0.10)" : "rgba(255,230,190,0.07)";
      g.fillRect(0, y, w, Math.max(1, step / 2));
    }
    for (let i = 0; i < 1400 * area; i++) {
      g.fillStyle = rnd() > 0.5 ? "rgba(70,45,15,0.16)" : "rgba(255,235,200,0.14)";
      g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1);
    }
  } else if (kind === "white") {
    g.fillStyle = "#ece8e1";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2800 * area; i++) {
      g.fillStyle = rnd() > 0.5 ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.35)";
      g.fillRect(rnd() * w, rnd() * h, 1, 1);
    }
  } else {
    g.fillStyle = "#16130f";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2000 * area; i++) {
      g.fillStyle = "rgba(255,255,255,0.025)";
      g.fillRect(rnd() * w, rnd() * h, 1, 1);
    }
  }
}

function baseTexture(kind: MaterialKind, size: number) {
  const [c, g] = makeCanvas(size, size);
  paintBase(g, size, size, kind);
  return finish(c);
}

export const kraftTexture = () => baseTexture("kraft", 256);

/** Converts a grayscale height canvas into a tangent-space normal map (wraps, so it tiles). */
function heightToNormal(src: HTMLCanvasElement, strength: number) {
  const w = src.width;
  const h = src.height;
  const data = src.getContext("2d")!.getImageData(0, 0, w, h).data;
  const [c, g] = makeCanvas(w, h);
  const out = g.createImageData(w, h);
  const H = (x: number, y: number) => data[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255; // canvas y is flipped vs. GL v
      out.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  g.putImageData(out, 0, 0);
  return finish(c, false);
}

/** Corrugation ridges + paper fibres, as a normal map. */
export function kraftNormal() {
  const [c, g] = makeCanvas(256, 256);
  const rnd = mulberry32(21);
  for (let y = 0; y < 256; y++) {
    const v = 128 + Math.sin((y / 256) * Math.PI * 2 * 14) * 80;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 256, 1);
  }
  for (let i = 0; i < 1800; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},0.18)`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 5, 1);
  }
  return heightToNormal(c, 1.1);
}

/** Fine paper grain, as a normal map (white / black stock). */
export function grainNormal() {
  const [c, g] = makeCanvas(128, 128);
  const rnd = mulberry32(33);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2600; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},0.22)`;
    g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1);
  }
  return heightToNormal(c, 1.4);
}

export function labelTexture() {
  const [c, g] = makeCanvas(512, 320);
  g.fillStyle = "#f4efe6";
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = "#111";
  g.font = "700 40px system-ui, sans-serif";
  g.fillText("SHIP TO", 28, 62);
  g.font = "500 28px system-ui, sans-serif";
  g.fillText("Customer Name", 28, 108);
  g.fillText("Street, City", 28, 146);
  const rnd = mulberry32(3);
  for (let x = 28; x < 484; ) {
    const w = 2 + Math.floor(rnd() * 5);
    g.fillRect(x, 190, w, 90);
    x += w + 2 + Math.floor(rnd() * 4);
  }
  return finish(c, true, false);
}

export function shadowTexture() {
  const [c, g] = makeCanvas(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(0,0,0,0.65)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Soft rounded-rectangle footprint shadow (blurred), for contact shadows under a model. */
export function contactShadowTexture() {
  const [c, g] = makeCanvas(256, 256);
  g.filter = "blur(18px)";
  g.fillStyle = "rgba(0,0,0,0.8)";
  g.beginPath();
  g.roundRect(64, 64, 128, 128, 28);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The printed brand panel of the hero carton (and the carton in the film uses the same look): a forest block with the mark, the wordmark and
 * one line under a thin rule. Transparent around the block, so the kraft shows as a margin. `repaint()` draws it again (call it once the page
 * fonts have loaded, so the wordmark uses the display face).
 */
export function brandPanelTexture(name: string, tagline: string, ink: string, paper: string, fontFamily: () => string) {
  const [c, g] = makeCanvas(1024, 640);
  const t = finish(c, true, false);
  const repaint = () => {
    const font = fontFamily();
    g.clearRect(0, 0, 1024, 640);
    g.fillStyle = ink;
    g.beginPath();
    g.roundRect(24, 24, 976, 592, 14);
    g.fill();
    // the mark: a small folded box, same three faces as the logo
    const mx = 150, my = 255, k = 4.3;
    const poly = (pts: number[][], fill: string) => {
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(mx + x * k, my + y * k) : g.moveTo(mx + x * k, my + y * k)));
      g.closePath();
      g.fillStyle = fill;
      g.fill();
    };
    poly([[-12, -6], [0, 0], [0, 11], [-12, 5]], "#b8803f");
    poly([[12, -6], [0, 0], [0, 11], [12, 5]], "#8a5f2e");
    poly([[0, -13], [12, -7], [0, -1], [-12, -7]], paper);
    g.fillStyle = paper;
    g.textBaseline = "alphabetic";
    // the wordmark is fitted to the space right of the mark (panel edge minus a margin), so no letter can run off the panel
    let size = 170;
    g.font = `600 ${size}px ${font}`;
    while (g.measureText(name).width > 1000 - 250 - 60 && size > 60) {
      size -= 4;
      g.font = `600 ${size}px ${font}`;
    }
    g.fillText(name, 250, 308);
    g.fillRect(100, 380, 824, 3);
    g.font = `400 52px ${font}`;
    g.globalAlpha = 0.9;
    g.fillText(tagline, 100, 470);
    g.globalAlpha = 1;
    t.needsUpdate = true;
  };
  repaint();
  t.userData.repaint = repaint;
  return t;
}
