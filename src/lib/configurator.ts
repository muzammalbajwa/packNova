import { site } from "@/content/site";

export type ModelId = "carton" | "folding" | "rigid" | "pouch" | "courier" | "paperbag";
export type MaterialId = "kraft" | "white" | "black";

export interface Spec {
  model: ModelId;
  l: number; // length cm
  w: number; // width cm
  h: number; // height cm
  material: MaterialId;
}

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
  return { model, l, w, h, material: "kraft" };
}

const num = (v: string | null, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 200 ? n : fallback;
};

export function specFromSearch(search: string): Spec {
  const q = new URLSearchParams(search);
  const model = MODELS.find((m) => m.id === q.get("type"))?.id ?? "carton";
  const d = defaultSpec(model);
  const material = (["kraft", "white", "black"] as const).find((m) => m === q.get("m")) ?? "kraft";
  return { model, l: num(q.get("l"), d.l), w: num(q.get("w"), d.w), h: num(q.get("h"), d.h), material };
}

export function specToQuery(s: Spec) {
  return new URLSearchParams({ type: s.model, l: String(s.l), w: String(s.w), h: String(s.h), m: s.material }).toString();
}
