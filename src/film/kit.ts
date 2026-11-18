import * as THREE from "three";
import type { Skin } from "@/content/catalog";
import { site } from "@/content/site";
export { lin, seg } from "@/lib/making";

/** Collects what a recipe creates so one call frees all of it. */
export class Pool {
  private items: { dispose(): void }[] = [];
  add<T extends { dispose(): void }>(x: T): T {
    this.items.push(x);
    return x;
  }
  dispose() {
    for (const x of this.items) x.dispose();
    this.items.length = 0;
  }
}

export const PI2 = Math.PI / 2;
export const lerp = THREE.MathUtils.lerp;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rect { x: number; y: number; w: number; h: number }

/** Sheet coordinates: x right, y up, origin bottom-left of the sheet (the same as uv). */
export interface SheetArt { SW: number; SH: number; fronts: Rect[]; sides: Rect[] }

const css = (c: THREE.ColorRepresentation) => "#" + new THREE.Color(c).getHexString();
const mix = (a: string, b: string, t: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

const grainTiles = new Map<string, HTMLCanvasElement>();
const TILE = 512;

/** One tile of speckle (and, for kraft, fine stripes) per material, painted once and reused: far cheaper than thousands of specks per sheet. */
function grainTile(material: Skin["material"]) {
  let t = grainTiles.get(material);
  if (t) return t;
  t = document.createElement("canvas");
  t.width = t.height = TILE;
  const g = t.getContext("2d")!;
  const r = rng(material.length * 31 + 7);
  const n = Math.round((material === "kraft" ? 5200 : 2600) * 0.45);
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(60,40,15,0.10)" : "rgba(255,245,225,0.10)";
    g.fillRect(r() * TILE, r() * TILE, 1 + r() * 2, 1);
  }
  if (material === "kraft") {
    for (let y = 0; y < TILE; y += 6) {
      g.fillStyle = (y / 6) % 2 ? "rgba(90,60,25,0.05)" : "rgba(255,230,190,0.04)";
      g.fillRect(0, y, TILE, 3);
    }
  }
  grainTiles.set(material, t);
  return t;
}

/** Paper / board grain over the whole canvas. */
function grain(g: CanvasRenderingContext2D, w: number, h: number, material: Skin["material"]) {
  const t = grainTile(material);
  for (let y = 0; y < h; y += TILE) for (let x = 0; x < w; x += TILE) g.drawImage(t, x, y);
}

/**
 * Paints the whole sheet: base color and grain, then the print style of the skin on the panels
 * (`fronts` get the brand mark, `sides` the secondary art). `blank` skips the print (the unprinted sheet).
 */
