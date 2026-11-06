import * as THREE from "three";
import { site } from "@/content/site";

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

/** Kraft cardboard: warm base, corrugation banding and paper fibres. */
export function kraftTexture() {
  const [c, g] = makeCanvas(256, 256);
  const rnd = mulberry32(7);
  g.fillStyle = "#bd9460";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 6) {
    g.fillStyle = y % 12 === 0 ? "rgba(90,60,25,0.10)" : "rgba(255,230,190,0.07)";
    g.fillRect(0, y, 256, 3);
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = rnd() > 0.5 ? "rgba(70,45,15,0.16)" : "rgba(255,235,200,0.14)";
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1);
  }
  return finish(c);
}

/** Corrugation relief (grayscale bump map): soft sine ridges plus grain. */
export function kraftBump() {
  const [c, g] = makeCanvas(128, 128);
  const rnd = mulberry32(21);
  for (let y = 0; y < 128; y++) {
    const v = 128 + Math.sin((y / 128) * Math.PI * 2 * 12) * 70;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 128, 1);
  }
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(${rnd() > 0.5 ? 255 : 0},${rnd() > 0.5 ? 255 : 0},0,0.05)`;
    g.fillRect(rnd() * 128, rnd() * 128, 1, 1);
  }
  return finish(c, false);
}

/** Matte white card stock with a faint grain. */
export function whiteTexture() {
  const [c, g] = makeCanvas(128, 128);
  const rnd = mulberry32(5);
  g.fillStyle = "#ece8e1";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = rnd() > 0.5 ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.35)";
    g.fillRect(rnd() * 128, rnd() * 128, 1, 1);
  }
  return finish(c);
}

/** Near-black laminated stock; the gloss comes from low roughness. */
export function blackTexture() {
  const [c, g] = makeCanvas(128, 128);
  const rnd = mulberry32(9);
  g.fillStyle = "#16130f";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = "rgba(255,255,255,0.025)";
    g.fillRect(rnd() * 128, rnd() * 128, 1, 1);
  }
  return finish(c);
}

export type MaterialKind = "kraft" | "white" | "black";

/** PBR materials for the model library. Textures are owned by the returned object's `dispose`. */
export function createPackMaterial(kind: MaterialKind) {
  const map = kind === "kraft" ? kraftTexture() : kind === "white" ? whiteTexture() : blackTexture();
  const bump = kind === "kraft" ? kraftBump() : null;
  const material = new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: 0.5,
    roughness: kind === "kraft" ? 0.92 : kind === "white" ? 0.82 : 0.22,
    metalness: kind === "black" ? 0.12 : 0,
    side: THREE.DoubleSide,
  });
  return {
    material,
    dispose() {
      map.dispose();
      bump?.dispose();
      material.dispose();
    },
  };
}

export function logoTexture() {
  const [c, g] = makeCanvas(1024, 256);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#ff5b2e";
  g.font = "700 150px system-ui, sans-serif";
  g.fillText(site.brand.name, 512, 108);
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.font = "500 34px system-ui, sans-serif";
  g.fillText("PACKAGING, UNBOXED", 512, 212);
  return finish(c, true, false);
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
