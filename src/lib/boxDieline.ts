import { TYPE_BY_ID, fmt, type BoxConfig } from "./box";

/**
 * A flat dieline for each product type, drawn from the real dimensions (cm). It is a preview: panel proportions and flap
 * sizes follow common practice, not a production die. Edges that two panels share are folds (dashed); the rest are cuts.
 */
type Pt = [number, number];
type Poly = Pt[];
export interface Dieline {
  /** Size of the drawing in cm. */
  w: number;
  h: number;
  cuts: string;
  folds: string;
  labels: { x: number; y: number; text: string; rot?: number }[];
  /** "Flat sheet about 112 x 41 cm". */
  sheet: string;
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const rect = (x: number, y: number, w: number, h: number): Poly => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

/** Splits every horizontal and vertical edge where neighbours begin or end: covered twice = fold, once = cut. */
function classify(polys: Poly[], extraCuts: string[] = [], extraFolds: string[] = []) {
  const H = new Map<number, [number, number][]>();
  const V = new Map<number, [number, number][]>();
  const cuts: string[] = [...extraCuts];
  const folds: string[] = [...extraFolds];
  const push = (m: Map<number, [number, number][]>, k: number, a: number, b: number) => {
    const key = r3(k);
    const l = m.get(key) ?? [];
    l.push([r3(Math.min(a, b)), r3(Math.max(a, b))]);
    m.set(key, l);
  };
  for (const p of polys)
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      if (Math.abs(a[1] - b[1]) < 1e-6) push(H, a[1], a[0], b[0]);
      else if (Math.abs(a[0] - b[0]) < 1e-6) push(V, a[0], a[1], b[1]);
      else cuts.push(`M${r3(a[0])} ${r3(a[1])}L${r3(b[0])} ${r3(b[1])}`);
    }
  const run = (m: Map<number, [number, number][]>, horizontal: boolean) => {
    for (const [k, list] of m) {
      const ts = [...new Set(list.flatMap(([a, b]) => [a, b]))].sort((x, y) => x - y);
      for (let i = 0; i + 1 < ts.length; i++) {
        const [p, q] = [ts[i], ts[i + 1]];
        const n = list.filter(([a, b]) => a <= p + 1e-6 && b >= q - 1e-6).length;
        if (!n) continue;
        const d = horizontal ? `M${p} ${k}H${q}` : `M${k} ${p}V${q}`;
        (n >= 2 ? folds : cuts).push(d);
      }
    }
  };
  run(H, true);
  run(V, false);
  return { cuts: cuts.join(""), folds: folds.join("") };
}

interface Flap {
  h: number;
  /** A narrower tongue on the flap (tuck), as height and inset. */
  tuck?: { h: number; inset: number };
  tri?: boolean;
}

/** Four walls in a row with a glue flap, and flaps above and below each wall. */
function chain(widths: number[], H: number, glue: number, top: (Flap | null)[], bottom: (Flap | null)[]) {
  const maxTop = Math.max(0, ...top.map((f) => (f ? f.h + (f.tuck?.h ?? 0) : 0)));
  const maxBot = Math.max(0, ...bottom.map((f) => (f ? f.h + (f.tuck?.h ?? 0) : 0)));
  const m = 0.8;
  const y0 = m + maxTop;
  const polys: Poly[] = [];
  const xs: number[] = [];
  let x = m;
  widths.forEach((w) => { xs.push(x); x += w; });
  widths.forEach((w, i) => {
    polys.push(rect(xs[i], y0, w, H));
    const t = top[i];
    if (t) {
      if (t.tri) polys.push([[xs[i], y0], [xs[i] + w, y0], [xs[i] + w / 2, y0 - t.h]]);
      else {
        polys.push(rect(xs[i], y0 - t.h, w, t.h));
        if (t.tuck) polys.push(rect(xs[i] + t.tuck.inset, y0 - t.h - t.tuck.h, w - 2 * t.tuck.inset, t.tuck.h));
      }
    }
    const b = bottom[i];
    if (b) {
      polys.push(rect(xs[i], y0 + H, w, b.h));
      if (b.tuck) polys.push(rect(xs[i] + b.tuck.inset, y0 + H + b.h, w - 2 * b.tuck.inset, b.tuck.h));
    }
  });
  const gi = Math.min(glue * 0.7, H * 0.15);
  polys.push([[x, y0], [x + glue, y0 + gi], [x + glue, y0 + H - gi], [x, y0 + H]]);
  return { polys, xs, y0, w: x + glue + m, h: y0 + H + maxBot + m };
}

