/**
 * "Design your box": the configuration model, limits, URL round-trip and the readable summary.
 * No three.js and no runtime alias imports (only `import type`), so the page, the quote page and the node tests can all use it.
 * Sizes are stored in cm; the unit toggle only changes how they are shown.
 */

import type { Skin } from "@/content/catalog";

export type BoxType = "mailer" | "shipping" | "tuck" | "pillow" | "gable" | "rigid" | "bag" | "pouch";
export type MaterialId = "kraft" | "white" | "rigid" | "flute-e" | "flute-b" | "film";
export type PrintArea = "outside" | "inside" | "both";
export type Unit = "cm" | "in";
export type Surface = "matte" | "gloss";

export interface BoxConfig {
  type: BoxType;
  l: number;
  w: number;
  h: number;
  unit: Unit;
  material: MaterialId;
  /** Outside colour, "#rrggbb". */
  color: string;
  print: PrintArea;
  surface: Surface;
  foil: boolean;
  emboss: boolean;
  qty: number;
}

export type RecipeName = "rigid-box" | "corrugated-box" | "folding-carton" | "paper-bag" | "pouch";
type Range = [number, number];

export interface TypeInfo {
  id: BoxType;
  label: string;
  hint: string;
  recipe: RecipeName;
  lid: "tuck" | "lid-base" | "gable" | "pillow" | "none";
  limits: { l: Range; w: Range; h: Range };
  def: { l: number; w: number; h: number };
  materials: MaterialId[];
  /** Film progress of the flat (cut and creased) sheet and of the finished product: the fold slider maps onto this. */
  unfold: [number, number];
  /** Names of the three sizes, for the labels. */
  names: [string, string, string];
}

export const TYPES: readonly TypeInfo[] = [
  { id: "mailer", label: "Mailer box", hint: "One-piece flat box with a tuck-in lid, for posting.", recipe: "corrugated-box", lid: "none", limits: { l: [15, 60], w: [10, 45], h: [2, 12] }, def: { l: 30, w: 22, h: 6 }, materials: ["flute-e", "flute-b", "kraft", "white"], unfold: [3 / 7 + 0.004, 6 / 7 - 0.012], names: ["Length", "Width", "Height"] },
  { id: "shipping", label: "Shipping box", hint: "Regular slotted carton, taped shut.", recipe: "corrugated-box", lid: "none", limits: { l: [15, 80], w: [10, 60], h: [5, 60] }, def: { l: 40, w: 30, h: 25 }, materials: ["flute-b", "flute-e", "kraft", "white"], unfold: [3 / 7 + 0.004, 6 / 7 - 0.012], names: ["Length", "Width", "Height"] },
  { id: "tuck", label: "Tuck box", hint: "Folding carton with a tuck-in lid.", recipe: "folding-carton", lid: "tuck", limits: { l: [3, 30], w: [2, 20], h: [3, 40] }, def: { l: 9, w: 6, h: 13 }, materials: ["white", "kraft"], unfold: [2 / 6 + 0.004, 5 / 6], names: ["Length", "Width", "Height"] },
  { id: "pillow", label: "Pillow box", hint: "Curved-end carton for small light gifts.", recipe: "folding-carton", lid: "pillow", limits: { l: [5, 30], w: [2, 12], h: [1.5, 10] }, def: { l: 10, w: 6, h: 3 }, materials: ["white", "kraft"], unfold: [2 / 6 + 0.004, 5 / 6], names: ["Length", "Width", "Height"] },
  { id: "gable", label: "Gable box", hint: "Roof-shaped top with a carry handle.", recipe: "folding-carton", lid: "gable", limits: { l: [6, 25], w: [5, 20], h: [6, 30] }, def: { l: 9, w: 7, h: 10 }, materials: ["white", "kraft"], unfold: [2 / 6 + 0.004, 5 / 6], names: ["Length", "Width", "Height"] },
  { id: "rigid", label: "Rigid box with lid", hint: "Thick board wrapped in paper, lift-off lid.", recipe: "rigid-box", lid: "lid-base", limits: { l: [8, 50], w: [6, 40], h: [3, 25] }, def: { l: 20, w: 15, h: 8 }, materials: ["rigid"], unfold: [2 / 6 + 0.004, 5 / 6], names: ["Length", "Width", "Height"] },
  { id: "bag", label: "Paper bag", hint: "Flat-bottom bag with two handles.", recipe: "paper-bag", lid: "none", limits: { l: [10, 50], w: [5, 25], h: [12, 60] }, def: { l: 26, w: 12, h: 32 }, materials: ["kraft", "white"], unfold: [2 / 5, 1], names: ["Width", "Gusset", "Height"] },
  { id: "pouch", label: "Pouch", hint: "Stand-up pouch with a zipper.", recipe: "pouch", lid: "none", limits: { l: [6, 35], w: [2, 12], h: [8, 40] }, def: { l: 14, w: 7, h: 20 }, materials: ["film", "kraft", "white"], unfold: [2.3 / 6, 1], names: ["Width", "Gusset", "Height"] },
];
export const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t])) as Record<BoxType, TypeInfo>;

