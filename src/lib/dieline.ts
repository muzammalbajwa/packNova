import * as THREE from "three";
import { site } from "@/content/site";
import { makeCanvas, mulberry32 } from "./textures";
import { FOLD } from "./making";
import type { Theme } from "./palette";

/**
 * Procedural folding-carton dieline: a flat sheet of separate panels joined by hinges.
 * Units: 1 world unit = 10 cm. The carton is 12 x 6 x 18 cm, the same as the configurator's
 * default folding carton, so the story can hand a real spec to the quote flow.
 *
 * Flat layout (outer printed face toward +z, y up):
 *
 *               [tab]
 *               [lid ]                    lid hangs off the BACK panel
 *         [dust][ ... ][dust]
 *   [back][left][front][right][glue]
 *         [dust][botFront][dust]
 *
 * Folding makes the sides wrap BACKWARD (-z) so the printed face stays outside and the
 * finished carton stands behind the front panel. Every top flap folds -90deg about its
 * local x axis, every bottom flap +90deg, because "inward" is local -z for all of them.
 * `lift` stacks overlapping flaps: outermost layer 0, each inner layer more negative.
 */
export const W = 1.2;
export const H = 1.8;
export const D = 0.6;
const GL = 0.26; // glue flap width
const DF = 0.3; // dust flap length
const TAB = 0.3; // tuck tab length
const T = 0.014; // board thickness
const M = 0.3; // sheet margin around the dieline (becomes waste)

export const BOX_CM = { l: W * 10, w: D * 10, h: H * 10 } as const;

export type PanelId =
  | "front" | "left" | "back" | "right" | "glue"
  | "dustTopL" | "dustTopR" | "lid" | "tab"
  | "botFront" | "botBack" | "dustBotL" | "dustBotR";

export interface PanelDef {
  id: PanelId;
  parent: PanelId | null;
  /** Hinge point in the parent's local frame (a panel's origin is its own hinge point). */
  hinge: readonly [number, number];
  axis: "x" | "y";
  /** Fold angle = sign * 90deg * amount. */
  sign: 1 | -1;
  /** Mesh size and its centre relative to the hinge point. */
  w: number;
  h: number;
  cx: number;
  cy: number;
  /** [from, to] progress window of the fold. */
  win: readonly [number, number];
  /** Offset along local z so stacked flaps never z-fight (negative = toward the inside). */
  lift: number;
  /** Does the outer face carry print? */
  printed: boolean;
}

const P = (d: Omit<PanelDef, "axis" | "lift" | "printed"> & Partial<Pick<PanelDef, "axis" | "lift" | "printed">>): PanelDef => ({
  axis: "y",
  lift: 0,
  printed: false,
  ...d,
});

export const PANELS: readonly PanelDef[] = [
  P({ id: "front", parent: null, hinge: [0, 0], sign: 1, w: W, h: H, cx: 0, cy: 0, win: [0, 0], printed: true }),
  P({ id: "left", parent: "front", hinge: [-W / 2, 0], sign: -1, w: D, h: H, cx: -D / 2, cy: 0, win: FOLD.left, printed: true }),
  P({ id: "back", parent: "left", hinge: [-D, 0], sign: -1, w: W, h: H, cx: -W / 2, cy: 0, win: FOLD.back, printed: true }),
  P({ id: "right", parent: "front", hinge: [W / 2, 0], sign: 1, w: D, h: H, cx: D / 2, cy: 0, win: FOLD.right, printed: true }),
  P({ id: "glue", parent: "right", hinge: [D, 0], sign: 1, w: GL, h: H - 0.16, cx: GL / 2, cy: 0, win: FOLD.glue, lift: -0.016 }),
  // top: dust flaps tuck under the lid
  P({ id: "dustTopL", parent: "left", hinge: [-D / 2, H / 2], axis: "x", sign: -1, w: D - 0.05, h: DF, cx: 0, cy: DF / 2, win: FOLD.topDust, lift: -0.02 }),
  P({ id: "dustTopR", parent: "right", hinge: [D / 2, H / 2], axis: "x", sign: -1, w: D - 0.05, h: DF, cx: 0, cy: DF / 2, win: FOLD.topDust, lift: -0.02 }),
  P({ id: "lid", parent: "back", hinge: [-W / 2, H / 2], axis: "x", sign: -1, w: W - 0.03, h: D, cx: 0, cy: D / 2, win: FOLD.lid, printed: true, lift: 0.0 }),
  P({ id: "tab", parent: "lid", hinge: [0, D], axis: "x", sign: -1, w: W * 0.78, h: TAB, cx: 0, cy: TAB / 2, win: FOLD.tab, lift: -0.03 }),
  // bottom: dust flaps inside, then the long flaps
  P({ id: "dustBotL", parent: "left", hinge: [-D / 2, -H / 2], axis: "x", sign: 1, w: D - 0.05, h: DF, cx: 0, cy: -DF / 2, win: FOLD.botDust, lift: -0.04 }),
  P({ id: "dustBotR", parent: "right", hinge: [D / 2, -H / 2], axis: "x", sign: 1, w: D - 0.05, h: DF, cx: 0, cy: -DF / 2, win: FOLD.botDust, lift: -0.04 }),
  P({ id: "botBack", parent: "back", hinge: [-W / 2, -H / 2], axis: "x", sign: 1, w: W - 0.03, h: D * 0.55, cx: 0, cy: -D * 0.275, win: FOLD.botMain, lift: -0.02 }),
  P({ id: "botFront", parent: "front", hinge: [0, -H / 2], axis: "x", sign: 1, w: W - 0.03, h: D, cx: 0, cy: -D / 2, win: FOLD.botMain, lift: 0 }),
];