export function dieline(c: BoxConfig): Dieline {
  const { l: L, w: D, h: H } = c;
  const u = c.unit;
  const lab = (n: string, v: number) => `${n} ${fmt(v, u)} ${u}`;
  const names = TYPE_BY_ID[c.type].names;
  const out = (polys: Poly[], w: number, h: number, labels: Dieline["labels"], extraCuts: string[] = [], extraFolds: string[] = []): Dieline => {
    const k = classify(polys, extraCuts, extraFolds);
    return { w, h, ...k, labels, sheet: `Flat size about ${fmt(w - 1.6, u)} x ${fmt(h - 1.6, u)} ${u} (without trim allowance)` };
  };
  const wallLabels = (xs: number[], y0: number, widths: number[]) => [
    { x: xs[0] + widths[0] / 2, y: y0 + H / 2, text: lab(names[0], L) },
    { x: xs[1] + widths[1] / 2, y: y0 + H / 2, text: lab(names[1], D) },
    { x: xs[0] + 0.5, y: y0 + H / 2, text: lab(names[2], H), rot: -90 },
  ];

  switch (c.type) {
    case "shipping": {
      const g = Math.min(5, Math.max(2.5, D * 0.25));
      const f: Flap = { h: D / 2 };
      const k = chain([L, D, L, D], H, g, [f, f, f, f], [f, f, f, f]);
      return out(k.polys, k.w, k.h, wallLabels(k.xs, k.y0, [L, D]));
    }
    case "mailer": {
      const g = Math.min(4, Math.max(2, D * 0.18));
      const f: Flap = { h: D / 2 };
      const lid: Flap = { h: D, tuck: { h: Math.min(3, D * 0.2), inset: L * 0.04 } };
      const k = chain([L, D, L, D], H, g, [null, null, lid, null], [f, f, f, f]);
      return out(k.polys, k.w, k.h, wallLabels(k.xs, k.y0, [L, D]));
    }
    case "tuck": {
      const tuck = { h: Math.min(D * 0.42, 3.5), inset: Math.min(L * 0.06, 0.8) };
      const k = chain([L, D, L, D], H, 1.6, [null, null, { h: D, tuck }, null], [{ h: D * 0.3 }, null, { h: D, tuck }, null]);
      return out(k.polys, k.w, k.h, wallLabels(k.xs, k.y0, [L, D]));
    }
    case "gable": {
      const rise = (D / 2) * Math.tan(Math.PI / 6);
      const roof = D / 2 / Math.cos(Math.PI / 6);
      const handle = Math.min(D * 0.5, 3.5);
      const k = chain([L, D, L, D], H, 1.6, [{ h: roof, tuck: { h: handle, inset: L * 0.1 } }, { h: rise, tri: true }, { h: roof, tuck: { h: handle, inset: L * 0.1 } }, { h: rise, tri: true }], [{ h: D * 0.3 }, null, { h: D }, null]);
      return out(k.polys, k.w, k.h, wallLabels(k.xs, k.y0, [L, D]));
    }
    case "bag": {
      const k = chain([L, D, L, D], H, 2, [null, null, null, null], [{ h: D / 2 }, { h: D / 2 }, { h: D / 2 }, { h: D / 2 }]);
      return out(k.polys, k.w, k.h, wallLabels(k.xs, k.y0, [L, D]));
    }
    case "pillow": {
      // a flattened tube: the sheet is as long as the ends are wide, and as tall as the way round the pillow
      const C = (Math.PI * (D + H)) / 2;
      const g = 1;
      const m = 0.8;
      const bulge = Math.min(D * 0.18, 1.6);
      const x0 = m;
      const y0 = m + bulge;
      const curve = (y: number, dir: number) => `M${r3(x0)} ${r3(y)}Q${r3(x0 + L / 2)} ${r3(y + dir * bulge * 2)} ${r3(x0 + L)} ${r3(y)}`;
      const side = `M${r3(x0)} ${r3(y0)}V${r3(y0 + C)}M${r3(x0 + L)} ${r3(y0)}V${r3(y0 + C)}M${r3(x0 + L)} ${r3(y0 + C * 0.1)}L${r3(x0 + L + g)} ${r3(y0 + C * 0.14)}V${r3(y0 + C * 0.86)}L${r3(x0 + L)} ${r3(y0 + C * 0.9)}`;
      const folds = `M${r3(x0)} ${r3(y0 + C * 0.12)}H${r3(x0 + L)}M${r3(x0)} ${r3(y0 + C * 0.88)}H${r3(x0 + L)}M${r3(x0)} ${r3(y0 + C / 2)}H${r3(x0 + L)}`;
      return {
        w: x0 + L + g + m, h: y0 + C + bulge + m, cuts: side + curve(y0, -1) + curve(y0 + C, 1), folds,
        labels: [{ x: x0 + L / 2, y: y0 + C * 0.3, text: lab(names[0], L) }, { x: x0 + 0.5, y: y0 + C / 2, text: `Round the pillow ${fmt(C, u)} ${u}`, rot: -90 }],
        sheet: `Flat size about ${fmt(L + g, u)} x ${fmt(C, u)} ${u} (without trim allowance)`,
      };
    }
    case "rigid": {
      const t = 0.3; // gap between board pieces
      const Hb = H * 0.62;
      const Hl = H * 0.5;
      const cross = (x: number, y: number, a: number, b: number, hh: number) => [
        rect(x + hh + t, y + hh + t, a, b), // floor
        rect(x + hh + t, y, a, hh), // back wall
        rect(x + hh + t, y + hh + 2 * t + b, a, hh), // front wall
        rect(x, y + hh + t, hh, b), // left
        rect(x + hh + 2 * t + a, y + hh + t, hh, b), // right
      ];
      const m = 0.8;
      const wBase = 2 * Hb + 2 * t + L;
      const La = L + 0.4;
      const Da = D + 0.4;
      const wLid = 2 * Hl + 2 * t + La;
      const hBase = 2 * Hb + 2 * t + D;
      const hLid = 2 * Hl + 2 * t + Da;
      const polys = [...cross(m, m, L, D, Hb), ...cross(m + wBase + 2, m, La, Da, Hl)];
      return out(polys, m * 2 + wBase + 2 + wLid, m * 2 + Math.max(hBase, hLid), [
        { x: m + Hb + t + L / 2, y: m + Hb + t + D / 2, text: `Base ${fmt(L, u)} x ${fmt(D, u)} ${u}` },
        { x: m + wBase + 2 + Hl + t + La / 2, y: m + Hl + t + Da / 2, text: `Lid ${fmt(La, u)} x ${fmt(Da, u)} ${u}` },
        { x: m + Hb + t + L / 2, y: m + Hb / 2, text: lab(names[2], Hb) },
      ]);
    }
    case "pouch": {
      const m = 0.8;
      const gap = 1.2;
      const gus = D / 2;
      const front = rect(m, m, L, H);
      const back = rect(m + L + gap, m, L, H);
      const g1 = rect(m, m + H, L, gus);
      const g2 = rect(m + L + gap, m + H, L, gus);
      const seal = (x: number) => `M${r3(x + 0.8)} ${r3(m)}V${r3(m + H)}M${r3(x + L - 0.8)} ${r3(m)}V${r3(m + H)}M${r3(x)} ${r3(m + 1.4)}H${r3(x + L)}`;
      return out([front, back, g1, g2], m * 2 + L * 2 + gap, m * 2 + H + gus, [
        { x: m + L / 2, y: m + H / 2, text: lab(names[0], L) },
        { x: m + 0.5, y: m + H / 2, text: lab(names[2], H), rot: -90 },
        { x: m + L / 2, y: m + H + gus / 2, text: lab(names[1], D) },
      ], [], [seal(m), seal(m + L + gap)]);
    }
  }
}

