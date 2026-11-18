/**
 * The film's shared easing and timing helpers. Every function is pure (a number in, a number out) and allocates nothing, so a recipe can call
 * it from `update(p)` every frame and a frame is still a pure function of scroll progress.
 *
 * Which curve for which action:
 *   cut     -> `snap`     quick and decisive: most of the move in the first third, then rest
 *   fold    -> `settle`   smooth, with a slight overshoot at the end and a settle back to the rest pose
 *   slide   -> `glide`    decelerating (fast start, soft landing)
 *   press   -> `squash`   a short dip and recovery, for a stamp or a roller
 *   enter   -> `rise`     starts slowly (anticipation) then accelerates in, so pieces do not pop into the frame
 */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 0..1 over [a, b] with an ease-in-out cubic. */
export const inOut = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/** Cut: quick and decisive. */
export const snap = (v: number, a: number, b: number) => 1 - Math.pow(1 - clamp01((v - a) / (b - a)), 3.2);

/** Slide: decelerating, soft landing. */
export const glide = (v: number, a: number, b: number) => 1 - Math.pow(1 - clamp01((v - a) / (b - a)), 2.2);

/** Entrance: a slow start that accelerates (anticipation), ending at full speed so a hand-off into the next move feels continuous. */
export const rise = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (1.6 - 0.6 * t);
};

/**
 * Fold: takes an already smooth 0..1 fold amount `f` and adds a small overshoot over its last 40% that settles back to exactly 1.
 * `amp` is the overshoot as a fraction of the full angle (0.035 of 90 degrees is about 3 degrees).
 */
export const settle = (f: number, amp = 0.035) => {
  const u = (f - 0.6) / 0.4;
  return u > 0 && u < 1 ? f + amp * Math.sin(Math.PI * u) : f;
};

/** Press: a dip of depth `d` in the middle of [a, b] that recovers to 0 (a stamp, a roller, a tape being pressed down). */
export const squash = (v: number, a: number, b: number, d = 1) => {
  const t = clamp01((v - a) / (b - a));
  return d * Math.sin(Math.PI * t) * (1 - 0.35 * t);
};

/** Slow camera drift: a smooth value in [-1, 1] that changes direction a couple of times over the film (never constant, never fast). */
export const drift = (p: number, phase = 0) => Math.sin(p * 4.2 + phase) * 0.7 + Math.sin(p * 9.1 + phase * 2.3) * 0.3;
