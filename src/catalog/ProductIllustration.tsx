import type { ReactNode } from "react";
import type { CatalogPage } from "@/content/catalog";

/**
 * Line-art product drawings for the "related products" cards, one per product style, in the same isometric line style as the homepage
 * category icons. Pure SVG, no script. The page's own skin colours tint them (--ic-base, --ic-accent are set by the card).
 * Parts that move on hover carry a class (ic-lid, ic-handle, ic-puff, ic-swing, ic-sleeve, ic-peel); pageEnd.css animates them.
 */
export type IllustrationKind = "rigid" | "mailer" | "tuck" | "window" | "gable" | "pillow" | "bag" | "pouch" | "tag" | "sticker" | "tray";

/** Which drawing a page gets: a few styles have their own, the rest follow their process recipe. */
export function illustrationFor(page: Pick<CatalogPage, "slug" | "recipe" | "skin">): IllustrationKind {
  const s = page.slug;
  if (s === "pillow-boxes") return "pillow";
  if (s === "gable-boxes" || s === "halloween") return "gable";
  if (s === "window-boxes" || s === "bakery-and-cake" || s === "food-boxes") return "window";
  if (s === "labels-and-stickers") return "sticker";
  if (s === "hang-tags") return "tag";
  switch (page.recipe) {
    case "rigid-box": return "rigid";
    case "corrugated-box": return "mailer";
    case "folding-carton": return "tuck";
    case "paper-bag": return "bag";
    case "pouch": return "pouch";
    case "label-tag": return page.skin.card === "sticker" ? "sticker" : "tag";
    case "tray-sleeve": return "tray";
  }
}

type P = [number, number];
const f = (n: number) => +n.toFixed(1);
const pts = (a: P[]) => a.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const lift = (p: P, dy: number): P => [p[0], p[1] - dy];

/** Isometric box. (x, y) is the bottom front corner, `a` the length going left, `b` the length going right, `h` the height. */
function box(x: number, y: number, a: number, b: number, h: number) {
  const B: P = [x, y], L: P = [x - a, y - a / 2], R: P = [x + b, y - b / 2], K: P = [x - a + b, y - a / 2 - b / 2];
  const Bt = lift(B, h), Lt = lift(L, h), Rt = lift(R, h), Kt = lift(K, h);
  return { B, L, R, K, Bt, Lt, Rt, Kt, left: [L, B, Bt, Lt] as P[], right: [B, R, Rt, Bt] as P[], top: [Lt, Bt, Rt, Kt] as P[] };
}
const Poly = ({ c, p }: { c: string; p: P[] }) => <polygon className={`ic-s ${c}`} points={pts(p)} />;
/** A point on a face at (u, v) in 0..1 (u along the face, v up it). */
const onFace = (face: P[], u: number, v: number): P => {
  const [bl, br, tr, tl] = face;
  const bx = bl[0] + (br[0] - bl[0]) * u, by = bl[1] + (br[1] - bl[1]) * u;
  const tx = tl[0] + (tr[0] - tl[0]) * u, ty = tl[1] + (tr[1] - tl[1]) * u;
  return [bx + (tx - bx) * v, by + (ty - by) * v];
};
const strip = (face: P[], v0: number, v1: number): P[] => [onFace(face, 0, v0), onFace(face, 1, v0), onFace(face, 1, v1), onFace(face, 0, v1)];

