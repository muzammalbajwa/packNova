/**
 * Timeline of the "how your box is made" story. One scroll progress value (0..1) drives
 * everything. Stage ranges are shared by the 3D model, the copy and the step indicator.
 */
export interface StageRange {
  id: "board" | "print" | "finish" | "diecut" | "fold" | "glue" | "ship";
  from: number;
  to: number;
  /** Progress the step indicator scrolls to: the moment the stage is at its clearest. */
  anchor: number;
}

export const STAGES: readonly StageRange[] = [
  { id: "board", from: 0, to: 0.12, anchor: 0.09 },
  { id: "print", from: 0.12, to: 0.28, anchor: 0.26 },
  { id: "finish", from: 0.28, to: 0.4, anchor: 0.385 },
  { id: "diecut", from: 0.4, to: 0.55, anchor: 0.535 },
  { id: "fold", from: 0.55, to: 0.8, anchor: 0.79 },
  { id: "glue", from: 0.8, to: 0.92, anchor: 0.915 },
  { id: "ship", from: 0.92, to: 1, anchor: 0.985 },
];

/** Index of the stage that contains progress `p`. */
export function stageIndex(p: number): number {
  for (let i = STAGES.length - 1; i > 0; i--) if (p >= STAGES[i].from) return i;
  return 0;
}

/** Progress at which the full "ready" call to action is shown. */
export const CTA_AT = 0.94;
/** Progress from which the subtle "get a quote" button appears (start of the fold stage). */
export const QUOTE_BUTTON_AT = 0.55;

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

/** Page-level scroll length of the pinned section. */
export const SCROLL_VH = { desktop: 700, mobile: 450 } as const;
