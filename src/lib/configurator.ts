import { site } from "@/content/site";
import { ALL_PANELS, hasArt, type ArtMap, type Panel } from "./artwork";

export type ModelId = "carton" | "folding" | "rigid" | "pouch" | "courier" | "paperbag";
export type MaterialId = "kraft" | "white" | "black";

export interface Spec {
  model: ModelId;
  l: number; // length cm
  w: number; // width cm
  h: number; // height cm
  material: MaterialId;
  quantity: number;
}

type Range = readonly [number, number];
/** Sensible min/max per model, in cm. */
export const LIMITS: Record<ModelId, { l: Range; w: Range; h: Range }> = {
  carton: { l: [10, 120], w: [10, 100], h: [5, 100] },
  folding: { l: [3, 40], w: [2, 30], h: [4, 50] },
  rigid: { l: [8, 60], w: [6, 50], h: [3, 30] },
  pouch: { l: [6, 40], w: [3, 20], h: [8, 45] },
  courier: { l: [10, 70], w: [1, 8], h: [10, 80] },
  paperbag: { l: [10, 60], w: [5, 40], h: [10, 70] },
};
export const QUANTITY_LIMITS: Range = [1, 1_000_000];

export const clampDim = (model: ModelId, key: "l" | "w" | "h", v: number) =>
  Math.min(LIMITS[model][key][1], Math.max(LIMITS[model][key][0], v));

/** Which printable panels each model has. */
export const PANELS: Record<ModelId, Panel[]> = {
  carton: ["front", "back", "left", "right", "top"],
  folding: ["front", "back", "left", "right", "top"],
  rigid: ["front", "back", "left", "right", "top"],
  pouch: ["front", "back"],
  courier: ["front", "back"],
  paperbag: ["front", "back", "left", "right"],
};

/** Models whose preview can open and close. */
export const OPENABLE: Record<ModelId, boolean> = {
  carton: true,
  folding: true,
  rigid: true,
  pouch: false,
  courier: false,
  paperbag: false,
};

export const DEFAULT_DIMS: Record<ModelId, [number, number, number]> = {
  carton: [40, 30, 25],
  folding: [12, 6, 18],
  rigid: [22, 16, 8],
  pouch: [14, 7, 22],
  courier: [30, 3, 38],
  paperbag: [24, 12, 30],
};

export const MODELS = site.products.items.map((p) => ({ id: p.model as ModelId, label: p.name }));

export function defaultSpec(model: ModelId = "carton"): Spec {
  const [l, w, h] = DEFAULT_DIMS[model];
  return { model, l, w, h, material: "kraft", quantity: 500 };
}

const num = (v: string | null, fallback: number, range: Range) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= range[0] && n <= range[1] ? n : fallback;
};

export function specFromSearch(search: string): Spec {
  const q = new URLSearchParams(search);
  const model = MODELS.find((m) => m.id === q.get("type"))?.id ?? "carton";
  const d = defaultSpec(model);
  const material = (["kraft", "white", "black"] as const).find((m) => m === q.get("m")) ?? "kraft";
  const lim = LIMITS[model];
  return {
    model,
    l: num(q.get("l"), d.l, lim.l),
    w: num(q.get("w"), d.w, lim.w),
    h: num(q.get("h"), d.h, lim.h),
    material,
    quantity: num(q.get("q"), d.quantity, QUANTITY_LIMITS),
  };
}

export function specToQuery(s: Spec) {
  return new URLSearchParams({ type: s.model, l: String(s.l), w: String(s.w), h: String(s.h), m: s.material, q: String(s.quantity) }).toString();
}

const PANEL_LABEL: Record<Panel, string> = { front: "Front", back: "Back", left: "Left", right: "Right", top: "Top" };
export const panelLabel = (p: Panel) => PANEL_LABEL[p];

/** Human-readable spec lines, shared by the summary card and the WhatsApp / email message. */
export function specLines(spec: Spec, art: ArtMap): string[] {
  const type = site.products.items.find((i) => i.model === spec.model)?.name ?? spec.model;
  const material = site.configurator.materials.find((m) => m.id === spec.material)?.label ?? spec.material;
  const lines = [
    `Type: ${type}`,
    `Size: ${spec.l} x ${spec.w} x ${spec.h} cm (L x W x H)`,
    `Material: ${material}`,
    `Quantity: ${spec.quantity.toLocaleString("en-US")}`,
  ];
  const printed = ALL_PANELS.filter((p) => PANELS[spec.model].includes(p) && hasArt(art[p]));
  if (printed.length === 0) {
    lines.push("Artwork: none yet");
  } else {
    for (const p of printed) {
      const a = art[p];
      const bits = [
        a.bitmap && `image "${a.fileName}" (I will attach this file in the chat)`,
        a.text.trim() && `text "${a.text.trim().replace(/\n/g, " / ")}"`,
        a.bg && `background ${a.bg}`,
      ].filter(Boolean);
      lines.push(`Artwork, ${PANEL_LABEL[p].toLowerCase()}: ${bits.join(", ")}`);
    }
  }
  return lines;
}