export const PANEL_BY_ID = Object.fromEntries(PANELS.map((p) => [p.id, p])) as Record<PanelId, PanelDef>;
export const CHILDREN = (id: PanelId | null) => PANELS.filter((p) => p.parent === id);

/** Absolute flat (unfolded) origin of each panel's hinge point. */
const origins = {} as Record<PanelId, [number, number]>;
for (const p of PANELS) {
  const o = p.parent ? origins[p.parent] : [0, 0];
  origins[p.id] = [o[0] + p.hinge[0], o[1] + p.hinge[1]];
}

/** Flat rectangle of a panel: [x0, y0, x1, y1] in sheet space. */
export function flatRect(p: PanelDef): [number, number, number, number] {
  const [ox, oy] = origins[p.id];
  const x = ox + p.cx;
  const y = oy + p.cy;
  return [x - p.w / 2, y - p.h / 2, x + p.w / 2, y + p.h / 2];
}

/* ---------- sheet bounds (dieline + waste margin) ---------- */
const rects = PANELS.map(flatRect);
export const SHEET = (() => {
  const x0 = Math.min(...rects.map((r) => r[0])) - M;
  const x1 = Math.max(...rects.map((r) => r[2])) + M;
  const y0 = Math.min(...rects.map((r) => r[1])) - M;
  const y1 = Math.max(...rects.map((r) => r[3])) + M;
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
})();

/* ---------- geometry ---------- */

/**
 * One thin box per panel. The +z face is the printed outer face, -z the raw inner face.
 * UVs of every face are sheet-space (0..1 over the whole sheet) so artwork, kraft grain
 * and the waste mask line up across panels.
 */
export function panelGeometry(p: PanelDef): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(p.w, p.h, T);
  g.translate(p.cx, p.cy, -T / 2 + p.lift);
  const [ox, oy] = origins[p.id];
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (ox + pos.getX(i) - SHEET.x0) / SHEET.w, (oy + pos.getY(i) - SHEET.y0) / SHEET.h);
  }
  uv.needsUpdate = true;
  return g;
}

/* ---------- painters (2D canvas, sheet space) ---------- */

export interface ArtTextures {
  art: THREE.CanvasTexture;
  foil: THREE.CanvasTexture;
  waste: THREE.CanvasTexture;
  lines: THREE.CanvasTexture;
  /** Kraft board with the print baked in (low tier, no shader). */
  baked: THREE.CanvasTexture | null;
}

const tex = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/** Brand block + text colors for a theme (dark themes print the surface color, light ones the accent). */
function printColors(t: Theme) {
  return t.dark
    ? { block: t.surface, mark: t.accent, text: t.fg, stripe: t.accent }
    : { block: t.accent, mark: t.onAccent, text: t.onAccent, stripe: t.kraft };
}