/** A true-size SVG file (width and height in cm), cut lines solid, fold lines dashed. */
export function dielineSvg(d: Dieline, title: string): string {
  const sw = Math.max(d.w, d.h) / 600;
  const fs = Math.max(d.w, d.h) / 55;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const txt = d.labels
    .map((l) => `<text x="${r3(l.x)}" y="${r3(l.y)}" font-size="${r3(fs)}" text-anchor="middle"${l.rot ? ` transform="rotate(${l.rot} ${r3(l.x)} ${r3(l.y)})"` : ""}>${esc(l.text)}</text>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${r3(d.w)}cm" height="${r3(d.h + fs * 3)}cm" viewBox="0 0 ${r3(d.w)} ${r3(d.h + fs * 3)}">
<title>${esc(title)}</title>
<g fill="none" stroke-linejoin="round"><path d="${d.cuts}" stroke="#b1432f" stroke-width="${r3(sw)}"/><path d="${d.folds}" stroke="#2a5d7c" stroke-width="${r3(sw)}" stroke-dasharray="${r3(sw * 6)} ${r3(sw * 4)}"/></g>
<g fill="#17231d" font-family="Arial, sans-serif">${txt}<text x="${r3(0.8)}" y="${r3(d.h + fs * 1.6)}" font-size="${r3(fs * 0.9)}">PREVIEW ONLY. Our team will confirm the final dieline. Red: cut. Blue dashed: fold.</text></g>
</svg>
`;
}
