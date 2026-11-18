import type { ReactNode } from "react";
import type { CatalogPage, IllustrationKind, PropKind } from "@/content/catalog";

/**
 * Line-art product drawings for the "related products" cards, one per product style, in the same isometric line style as the homepage
 * category icons. Pure SVG, no script. The page's own skin colours tint them (--ic-base, --ic-accent are set by the card).
 * Parts that move on hover carry a class (ic-lid, ic-handle, ic-puff, ic-swing, ic-sleeve, ic-peel); pageEnd.css animates them.
 */
export type { IllustrationKind };

/** Which drawing a page gets: the `art` key in catalog.ts (edit it there). */
export function illustrationFor(page: Pick<CatalogPage, "art">): IllustrationKind {
  return page.art;
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
    case "shipper": {
      const b = box(80, 106, 30, 30, 50);
      const mid1 = onFace(b.left, 0, 0.5), mid2 = onFace(b.left, 1, 0.5);
      const flute = (face: P[], v: number) => { const a0 = onFace(face, 0.08, v), a1 = onFace(face, 0.92, v); return `M${f(a0[0])} ${f(a0[1])} L${f(a1[0])} ${f(a1[1])}`; };
      void mid1; void mid2;
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <path className="ic-s" d={`${flute(b.left, 0.22)} ${flute(b.left, 0.34)} ${flute(b.left, 0.46)} ${flute(b.right, 0.22)} ${flute(b.right, 0.34)} ${flute(b.right, 0.46)}`} opacity={0.5} />
          <g className="ic-lid">
            <Poly c="ic-t" p={b.top} />
            <path className="ic-s ic-tape" d={`M${f(mid(b.Lt, b.Kt)[0])} ${f(mid(b.Lt, b.Kt)[1])} L${f(mid(b.Bt, b.Rt)[0])} ${f(mid(b.Bt, b.Rt)[1])}`} />
          </g>
        </>
      );
    }
    case "folding": {
      const b = box(80, 106, 26, 22, 44);
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <path className="ic-s" strokeDasharray="3 3" d={`M${f(onFace(b.left, 0.5, 0)[0])} ${f(onFace(b.left, 0.5, 0)[1])} L${f(onFace(b.left, 0.5, 1)[0])} ${f(onFace(b.left, 0.5, 1)[1])} M${f(onFace(b.right, 0.5, 0)[0])} ${f(onFace(b.right, 0.5, 0)[1])} L${f(onFace(b.right, 0.5, 1)[0])} ${f(onFace(b.right, 0.5, 1)[1])}`} />
          <g className="ic-lid">
            <Poly c="ic-t" p={b.top} />
            <polygon className="ic-s ic-ac" points={pts(strip(b.left, 0.74, 0.86))} />
          </g>
        </>
      );
    }
    case "takeaway":
      return (
        <>
          <path className="ic-s ic-handle" d="M44 46 C 46 6, 114 6, 116 46" />
          <polygon className="ic-s ic-l" points="36,48 80,64 78,106 46,90" />
          <polygon className="ic-s ic-r" points="80,64 124,48 112,90 78,106" />
          <g className="ic-lid">
            <polygon className="ic-s ic-t" points="36,48 80,32 124,48 80,64" />
          </g>
          <polygon className="ic-s ic-ac" points="40,62 79,77 78,86 43,72" />
        </>
      );
    case "insert": {
      const base = box(80, 104, 32, 32, 22);
      const lid = box(80, 62, 34, 34, 9);
      const cx = (u: number, v: number) => onFace([base.Lt, base.Bt, base.Rt, base.Kt], u, v);
      const dots: P[] = [cx(0.3, 0.35), cx(0.7, 0.35), cx(0.3, 0.7), cx(0.7, 0.7)];
      void dots;
      const c = (a: number, b2: number): P => { const l = base.Lt, bb = base.Bt, r = base.Rt, k = base.Kt; void k; return [l[0] + (bb[0] - l[0]) * a + (r[0] - bb[0]) * b2, l[1] + (bb[1] - l[1]) * a + (r[1] - bb[1]) * b2]; };
      return (
        <>
          <Poly c="ic-l" p={base.left} />
          <Poly c="ic-r" p={base.right} />
          <Poly c="ic-in" p={base.top} />
          {([[0.3, 0.3], [0.3, 0.72], [0.72, 0.3], [0.72, 0.72]] as [number, number][]).map(([a, b2], i) => { const q = c(a, b2); return <ellipse key={i} className="ic-s ic-ac" cx={q[0]} cy={q[1]} rx="6.5" ry="3.4" />; })}
          <g className="ic-lid">
            <Poly c="ic-l" p={lid.left} />
            <Poly c="ic-r" p={lid.right} />
            <Poly c="ic-t" p={lid.top} />
          </g>
        </>
      );
    }
    case "jewelry": {
      const base = box(80, 106, 24, 24, 20);
      const lid = box(80, 70, 25, 25, 8);
      return (
        <>
          <Poly c="ic-l" p={base.left} />
          <Poly c="ic-r" p={base.right} />
          <Poly c="ic-in" p={base.top} />
          <ellipse className="ic-s" cx="80" cy="86" rx="9" ry="4.5" stroke="var(--ic-accent)" strokeWidth="2.2" />
          <polygon className="ic-s ic-t" points="80,73 85,79 80,84 75,79" />
          <g className="ic-lid">
            <Poly c="ic-l" p={lid.left} />
            <Poly c="ic-r" p={lid.right} />
            <Poly c="ic-t" p={lid.top} />
            <polygon className="ic-s ic-ac" points={pts(strip(lid.left, 0.3, 0.7))} />
          </g>
        </>
      );
    }
    case "display": {
      const t = box(80, 106, 36, 26, 14);
      const m1 = box(64, 84, 9, 9, 22), m2 = box(88, 80, 9, 9, 28), m3 = box(106, 90, 8, 8, 20);
      return (
        <>
          <Poly c="ic-l" p={t.left} />
          <Poly c="ic-r" p={t.right} />
          <Poly c="ic-in" p={t.top} />
          {[m1, m2, m3].map((m, i) => (
            <g key={i} className="ic-lid">
              <Poly c="ic-l" p={m.left} />
              <Poly c="ic-r" p={m.right} />
              <Poly c="ic-t" p={m.top} />
            </g>
          ))}
        </>
      );
    }
    case "pizza": {
      const b = box(80, 102, 40, 40, 11);
      const cx = (b.Lt[0] + b.Rt[0]) / 2, cy = (b.Lt[1] + b.Rt[1]) / 2;
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <g className="ic-lid">
            <Poly c="ic-t" p={b.top} />
            <ellipse className="ic-s ic-ac" cx={cx} cy={cy + 3} rx="25" ry="12.5" />
            <path className="ic-s" d={`M${f(cx - 25)} ${f(cy + 3)} L${f(cx + 25)} ${f(cy + 3)} M${f(cx)} ${f(cy - 9.5)} L${f(cx)} ${f(cy + 15.5)}`} opacity={0.5} />
          </g>
        </>
      );
    }
    case "candle": {
      const b = box(80, 106, 20, 20, 54);
      const q = onFace(b.left, 0.5, 0.45);
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <g className="ic-lid"><Poly c="ic-t" p={b.top} /></g>
          <g transform={`translate(${f(q[0])} ${f(q[1])}) skewY(26.5)`}>
            <rect className="ic-s ic-t" x="-5" y="-2" width="10" height="20" />
            <path className="ic-s ic-ac" d="M0 -3 c-4 -5 0 -8 0 -12 c4 4 4 8 0 12 z" />
          </g>
        </>
      );
    }
    case "bottle": {
      const b = box(80, 106, 18, 18, 56);
      const q = onFace(b.left, 0.5, 0.5);
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <g className="ic-lid"><Poly c="ic-t" p={b.top} /></g>
          <g transform={`translate(${f(q[0])} ${f(q[1])}) skewY(26.5)`}>
            <rect className="ic-s ic-t" x="-6.5" y="-6" width="13" height="22" rx="2" transform="translate(0 4)" />
            <rect className="ic-s ic-ac" x="-3" y="-16" width="6" height="9" rx="1" transform="translate(0 4)" />
          </g>
        </>
      );
    }
    case "medicine": {
      const b = box(80, 106, 26, 22, 42);
      const q = onFace(b.left, 0.5, 0.5);
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <g className="ic-lid"><Poly c="ic-t" p={b.top} /></g>
          <g transform={`translate(${f(q[0])} ${f(q[1])}) skewY(26.5)`}>
            <path className="ic-s ic-ac" d="M-3 -10 H3 V-3 H10 V3 H3 V10 H-3 V3 H-10 V-3 H-3 Z" />
          </g>
        </>
      );
    }
    case "device": {
      const base = box(80, 106, 36, 26, 16);
      const lid = box(80, 76, 37, 27, 10);
      return (
        <>
          <Poly c="ic-l" p={base.left} />
          <Poly c="ic-r" p={base.right} />
          <Poly c="ic-in" p={base.top} />
          <polygon className="ic-s ic-t" points={pts([lift(mid(base.Lt, base.Bt), 0), mid(base.Bt, base.Rt), mid(base.Rt, base.Kt), mid(base.Kt, base.Lt)].map((p, i) => [p[0], p[1] + (i % 2 === 0 ? 1 : 0)] as P))} />
          <g className="ic-lid">
            <Poly c="ic-l" p={lid.left} />
            <Poly c="ic-r" p={lid.right} />
            <Poly c="ic-t" p={lid.top} />
          </g>
        </>
      );
    }
    case "retail": {
      const b = box(80, 108, 28, 18, 42);
      return (
        <>
          <Poly c="ic-l" p={b.left} />
          <Poly c="ic-r" p={b.right} />
          <Poly c="ic-t" p={b.top} />
          <g className="ic-lid">
            <polygon className="ic-s ic-t" points={`${f(b.Bt[0] - 8)},${f(b.Bt[1] - 1)} ${f(b.Bt[0] + 8)},${f(b.Bt[1] - 1)} ${f(b.Bt[0] + 8)},${f(b.Bt[1] - 13)} ${f(b.Bt[0] - 8)},${f(b.Bt[1] - 13)}`} />
            <circle className="ic-s ic-in" cx={b.Bt[0]} cy={b.Bt[1] - 8} r="2.8" />
          </g>
          <polygon className="ic-s ic-ac" points={pts(strip(b.left, 0.3, 0.46))} />
        </>
      );
    }
    case "courier":
      return (
        <g className="ic-puff">
          <path className="ic-s ic-l" d="M30 44 L130 38 L124 100 L36 104 Z" />
          <path className="ic-s ic-ac" d="M30 44 L130 38 L129.4 48 L30.6 53 Z" />
          <rect className="ic-s ic-t" x="78" y="62" width="34" height="24" rx="2" transform="rotate(-2.5 95 74)" />
          <path className="ic-s" d="M84 70 H106 M84 76 H100" transform="rotate(-2.5 95 74)" />
        </g>
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


/** A small seasonal motif (from the page's own skin.props) drawn in the top-right corner of the drawing. */
function Motif({ kind }: { kind: PropKind }) {
  const t = "translate(118 34)";
  switch (kind) {
    case "pumpkin": return <g transform={t}><ellipse className="ic-s ic-ac" cx="0" cy="2" rx="10" ry="8.5" /><path className="ic-s" d="M-3 -5 Q-4 2 -3 9 M3 -5 Q4 2 3 9 M0 -6.5 V-11" /></g>;
    case "bat": return <g transform={t}><path className="ic-s ic-ac" d="M-13 -3 Q-7 -8 -3 -2 Q0 -5 3 -2 Q7 -8 13 -3 Q9 4 5 2 Q2 8 0 6 Q-2 8 -5 2 Q-9 4 -13 -3 Z" /></g>;
    case "ribbon":
    case "bow": return <g transform={t}><ellipse className="ic-s ic-ac" cx="-7" cy="-2" rx="7" ry="4.5" transform="rotate(-25 -7 -2)" /><ellipse className="ic-s ic-ac" cx="7" cy="-2" rx="7" ry="4.5" transform="rotate(25 7 -2)" /><path className="ic-s ic-ac" d="M-1 3 L-5 12 L-1 10 L0 13 L1 10 L5 12 L1 3 Z" /><circle className="ic-s ic-t" cx="0" cy="0" r="2.6" /></g>;
    case "snowflake": return <g transform={t}><path className="ic-s" d="M0 -11 V11 M-9.5 -5.5 L9.5 5.5 M-9.5 5.5 L9.5 -5.5 M-3 -9 L0 -6 L3 -9 M-3 9 L0 6 L3 9" /></g>;
    case "star": return <g transform={t}><polygon className="ic-s ic-ac" points="0,-11 3.2,-3.6 11,-3.4 5,1.8 7,9.6 0,5.3 -7,9.6 -5,1.8 -11,-3.4 -3.2,-3.6" /></g>;
    case "leaf": return <g transform={t}><path className="ic-s ic-ac" d="M-9 8 Q-10 -7 8 -10 Q10 7 -9 8 Z M-9 8 L5 -4" /></g>;
    case "confetti": return <g transform={t}><rect className="ic-s ic-ac" x="-12" y="-6" width="5" height="3" transform="rotate(25 -9 -4)" /><circle className="ic-s ic-ac" cx="2" cy="-9" r="2.2" /><rect className="ic-s ic-t" x="6" y="-1" width="5" height="3" transform="rotate(-30 8 0)" /><circle className="ic-s ic-t" cx="-4" cy="5" r="2.2" /><rect className="ic-s ic-ac" x="1" y="8" width="5" height="3" transform="rotate(40 3 9)" /></g>;
  }
}

/** The drawing for one page, tinted by its skin. Decorative: the card's link text names the product. */
export default function ProductIllustration({ page }: { page: Pick<CatalogPage, "art" | "skin"> }) {
  const kind = illustrationFor(page);
  return (
    <svg viewBox="22 6 116 110" className="ic size-full" aria-hidden="true" focusable="false" data-kind={kind}>
      <ellipse className="ic-ground" cx="80" cy="108" rx="48" ry="6" />
      <Drawing kind={kind} />
      {page.skin.props[0] && <Motif kind={page.skin.props[0]} />}
    </svg>
  );
}