function drawMark(g: CanvasRenderingContext2D, x: number, y: number, s: number, kraft: string, accent: string) {
  // same folded-box mark as the Logo component (viewBox 32x32)
  const poly = (pts: number[][], fill: string) => {
    g.beginPath();
    pts.forEach(([px, py], i) => (i ? g.lineTo(x + px * s, y + py * s) : g.moveTo(x + px * s, y + py * s)));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  poly([[4, 12], [16, 18], [16, 29], [4, 23]], kraft);
  poly([[28, 12], [16, 18], [16, 29], [28, 23]], "rgba(0,0,0,0.38)");
  poly([[16, 5], [28, 11], [16, 17], [4, 11]], accent);
}

export function buildArtTextures(theme: Theme, px: number, bake: boolean): ArtTextures {
  const cw = px;
  const ch = Math.round((px * SHEET.h) / SHEET.w);
  const sx = (x: number) => ((x - SHEET.x0) / SHEET.w) * cw;
  const sy = (y: number) => ch - ((y - SHEET.y0) / SHEET.h) * ch; // canvas y runs down, sheet y runs up
  const k = cw / SHEET.w; // pixels per world unit
  const col = printColors(theme);
  const name = site.brand.name;

  /* --- print layer (transparent where nothing is printed) --- */
  const [artC, a] = makeCanvas(cw, ch);
  const [foilC, f] = makeCanvas(cw, ch);
  for (const p of PANELS) {
    if (!p.printed) continue;
    const [x0, y0, x1, y1] = flatRect(p);
    const X = sx(x0), Y = sy(y1), w = (x1 - x0) * k, h = (y1 - y0) * k;
    a.fillStyle = col.block;
    a.fillRect(X, Y, w, h);
    a.save();
    a.beginPath();
    a.rect(X, Y, w, h);
    a.clip();
    if (p.id === "front") {
      const mark = w * 0.34;
      drawMark(a, X + w / 2 - mark / 2, Y + h * 0.2, mark / 32, theme.kraft, theme.dark ? theme.accent : theme.onAccent);
      drawMark(f, X + w / 2 - mark / 2, Y + h * 0.2, mark / 32, "#fff", "#fff");
      a.textAlign = "center";
      a.textBaseline = "middle";
      a.fillStyle = col.mark;
      a.font = `700 ${w * 0.17}px system-ui, sans-serif`;
      a.fillText(name, X + w / 2, Y + h * 0.2 + mark + w * 0.14);
      f.textAlign = "center";
      f.textBaseline = "middle";
      f.fillStyle = "#fff";
      f.font = a.font;
      f.fillText(name, X + w / 2, Y + h * 0.2 + mark + w * 0.14);
      a.fillStyle = col.text;
      a.globalAlpha = 0.85;
      a.font = `500 ${w * 0.052}px system-ui, sans-serif`;
      a.fillText(site.hero.eyebrow.toUpperCase(), X + w / 2, Y + h * 0.2 + mark + w * 0.3);
      a.globalAlpha = 1;
      a.fillStyle = col.stripe;
      a.fillRect(X, Y + h * 0.9, w, h * 0.1);
    } else if (p.id === "left" || p.id === "right") {
      a.translate(X + w / 2, Y + h / 2);
      a.rotate(-Math.PI / 2);
      a.textAlign = "center";
      a.textBaseline = "middle";
      a.fillStyle = col.mark;
      // rotated text runs along the panel height: size it so it always fits with a margin
      const probe = 100;
      a.font = `700 ${probe}px system-ui, sans-serif`;
      const size = Math.min(w * 0.5, (probe * h * 0.8) / a.measureText(name.toUpperCase()).width);
      a.font = `700 ${size}px system-ui, sans-serif`;
      a.fillText(name.toUpperCase(), 0, 0);
    } else if (p.id === "back") {
      const rnd = mulberry32(5);
      a.fillStyle = col.text;
      a.globalAlpha = 0.9;
      for (let bx = X + w * 0.14; bx < X + w * 0.5; ) {
        const bw = 2 + Math.floor(rnd() * 5) * (k / 220);
        a.fillRect(bx, Y + h * 0.72, bw, h * 0.14);
        bx += bw + 2 + rnd() * 5;
      }
      a.globalAlpha = 1;
      a.textAlign = "left";
      a.textBaseline = "top";
      a.font = `600 ${w * 0.07}px system-ui, sans-serif`;
      a.fillText(name, X + w * 0.14, Y + h * 0.1);
      a.globalAlpha = 0.8;
      a.font = `500 ${w * 0.05}px system-ui, sans-serif`;
      a.fillText(site.brand.description.slice(0, 34), X + w * 0.14, Y + h * 0.18);
      a.globalAlpha = 1;
      a.fillStyle = col.stripe;
      a.fillRect(X, Y, w, h * 0.04);
    } else if (p.id === "lid") {
      drawMark(a, X + w * 0.5 - h * 0.3, Y + h * 0.2, (h * 0.6) / 32, theme.kraft, theme.dark ? theme.accent : theme.onAccent);
    }
    a.restore();
  }

  /* --- waste mask: opaque everywhere except where a panel is --- */
  const wc = Math.round(cw / 2);
  const wh = Math.round(ch / 2);
  const [wasteC, w2] = makeCanvas(wc, wh);
  w2.fillStyle = "#fff";
  w2.fillRect(0, 0, wc, wh);
  w2.globalCompositeOperation = "destination-out";
  w2.fillStyle = "#000";
  for (const r of rects) {
    const px0 = ((r[0] - SHEET.x0) / SHEET.w) * wc;
    const py0 = wh - ((r[3] - SHEET.y0) / SHEET.h) * wh;
    const inset = 2; // px: the hole is slightly smaller than the panel, so no hairline gap shows around it
    w2.fillRect(px0 + inset, py0 + inset, (r[2] - r[0]) * (wc / SHEET.w) - inset * 2, (r[3] - r[1]) * (wh / SHEET.h) - inset * 2);
  }

  /* --- die lines: solid cut lines on the outline, dashed crease lines on hinges --- */
  const [linesC, l] = makeCanvas(cw, ch);
  const stroke = (color: string, width: number, dash: number[]) => {
    l.setLineDash(dash);
    l.lineCap = "round";
    l.strokeStyle = color;
    l.lineWidth = width;
    l.shadowColor = color;
    l.shadowBlur = width * 3;
  };
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    l.beginPath();
    l.moveTo(sx(x0), sy(y0));
    l.lineTo(sx(x1), sy(y1));
    l.stroke();
  };
  // creases: every hinge, drawn along the parent's shared edge
  stroke(theme.ink.crease, k * 0.012, [k * 0.05, k * 0.04]);
  for (const p of PANELS) {
    if (!p.parent) continue;
    const [x0, y0, x1, y1] = flatRect(p);
    if (p.axis === "y") {
      const hx = origins[p.id][0];
      line(hx, y0, hx, y1);
    } else {
      const hy = origins[p.id][1];
      line(x0, hy, x1, hy);
    }
  }
  // cuts: every panel edge that is not a hinge
  stroke(theme.ink.cut, k * 0.014, []);
  for (const p of PANELS) {
    const [x0, y0, x1, y1] = flatRect(p);
    const [ox, oy] = origins[p.id];
    const hingeX = p.parent && p.axis === "y" ? ox : null;
    const hingeY = p.parent && p.axis === "x" ? oy : null;
    const eps = 1e-4;
    const edges: [number, number, number, number][] = [
      [x0, y0, x1, y0], // bottom
      [x0, y1, x1, y1], // top
      [x0, y0, x0, y1], // left
      [x1, y0, x1, y1], // right
    ];
    for (const e of edges) {
      const vertical = Math.abs(e[0] - e[2]) < eps;
      const isHinge = vertical ? hingeX !== null && Math.abs(e[0] - hingeX) < eps : hingeY !== null && Math.abs(e[1] - hingeY) < eps;
      // edges shared with a neighbouring panel along the body strip are creases too
      const shared = vertical && ["left", "right", "back", "glue", "front"].includes(p.id) && PANELS.some((q) => q !== p && q.axis === "y" && q.parent !== null && Math.abs(origins[q.id][0] - e[0]) < eps);
      if (isHinge || shared) continue;
      if (vertical) {
        line(e[0], e[1], e[2], e[3]);
        continue;
      }
      // horizontal edge: leave out the stretch where a child flap hinges on it (that is a crease)
      const cuts: [number, number][] = [];
      for (const q of PANELS) {
        if (q.parent !== p.id || q.axis !== "x" || Math.abs(origins[q.id][1] - e[1]) > eps) continue;
        const [qx0, , qx1] = flatRect(q);
        cuts.push([qx0, qx1]);
      }
      let from = e[0];
      for (const [c0, c1] of cuts.sort((m, n) => m[0] - n[0])) {
        if (c0 > from) line(from, e[1], c0, e[1]);
        from = Math.max(from, c1);
      }
      if (from < e[2]) line(from, e[1], e[2], e[1]);
    }
  }

  let baked: THREE.CanvasTexture | null = null;
  if (bake) {
    const [bc, b] = makeCanvas(cw, ch);
    b.fillStyle = theme.kraft;
    b.fillRect(0, 0, cw, ch);
    b.drawImage(artC, 0, 0);
    baked = tex(bc);
  }

  return { art: tex(artC), foil: tex(foilC), waste: tex(wasteC), lines: tex(linesC), baked };
}