export const MATERIALS: Record<MaterialId, { label: string; note: string }> = {
  kraft: { label: "Kraft", note: "Natural brown board or paper" },
  white: { label: "White", note: "White paperboard or paper" },
  rigid: { label: "Rigid, wrapped", note: "Greyboard wrapped in printed paper" },
  "flute-e": { label: "Corrugated E flute", note: "Thin flute, good print surface" },
  "flute-b": { label: "Corrugated B flute", note: "Thicker flute, more protection" },
  film: { label: "Film", note: "Laminated pouch film" },
};

export const PALETTE: { id: string; label: string; hex: string }[] = [
  { id: "cream", label: "Cream", hex: "#efe8d8" },
  { id: "kraft", label: "Kraft", hex: "#b8803f" },
  { id: "forest", label: "Forest green", hex: "#1e4d3a" },
  { id: "black", label: "Black", hex: "#20201e" },
  { id: "white", label: "White", hex: "#f6f4ee" },
];

export const QUANTITIES = [100, 250, 500, 1000, 2500, 5000, 10000] as const;
export const PRINT_LABEL: Record<PrintArea, string> = { outside: "Outside", inside: "Inside", both: "Outside and inside" };

const CM_PER_IN = 2.54;
export const toUnit = (cm: number, u: Unit) => (u === "in" ? cm / CM_PER_IN : cm);
export const fromUnit = (v: number, u: Unit) => (u === "in" ? v * CM_PER_IN : v);
export const fmt = (cm: number, u: Unit) => {
  const v = toUnit(cm, u);
  return (Math.round(v * (u === "in" ? 100 : 10)) / (u === "in" ? 100 : 10)).toString();
};

const clamp = (v: number, [a, b]: Range) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));

/** Clamps the sizes to the type's limits and to the shapes the film can draw (a mailer stays flat, a shipping box stays tall). */
export function clampDims(type: BoxType, d: { l: number; w: number; h: number }) {
  const t = TYPE_BY_ID[type];
  let { l, w, h } = { l: clamp(d.l, t.limits.l), w: clamp(d.w, t.limits.w), h: clamp(d.h, t.limits.h) };
  if (type === "mailer") h = Math.min(h, Math.max(t.limits.h[0], 0.38 * w));
  if (type === "shipping") h = Math.max(h, Math.min(t.limits.h[1], 0.45 * w));
  l = Math.round(l * 10) / 10;
  w = Math.round(w * 10) / 10;
  h = Math.round(h * 10) / 10;
  return { l, w, h };
}

export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

export function defaultConfig(type: BoxType = "tuck"): BoxConfig {
  const t = TYPE_BY_ID[type];
  const material = t.materials[0];
  return {
    type, ...t.def, unit: "cm", material, color: defaultColor(material), print: "outside", surface: "matte", foil: false, emboss: false, qty: 1000,
  };
}
export const defaultColor = (m: MaterialId) => (m === "kraft" || m === "flute-e" || m === "flute-b" ? "#b8803f" : m === "rigid" ? "#1e4d3a" : m === "film" ? "#20201e" : "#efe8d8");

/** What changes when the product type changes: sizes reset to its defaults, an unsupported material becomes its first one. */
export function withType(c: BoxConfig, type: BoxType): BoxConfig {
  const t = TYPE_BY_ID[type];
  const material = t.materials.includes(c.material) ? c.material : t.materials[0];
  const color = material === c.material ? c.color : defaultColor(material);
  return { ...c, type, ...t.def, material, color };
}

/* ------------------------------------------------------------------ the quote URL */

const fin = (c: BoxConfig) => [c.surface, c.foil && "foil", c.emboss && "emboss"].filter(Boolean).join("+");

/** Text for the quote message: one line per choice. The logo is never carried. */
export function summaryLines(c: BoxConfig): [string, string][] {
  const t = TYPE_BY_ID[c.type];
  const size = (u: Unit) => `${fmt(c.l, u)} x ${fmt(c.w, u)} x ${fmt(c.h, u)} ${u}`;
  return [
    ["Product", t.label],
    ["Size (L x W x H)", `${size("cm")} (${size("in")})`],
    ["Material", MATERIALS[c.material].label],
    ["Colour", c.color.toUpperCase()],
    ["Print", PRINT_LABEL[c.print]],
    ["Finish", [c.surface === "gloss" ? "Gloss" : "Matte", c.foil && "Foil", c.emboss && "Emboss"].filter(Boolean).join(", ")],
    ["Quantity", String(c.qty)],
    ["Price", "Quote after review"],
  ];
}

