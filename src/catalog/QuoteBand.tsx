import Link from "next/link";
import "./pageEnd.css";
import { PAGE_END, quoteHref, ROUTES } from "@/content/catalog";
import InViewPlay from "./InViewPlay";

type P = [number, number];
const f = (n: number) => +n.toFixed(2);
const pts = (a: P[]) => a.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];

/** CSS matrix that swings a flap (hinge edge e, flat reach u) up to angle `deg` about its hinge. Same flap, rotated about the edge. */
function swing(e: P, u: P, deg: number) {
  const len = Math.hypot(u[0], u[1]);
  const r = (deg * Math.PI) / 180;
  const w: P = [Math.cos(r) * u[0], Math.cos(r) * u[1] - Math.sin(r) * len];
  const det = e[0] * u[1] - u[0] * e[1];
  const a = (e[0] * u[1] - w[0] * e[1]) / det, b = (e[1] * u[1] - w[1] * e[1]) / det;
  const c = (w[0] * e[0] - e[0] * u[0]) / det, d = (w[1] * e[0] - e[1] * u[0]) / det;
  return `matrix(${f(a)},${f(b)},${f(c)},${f(d)},0,0)`;
}

/** A kraft shipping box line drawing whose two flaps slowly open and close. Only runs while on screen (InViewPlay) and never under reduced motion. */
function OpeningBox() {
  const x = 110, y = 138, A = 44, B = 44, H = 50;
  const Bf: P = [x, y], L: P = [x - A, y - A / 2], R: P = [x + B, y - B / 2], K: P = [x - A + B, y - A / 2 - B / 2];
  const up = (p: P): P => [p[0], p[1] - H];
  const Bt = up(Bf), Lt = up(L), Rt = up(R), Kt = up(K);
  const uF = sub(Bt, Lt).map((v) => v / 2) as P; // flap hinged on the back-left edge, reaching half way across the top
  const uG = sub(Lt, Bt).map((v) => v / 2) as P; // flap hinged on the front-right edge
  const eF = sub(Kt, Lt), eG = sub(Rt, Bt);
  const flapF = [Lt, Kt, add(Kt, uF), add(Lt, uF)];
  const flapG = [Bt, Rt, add(Rt, uG), add(Bt, uG)];
  return (
    <svg viewBox="0 0 220 180" className="band-box size-full" aria-hidden="true" focusable="false">
      <ellipse className="band-ground" cx="110" cy="146" rx="70" ry="9" />
      <polygon className="band-l" points={pts([L, Bf, Bt, Lt])} />
      <polygon className="band-r" points={pts([Bf, R, Rt, Bt])} />
      <polygon className="band-in" points={pts([Lt, Bt, Rt, Kt])} />
      <polygon className="band-flap band-t" points={pts(flapF)} style={{ transformOrigin: `${f(Lt[0])}px ${f(Lt[1])}px`, ["--open" as string]: swing(eF, uF, 68) }} />
      <polygon className="band-flap band-t" points={pts(flapG)} style={{ transformOrigin: `${f(Bt[0])}px ${f(Bt[1])}px`, ["--open" as string]: swing(eG, uG, 68) }} />
      <polygon className="band-tape" points={pts([[Lt[0] + uF[0] * 0.9, Lt[1] + uF[1] * 0.9], [Kt[0] + uF[0] * 0.9, Kt[1] + uF[1] * 0.9], [Kt[0] + uF[0] * 1.15, Kt[1] + uF[1] * 1.15], [Lt[0] + uF[0] * 1.15, Lt[1] + uF[1] * 1.15]])} />
    </svg>
  );
}

/**
 * Full-width forest band before the footer: a headline about this product, one honest line (no promised reply time) and two actions,
 * with a kraft box that slowly opens and closes. `product` is the page title; without it (hub pages) the copy is the general version.
 */
export default function QuoteBand({ product, note }: { product?: string; note?: string }) {
  const title = product ? PAGE_END.quoteTitle(product) : PAGE_END.hubTitle;
  const line = product ? PAGE_END.quoteLine : PAGE_END.hubLine;
  const primary = product ? PAGE_END.quotePrimary(product) : PAGE_END.hubPrimary;
  return (
    <section aria-labelledby="band-h" className="band relative overflow-hidden bg-[var(--accent)] px-6 py-16 text-[var(--on-accent)] md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.35fr_1fr] md:gap-16">
        <div>
          <span aria-hidden="true" className="mb-6 block h-1 w-16 bg-[var(--kraft)]" />
          <h2 id="band-h" className="font-display text-balance text-4xl font-medium leading-[1.1] md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-lg text-lg opacity-90">{line}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={quoteHref(product, note)} className="inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--on-accent)] px-7 py-3.5 text-base font-semibold text-[var(--accent)] hover:bg-white">{primary}</Link>
            <Link href={ROUTES.configurator} className="inline-flex items-center justify-center rounded-[var(--r-btn)] border border-[var(--on-accent)] px-7 py-3.5 text-base font-semibold hover:bg-[var(--on-accent)] hover:text-[var(--accent)]">{PAGE_END.quoteSecondary}</Link>
          </div>
        </div>
        <InViewPlay className="band-art mx-auto aspect-[220/180] w-full max-w-[19rem] md:max-w-none"><OpeningBox /></InViewPlay>
      </div>
    </section>
  );
}