export function sheetTexture(pool: Pool, skin: Skin, art: SheetArt, blank: boolean, low: boolean): THREE.CanvasTexture {
  if (blank && skin.fastBlank) {
    // the unprinted sheet is never shown (the print wipe is finished): a flat swatch instead of a second full-size texture
    const c = document.createElement("canvas");
    c.width = c.height = 4;
    const g = c.getContext("2d")!;
    g.fillStyle = skin.base;
    g.fillRect(0, 0, 4, 4);
    const t = pool.add(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const px = (low ? 640 : 1024) / Math.max(art.SW, art.SH);
  const W = Math.max(8, Math.round(art.SW * px));
  const H = Math.max(8, Math.round(art.SH * px));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const full = skin.print === "full";
  g.fillStyle = full && !blank ? skin.second : skin.base;
  g.fillRect(0, 0, W, H);
  grain(g, W, H, skin.material);
  if (!blank && skin.print !== "none") {
    const R = (r: Rect) => ({ x: r.x * px, y: (art.SH - r.y - r.h) * px, w: r.w * px, h: r.h * px }); // canvas y is down
    const ink = skin.accent;
    const word = (r: Rect, scale: number, color: string) => {
      const b = R(r);
      g.save();
      g.fillStyle = color;
      g.textAlign = "center";
      g.textBaseline = "middle";
      const size = Math.min(b.h * 0.22, b.w * 0.2) * scale;
      g.font = `600 ${size}px Georgia, 'Times New Roman', serif`;
      if (skin.logo) {
        // the visitor's logo, fitted inside the panel (kept in the browser, never uploaded)
        const img = skin.logo as CanvasImageSource & { width: number; height: number };
        const iw = img.width || 1;
        const ih = img.height || 1;
        const f = Math.min((b.w * 0.62) / iw, (b.h * 0.34) / ih);
        g.drawImage(skin.logo, b.x + b.w / 2 - (iw * f) / 2, b.y + b.h * 0.42 - (ih * f) / 2, iw * f, ih * f);
      } else g.fillText(site.brand.name, b.x + b.w / 2, b.y + b.h * 0.42, b.w * 0.86);
      g.restore();
    };
    const foilFill = (r: Rect) => {
      if (!skin.foil) return ink;
      const b = R(r);
      const gr = g.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      gr.addColorStop(0, mix(skin.second, "#ffffff", 0.35));
      gr.addColorStop(0.5, skin.second);
      gr.addColorStop(1, mix(skin.second, "#000000", 0.25));
      return gr as unknown as string;
    };
    const all = [...art.fronts, ...art.sides];
    if (skin.print === "band" || full) {
      for (const r of all) {
        const b = R(r);
        g.fillStyle = full ? skin.base : ink;
        g.fillRect(b.x, b.y + b.h * 0.62, b.w, b.h * 0.1);
        if (!full) {
          g.fillStyle = skin.second;
          g.fillRect(b.x, b.y + b.h * 0.74, b.w, b.h * 0.02);
        }
      }
    } else if (skin.print === "stripes") {
      for (const r of all) {
        const b = R(r);
        g.fillStyle = ink;
        const step = Math.max(6, b.w / 14);
        for (let x = b.x + step / 2; x < b.x + b.w; x += step) g.fillRect(x, b.y, step * 0.28, b.h);
      }
      for (const r of art.fronts) {
        const b = R(r);
        g.fillStyle = skin.base;
        g.fillRect(b.x + b.w * 0.14, b.y + b.h * 0.3, b.w * 0.72, b.h * 0.24);
      }
    } else if (skin.print === "dots") {
      for (const r of all) {
        const b = R(r);
        g.fillStyle = ink;
        const step = Math.max(8, b.w / 10);
        for (let y = b.y + step / 2; y < b.y + b.h; y += step)
          for (let x = b.x + step / 2; x < b.x + b.w; x += step) {
            g.beginPath();
            g.arc(x, y, step * 0.13, 0, Math.PI * 2);
            g.fill();
          }
      }
      for (const r of art.fronts) {
        const b = R(r);
        g.fillStyle = skin.base;
        g.beginPath();
        g.ellipse(b.x + b.w / 2, b.y + b.h * 0.42, b.w * 0.4, b.h * 0.15, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    for (const r of art.fronts) word(r, 1, skin.print === "stripes" || skin.print === "dots" ? ink : full ? skin.base : (foilFill(r) as string));
    for (const r of art.sides) if (skin.print !== "dots") word(r, 0.6, full ? skin.base : ink);
  }
  const t = pool.add(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Corrugated board edge: two flat liners and a wave between them. */
export function fluteTexture(pool: Pool, liner: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 32;
  const g = c.getContext("2d")!;
  g.fillStyle = mix(liner, "#3a2610", 0.35);
  g.fillRect(0, 0, 256, 32);
  g.fillStyle = liner;
  g.fillRect(0, 0, 256, 5);
  g.fillRect(0, 27, 256, 5);
  g.strokeStyle = liner;
  g.lineWidth = 3;
  g.beginPath();
  for (let x = 0; x <= 256; x += 2) {
    const y = 16 + Math.sin((x / 256) * Math.PI * 2 * 16) * 8;
    if (x === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  const t = pool.add(new THREE.CanvasTexture(c));
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export interface Mats {
  outer: THREE.MeshStandardMaterial;
  inner: THREE.MeshStandardMaterial;
  edge: THREE.MeshStandardMaterial;
  /** Materials for rectGeo(): [edge, outer] (edge and inner share one material, 2 draw calls per panel) or [edge, outer, inner] (3). */
  arr: THREE.Material[];
  /** Print wipe: 0 shows the blank sheet, 1 the print. A bright scan line sits at the wipe edge (uScan). */
  uReveal: { value: number };
  uScan: { value: number };
  /** Edge and inner faces share one material and one small texture (edge swatch on top, inner swatch below): rectGeo(.., packed) maps to it. */
  packed?: boolean;
}

/** Quality tier of the current session (set by the engine before a recipe is built): 0 = low, 1 = mid, 2 = high. Extras like relief skip tier 0. */
let kitQuality = 1;
export const setKitQuality = (q: number) => { kitQuality = q; };

const ROUGH: Record<Skin["material"], number> = { kraft: 0.92, white: 0.82, black: 0.4, color: 0.72, film: 0.3 };

/** Materials of one skin. `printTex` / `blankTex` come from sheetTexture(); the outer face wipes between them. */
export function skinMats(pool: Pool, skin: Skin, printTex: THREE.Texture, blankTex: THREE.Texture, edgeMap?: THREE.Texture, separateEdge = false, edgeColor?: string): Mats {
  const uReveal = { value: 1 };
  const uScan = { value: 0 };
  const uBlank = { value: blankTex };
  const extra = [blankTex]; // used through a uniform, so the engine cannot find it by itself: listed for the warm-up
  const outer = pool.add(new THREE.MeshStandardMaterial({ map: printTex, roughness: skin.finish?.gloss ? 0.2 : ROUGH[skin.material], metalness: skin.material === "black" ? 0.08 : 0 }));
  outer.userData.extraTextures = extra;
  if (skin.finish?.emboss) {
    outer.bumpMap = printTex;
    outer.bumpScale = 1.6;
  } else if (kitQuality > 0 && (skin.material === "kraft" || skin.material === "white" || skin.material === "color")) {
    // relief from the sheet's own grain and flute lines (no extra texture): board and paper catch the light instead of reading as flat colour
    outer.bumpMap = printTex;
    outer.bumpScale = skin.material === "kraft" ? 2.2 : 1.2;
  }
  outer.onBeforeCompile = (sh) => {
    sh.uniforms.uBlankMap = uBlank;
    sh.uniforms.uReveal = uReveal;
    sh.uniforms.uScan = uScan;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D uBlankMap;\nuniform float uReveal;\nuniform float uScan;")
      .replace(
        "#include <map_fragment>",
        `vec4 sp = texture2D(map, vMapUv);
vec4 sb = texture2D(uBlankMap, vMapUv);
diffuseColor *= mix(sb, sp, step(vMapUv.x, uReveal));`,
      )
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.86, 0.55) * exp(-pow((vMapUv.x - uReveal) * 46.0, 2.0)) * uScan;`);
  };
  const innerColor = skin.innerColor ?? (skin.material === "black" ? "#34322f" : skin.material === "kraft" ? "#d8b987" : mix(skin.base, "#f3ecdc", 0.6));
  if (edgeMap || separateEdge) {
    // one material for the edge and the inner face (2 draw calls per panel instead of 3): a texture with the edge on top
    // (the flute cross-section, or a flat colour) and the inner colour in a strip below it
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 40;
    const g = c.getContext("2d")!;
    g.fillStyle = edgeColor ?? innerColor;
    g.fillRect(0, 0, 256, 32);
    if (edgeMap?.image) g.drawImage(edgeMap.image as CanvasImageSource, 0, 0, 256, 32);
    g.fillStyle = innerColor;
    g.fillRect(0, 32, 256, 8);
    const tex = pool.add(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    if (edgeMap) tex.repeat.copy(edgeMap.repeat);
    const shared = pool.add(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    return { outer, inner: shared, edge: shared, arr: [shared, outer], uReveal, uScan, packed: true };
  }
  const inner = pool.add(new THREE.MeshStandardMaterial({ color: innerColor, roughness: 0.9 }));
  // without a flute map the edge and the inner face look the same: one material, so the box needs only 2 draw calls
  return { outer, inner, edge: inner, arr: [inner, outer], uReveal, uScan };
}

/**
 * A box-shaped board rectangle at (x, y) with size w x h and thickness t, in a hinge's local frame:
 * the printed face is at z = 0 and the thickness runs into -z. The outer face uv are sheet coordinates:
 * (sx, sy) is where the local origin sits on the sheet.
 */
export function rectGeo(pool: Pool, x: number, y: number, w: number, h: number, t: number, sx: number, sy: number, SW: number, SH: number, trim = 0, three = false, packed = false): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w - trim, h, t);
  g.translate(x + w / 2, y + h / 2, -t / 2);
  const uv = g.attributes.uv;
  for (let i = 16; i < 20; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    uv.setXY(i, (sx + x + u * w) / SW, (sy + y + v * h) / SH);
  }
  if (packed) {
    // edge faces sample the top 80% of the packed texture, the inner face its bottom strip
    for (let i = 0; i < 16; i++) uv.setY(i, 0.2 + 0.8 * uv.getY(i));
    for (let i = 20; i < 24; i++) uv.setXY(i, 0.5, 0.1);
  }
  // group by material: the four edge faces (and the inner face when it shares the material) are one draw call
  g.clearGroups();
  if (three) {
    g.addGroup(0, 24, 0);
    g.addGroup(24, 6, 1);
    g.addGroup(30, 6, 2);
  } else {
    const old = g.index!.array as Uint16Array;
    const next = new Uint16Array(36);
    next.set(old.subarray(0, 24), 0);
    next.set(old.subarray(30, 36), 24); // inner face
    next.set(old.subarray(24, 30), 30); // outer face last
    g.index!.array = next;
    g.addGroup(0, 30, 0);
    g.addGroup(30, 6, 1);
  }
  return pool.add(g);
}

/** Soft contact shadow (one texture for the lifetime of the page). */
/** One soft-shadow texture shared by every shadow blob, freed together with the last recipe that uses it (nothing outlives the page). */
let shadowTex: THREE.CanvasTexture | null = null;
let shadowUsers = 0;
export function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  // two layers in one texture: a tight dark core (the contact) inside a wide soft penumbra
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(24,16,6,0.78)");
  gr.addColorStop(0.22, "rgba(24,16,6,0.5)");
  gr.addColorStop(0.55, "rgba(24,16,6,0.16)");
  gr.addColorStop(1, "rgba(24,16,6,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

export function blobShadow(pool: Pool): THREE.Mesh {
  shadowUsers++;
  pool.add({
    dispose() {
      if (--shadowUsers === 0) {
        shadowTex?.dispose();
        shadowTex = null;
      }
    },
  });
  const m = new THREE.Mesh(
    pool.add(new THREE.PlaneGeometry(1, 1)),
    pool.add(new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })),
  );
  m.rotation.x = -PI2;
  m.renderOrder = -1;
  return m;
}

/** Distance at which a w x h area (at the origin) just fits the camera view, with a margin. */
export function fitDistance(cam: THREE.PerspectiveCamera, w: number, h: number, margin = 1.12) {
  const t = Math.tan((cam.fov * Math.PI) / 360);
  return Math.max((h / 2) / t, (w / 2) / (t * cam.aspect)) * margin;
}

/** Puts the camera on a sphere around (tx, ty, tz): yaw/pitch in radians. No allocation. */
export function orbit(cam: THREE.PerspectiveCamera, tx: number, ty: number, tz: number, dist: number, yaw: number, pitch: number) {
  const cp = Math.cos(pitch);
  cam.position.set(tx + Math.sin(yaw) * cp * dist, ty + Math.sin(pitch) * dist, tz + Math.cos(yaw) * cp * dist);
  cam.lookAt(tx, ty, tz);
}

export const steel = (pool: Pool, color = "#7d8388") => pool.add(new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.85 }));