export const summaryText = (c: BoxConfig) => summaryLines(c).map(([k, v]) => `${k}: ${v}`).join("\n");

export const ARTWORK_NOTE = "Please attach your artwork on WhatsApp or by email: the logo from the preview is not sent.";

export function configToParams(c: BoxConfig): URLSearchParams {
  const q = new URLSearchParams();
  q.set("cfg", "1");
  q.set("type", c.type);
  q.set("l", String(c.l));
  q.set("w", String(c.w));
  q.set("h", String(c.h));
  q.set("unit", c.unit);
  q.set("mat", c.material);
  q.set("col", c.color.replace("#", ""));
  q.set("print", c.print);
  q.set("fin", fin(c));
  q.set("qty", String(c.qty));
  q.set("product", TYPE_BY_ID[c.type].label);
  q.set("note", `${summaryText(c)}\n${ARTWORK_NOTE}`);
  return q;
}

/** Reads a configuration back out of quote-page params; null when there is none (or it is not ours). Every value is validated. */
export function paramsToConfig(q: URLSearchParams): BoxConfig | null {
  if (q.get("cfg") !== "1") return null;
  const type = q.get("type") as BoxType;
  if (!(type in TYPE_BY_ID)) return null;
  const base = defaultConfig(type);
  const num = (k: string, d: number) => {
    const v = Number(q.get(k));
    return Number.isFinite(v) && q.get(k) !== null && q.get(k) !== "" ? v : d;
  };
  const d = clampDims(type, { l: num("l", base.l), w: num("w", base.w), h: num("h", base.h) });
  const mat = q.get("mat") as MaterialId;
  const material = TYPE_BY_ID[type].materials.includes(mat) ? mat : base.material;
  const col = "#" + (q.get("col") ?? "");
  const print = q.get("print") as PrintArea;
  const f = (q.get("fin") ?? "").split("+");
  const qty = Math.round(num("qty", base.qty));
  return {
    type, ...d,
    unit: q.get("unit") === "in" ? "in" : "cm",
    material,
    color: isHex(col) ? col.toLowerCase() : defaultColor(material),
    print: print in PRINT_LABEL ? print : "outside",
    surface: f.includes("gloss") ? "gloss" : "matte",
    foil: f.includes("foil"),
    emboss: f.includes("emboss"),
    qty: qty >= 1 && qty <= 10_000_000 ? qty : base.qty,
  };
}

/** For the 3D: sizes as a ratio, with the thinnest side never less than a ninth of the longest (so the geometry stays sane). */
export function previewRatio(c: BoxConfig): [number, number, number] {
  const m = Math.max(c.l, c.w, c.h);
  const f = (v: number) => Math.max(v, m / 9);
  return [f(c.l), f(c.w), f(c.h)];
}

/** Ink that reads on a colour. */
export function inkFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.5 ? "#17231d" : "#f1ebde";
}

export const describe = (c: BoxConfig) =>
  `${TYPE_BY_ID[c.type].label}, ${fmt(c.l, c.unit)} by ${fmt(c.w, c.unit)} by ${fmt(c.h, c.unit)} ${c.unit}, ${MATERIALS[c.material].label}, ${PRINT_LABEL[c.print].toLowerCase()} print, ${c.qty} pieces.`;

/** The film skin of a configuration (colours, material look, print, finish, the visitor's logo). */
export function boxSkin(c: BoxConfig, logo?: CanvasImageSource): Skin {
  const t = TYPE_BY_ID[c.type];
  const ink = inkFor(c.color);
  const gold = "#d6b36a";
  const n = parseInt(c.color.slice(1), 16);
  const dark = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.12;
  const corrugated = c.material === "flute-e" || c.material === "flute-b";
  const material: Skin["material"] = c.material === "kraft" || corrugated ? "kraft" : c.material === "film" ? "film" : dark ? "black" : c.material === "rigid" ? "color" : "white";
  const accent = c.foil ? gold : ink;
  return {
    material,
    base: c.color,
    accent,
    second: c.foil ? gold : ink,
    print: c.print === "inside" ? "none" : "wordmark",
    ratio: previewRatio(c),
    lid: t.lid,
    window: false,
    handle: c.type === "gable" || c.type === "bag",
    foil: c.foil,
    props: [],
    logo,
    fastBlank: true,
    finish: { gloss: c.surface === "gloss", emboss: c.emboss },
    innerColor: c.print === "outside" ? undefined : accent,
    flute: c.material === "flute-b" ? 6 : c.material === "flute-e" ? 14 : undefined,
  };
}