function Drawing({ kind }: { kind: IllustrationKind }): ReactNode {
  switch (kind) {
    case "rigid": {
      const base = box(80, 104, 30, 30, 22);
      const lid = box(80, 84, 32, 32, 13);
      return (
        <>
          <Poly c="ic-l" p={base.left} />
          <Poly c="ic-r" p={base.right} />
          <g className="ic-lid">
            <Poly c="ic-l" p={lid.left} />
            <Poly c="ic-r" p={lid.right} />
            <Poly c="ic-t" p={lid.top} />
            <polygon className="ic-s ic-ac" points={pts(strip(lid.left, 0.38, 0.62))} />
            <polygon className="ic-s ic-ac" points={pts(strip(lid.right, 0.38, 0.62))} />
          </g>
        </>
      );
    }
    case "mailer": {
      const b = box(80, 100, 36, 26, 24);
      const mL = mid(b.Lt, b.Kt), mR = mid(b.Bt, b.Rt);
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <polygon className="ic-s ic-t ic-flapA" points={pts([b.Lt, b.Bt, mR, mL])} />
          <polygon className="ic-s ic-t ic-flapB" points={pts([mL, mR, b.Rt, b.Kt])} />
          <path className="ic-s ic-tape" d={`M${f(mid(b.Lt, mL)[0])} ${f(mid(b.Lt, mL)[1])} L${f(mid(b.Bt, mR)[0])} ${f(mid(b.Bt, mR)[1])}`} />
        </>
      );
    }
    case "tuck":
    case "window": {
      const b = box(80, 106, 28, 24, 44);
      const tab: P[] = [b.Bt, b.Rt, lift(b.Rt, 6), lift(b.Bt, 6)];
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          {kind === "window" ? (
            <>
              <Poly c="ic-in" p={strip(b.left, 0.3, 0.72).map((p, i) => [p[0] + (i === 0 || i === 3 ? 4 : -4), p[1]] as P)} />
              <path className="ic-s" d={`M${f(b.B[0] - 14)} ${f(b.B[1] - 30)} l8 -6 M${f(b.B[0] - 10)} ${f(b.B[1] - 22)} l8 -6`} />
            </>
          ) : (
            <polygon className="ic-s ic-ac" points={pts(strip(b.right, 0.16, 0.3))} />
          )}
          <g className="ic-lid">
            <Poly c="ic-t" p={b.top} />
            <Poly c="ic-r" p={tab} />
            <path className="ic-s" d={`M${f(b.Bt[0])} ${f(b.Bt[1])} L${f(b.Bt[0])} ${f(b.Bt[1] - 6)}`} />
          </g>
        </>
      );
    }
    case "gable": {
      const b = box(80, 106, 22, 22, 32);
      const pa = lift(mid(b.Lt, b.Bt), 15), pb = lift(mid(b.Rt, b.Kt), 15);
      return (
        <>
          <path className="ic-s ic-handle" d={`M${f(pa[0] + 4)} ${f(pa[1] + 2)} C ${f(pa[0] + 4)} ${f(pa[1] - 24)}, ${f(pb[0] + 4)} ${f(pb[1] - 30)}, ${f(pb[0] + 4)} ${f(pb[1] + 2)}`} />
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <Poly c="ic-t" p={[b.Lt, b.Kt, pb, pa]} />
          <Poly c="ic-l" p={[b.Lt, b.Bt, pa]} />
          <Poly c="ic-t" p={[b.Bt, b.Rt, pb, pa]} />
          <polygon className="ic-s ic-ac" points={pts(strip(b.right, 0.3, 0.46))} />
        </>
      );
    }
    case "pillow":
      return (
        <g className="ic-puff">
          <path className="ic-s ic-l" d="M30 54 Q80 38 130 54 L130 80 Q80 96 30 80 Z" />
          <path className="ic-s ic-t" d="M30 54 Q80 38 130 54 Q80 62 30 54 Z" />
          <path className="ic-s" d="M30 54 L30 80 M34 56 L34 79 M126 56 L126 79 M130 54 L130 80" />
          <path className="ic-s ic-ac" d="M30 67 Q80 80 130 67 L130 72 Q80 85 30 72 Z" />
        </g>
      );
    case "bag": {
      const b = box(84, 106, 34, 14, 54);
      const hy = b.Bt[1] - 2;
      return (
        <>
          <g className="ic-handle">
            <path className="ic-s" d={`M${f(b.Bt[0] - 20)} ${f(hy - 4)} C ${f(b.Bt[0] - 20)} ${f(hy - 30)}, ${f(b.Bt[0] + 6)} ${f(hy - 30)}, ${f(b.Bt[0] + 6)} ${f(hy - 12)}`} />
            <path className="ic-s" d={`M${f(b.Bt[0] - 8)} ${f(hy - 10)} C ${f(b.Bt[0] - 8)} ${f(hy - 34)}, ${f(b.Bt[0] + 14)} ${f(hy - 34)}, ${f(b.Bt[0] + 14)} ${f(hy - 16)}`} />
          </g>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <Poly c="ic-t" p={b.top} />
          <polygon className="ic-s ic-ac" points={pts(strip(b.left, 0.4, 0.58).map((p, i) => [p[0] + (i === 1 || i === 2 ? -5 : 5), p[1]] as P))} />
          <path className="ic-s" d={`M${f(b.Bt[0])} ${f(b.Bt[1])} L${f(b.B[0])} ${f(b.B[1])}`} />
        </>
      );
    }
    case "pouch":
      return (
        <g className="ic-puff">
          <path className="ic-s ic-l" d="M52 30 L108 30 C112 54 116 78 114 98 Q80 112 46 98 C44 78 48 54 52 30 Z" />
          <path className="ic-s ic-t" d="M52 30 L108 30 L109 38 L51 38 Z" />
          <path className="ic-s" d="M51 44 L109 44 M46 98 Q80 90 114 98" />
          <ellipse className="ic-s ic-in" cx="80" cy="68" rx="15" ry="13" />
          <path className="ic-s ic-ac" d="M64 82 Q80 88 96 82" />
          <path className="ic-s" d="M56 30 l3 -3 M104 30 l-3 -3" />
        </g>
      );
    case "tag":
      return (
        <g className="ic-swing">
          <path className="ic-s" d="M80 12 C 70 12 70 28 80 28 C 90 28 90 12 80 12 Z" />
          <path className="ic-s ic-l" d="M64 36 L96 36 L104 46 L104 104 L56 104 L56 46 Z" />
          <circle className="ic-s ic-in" cx="80" cy="46" r="4.5" />
          <path className="ic-s" d="M80 28 L80 41.5" />
          <polygon className="ic-s ic-ac" points="56,70 104,70 104,82 56,82" />
          <path className="ic-s" d="M66 92 H94" />
        </g>
      );
    case "sticker":
      return (
        <>
          <rect className="ic-s ic-in" x="34" y="26" width="92" height="74" rx="4" />
          <path className="ic-s ic-l" d="M46 36 H104 L116 48 V88 H46 Z" />
          <polygon className="ic-s ic-ac" points="56,58 106,58 106,70 56,70" />
          <path className="ic-s" d="M58 80 H92" />
          <polygon className="ic-s ic-t ic-peel" points="104,36 116,48 104,48" />
        </>
      );
    case "tray": {
      const t = box(78, 104, 34, 24, 14);
      const s = box(84, 98, 35, 9, 22);
      const inner: P[] = [lift(t.Lt, -0), t.Bt, t.Rt, t.Kt];
      return (
        <>
          <Poly c="ic-l" p={t.left} />
          <Poly c="ic-r" p={t.right} />
          <Poly c="ic-in" p={inner} />
          <g className="ic-sleeve">
            <Poly c="ic-l" p={s.left} />
            <Poly c="ic-r" p={s.right} />
            <Poly c="ic-t" p={s.top} />
            <polygon className="ic-s ic-ac" points={pts(strip(s.left, 0.4, 0.62))} />
          </g>
        </>
      );
    }
  }
}

/** The drawing for one page, tinted by its skin. Decorative: the card's link text names the product. */
export default function ProductIllustration({ page }: { page: Pick<CatalogPage, "slug" | "recipe" | "skin"> }) {
  const kind = illustrationFor(page);
  return (
    <svg viewBox="22 6 116 110" className="ic size-full" aria-hidden="true" focusable="false" data-kind={kind}>
      <ellipse className="ic-ground" cx="80" cy="108" rx="48" ry="6" />
      <Drawing kind={kind} />
    </svg>
  );
}
