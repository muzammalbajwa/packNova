/**
 * Timeline of the "how your box is made" story. One scroll progress value P (0..1) drives everything.
 *
 * The film has two parts. Part one, "Made" (7 stages: board to ship), is the original scene. It keeps its
 * own 0..1 timeline (`LEGACY`, `FOLD`, ...) which is a pure rescale of the first `SPLIT` of the total: the
 * carton code reads `toLegacy(P)` and therefore looks and times exactly as before. Part two, "Shipped"
 * (5 stages: count, pack, load, fly, deliver), runs from `SPLIT` to 1 in the journey scene.
 * Stage ranges are shared by the 3D scenes, the copy and the step indicator.
 */
export type StageId = "board" | "print" | "finish" | "diecut" | "fold" | "glue" | "ship" | "count" | "pack" | "load" | "fly" | "deliver";

export interface StageRange {
  id: StageId;
  from: number;
  to: number;
  /** Progress the step indicator scrolls to: the moment the stage is at its clearest. */
  anchor: number;
}

/** Share of the total scroll that the original 7-stage scene keeps (700 of 1200vh on desktop). */
export const SPLIT = 0.58;

/** Total progress -> the original scene's 0..1 progress (clamped: after SPLIT the finished carton rests). */
export const toLegacy = (P: number) => Math.min(1, P / SPLIT);

/** The original 7 stages in the original scene's own 0..1 units (do not change: the carton is tuned to them). */
const LEGACY_STAGES: readonly (Omit<StageRange, "id"> & { id: StageId })[] = [
  { id: "board", from: 0, to: 0.12, anchor: 0.09 },
  { id: "print", from: 0.12, to: 0.28, anchor: 0.26 },
  { id: "finish", from: 0.28, to: 0.4, anchor: 0.385 },
  { id: "diecut", from: 0.4, to: 0.55, anchor: 0.535 },
  { id: "fold", from: 0.55, to: 0.8, anchor: 0.79 },
  { id: "glue", from: 0.8, to: 0.92, anchor: 0.915 },
  { id: "ship", from: 0.92, to: 1, anchor: 0.985 },
];

/** All 12 stages in total-progress units. */
export const STAGES: readonly StageRange[] = [
  ...LEGACY_STAGES.map((s) => ({ id: s.id, from: s.from * SPLIT, to: s.to * SPLIT, anchor: s.anchor * SPLIT })),
  { id: "count", from: SPLIT, to: 0.665, anchor: 0.655 },
  { id: "pack", from: 0.665, to: 0.77, anchor: 0.755 },
  { id: "load", from: 0.77, to: 0.835, anchor: 0.825 },
  { id: "fly", from: 0.835, to: 0.93, anchor: 0.915 },
  { id: "deliver", from: 0.93, to: 1, anchor: 0.99 },
];

/** The step indicator groups the 12 stages into two chapters. */
export const CHAPTERS = [
  { id: "made", from: 0, to: 6 },
  { id: "shipped", from: 7, to: 11 },
] as const;

/** Index of the chapter that contains stage `i`. */
export const chapterOf = (i: number) => (i <= CHAPTERS[0].to ? 0 : 1);

/** Index of the stage that contains progress `p`. */
export function stageIndex(p: number): number {
  for (let i = STAGES.length - 1; i > 0; i--) if (p >= STAGES[i].from) return i;
  return 0;
}

/** Progress at which the full "ready" call to action is shown (inside the last stage, "deliver"). */
export const CTA_AT = 0.985;
/** Progress from which the subtle "get a quote" button appears (start of the fold stage). */
export const QUOTE_BUTTON_AT = 0.55 * SPLIT;

/** Smoothstep of v over [a, b], clamped. */
export const seg = (v: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Linear 0..1 over [a, b], clamped. */
export const lin = (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/** Fold windows (progress ranges) for each hinge, in assembly order. */
export const FOLD = {
  tilt: [0.55, 0.62],
  left: [0.6, 0.65],
  back: [0.65, 0.7],
  right: [0.7, 0.745],
  botDust: [0.745, 0.77],
  botMain: [0.77, 0.8],
  glue: [0.82, 0.86],
  topDust: [0.86, 0.885],
  lid: [0.885, 0.915],
  tab: [0.9, 0.92],
} as const;

/** Size of the carton in the story, in cm (12 x 6 x 18 = the configurator's default folding carton). Three-free so UI code can import it. */
export const BOX_CM = { l: 12, w: 6, h: 18 } as const;

/**
 * Page-level scroll length of the pinned section. `SPLIT` of it is the original story (about 700vh desktop,
 * 450vh mobile, as before); the rest is the shipping journey (about 500vh desktop, 330vh mobile).
 */
export const SCROLL_VH = { desktop: 1200, mobile: 780 } as const;
