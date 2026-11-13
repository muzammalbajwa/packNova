import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { VEHICLE } from "@/lib/journey";

/**
 * A stylized, clean low-poly heavy cargo plane with a T-tail (no livery text, no real airline or aircraft). The stage
 * logic never touches its meshes: it places `root`, and calls `setGear` and `setHatch` with plain numbers. To ship by
 * sea instead, write another builder that returns the same `Vehicle` and set the numbers in `VEHICLE` (lib/journey.ts).
 *
 * Built once at mount, nothing is allocated afterwards. Every fixed part is merged per material, so the whole plane is a
 * handful of draw calls: the fuselage group (5 materials), the swinging tail door (4) and the gear (3).
 * Axes: nose toward +x, up +y, the pilot's right-hand wing toward +z. Local origin = centre of the aft opening.
 */
export interface VehiclePalette {
  body: THREE.Color;
  shade: THREE.Color;
  accent: THREE.Color;
  dark: THREE.Color;
  inner: THREE.Color;
}

export interface Vehicle {
  /** Local origin = centre of the aft hatch on the axis; nose toward +x, up toward +y. */
  root: THREE.Group;
  /** 1 = landing gear down, 0 = retracted. */
  setGear(extended: number): void;
  /** 0 = tail door swung up and open, 1 = closed. */
  setHatch(closed: number): void;
  dispose(): void;
  /** Build statistics (for the performance report). */
  stats: { triangles: number; meshes: number };
}

/** Radians about the hinge at the top of the tail door; negative swings the rear of the door up. */
const HATCH_OPEN = -0.72;

type V3 = [number, number, number];
type MatKey = "body" | "shade" | "accent" | "dark";

const NOSE = 10; // length of the nose cone ahead of the hold
const TAIL = 8; // length of the tail door behind the aft opening
const DROOP = 1.0; // nose tip drops this far below the axis
const UPSWEEP = 2.4; // how far the tail tip is above the axis

export function createCargoPlane(p: VehiclePalette, low: boolean): Vehicle {
  const R = VEHICLE.R;
  const L = VEHICLE.holdLen;
  const seg = low ? 16 : 28;
  const ring = low ? 10 : 14; // points around a wing / fin section
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  let triangles = 0;
  let meshes = 0;

  const m = (color: THREE.Color, o: THREE.MeshStandardMaterialParameters = {}) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...o });
    mats.push(mat);
    return mat;
  };
  const body = m(p.body);
  const shade = m(p.shade);
  const accent = m(p.accent, { roughness: 0.5 });
  const dark = m(p.dark, { roughness: 0.8 });
  const inner = m(p.inner, { roughness: 0.95, side: THREE.BackSide });
  const lightMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  mats.push(lightMat);
  const M: Record<MatKey, THREE.MeshStandardMaterial> = { body, shade, accent, dark };

  /* ------------------------------------------------------------ geometry helpers */

  const bag = (): Record<MatKey, THREE.BufferGeometry[]> => ({ body: [], shade: [], accent: [], dark: [] });
  const fixed = bag(); // parts that never move
  const gearParts = bag();
  const doorParts = bag();
  const doorInner: THREE.BufferGeometry[] = [];

  /** Drop uv and index so geometries from different builders can be merged. */
  const plain = (g: THREE.BufferGeometry) => {
    g.deleteAttribute("uv");
    return g.index ? g.toNonIndexed() : g;
  };
  const place = (g: THREE.BufferGeometry, to: THREE.BufferGeometry[]) => {
    to.push(plain(g));
  };

  /** Flip triangle winding when the surface faces inward (tested against the centroid). */
  const orient = (pos: number[], idx: number[]) => {
    const c = [0, 0, 0];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) c[k] += pos[i + k];
    const n = pos.length / 3;
    c[0] /= n; c[1] /= n; c[2] /= n;
    let s = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, d = idx[t + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[d] - pos[a], vy = pos[d + 1] - pos[a + 1], vz = pos[d + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const mx = (pos[a] + pos[b] + pos[d]) / 3 - c[0], my = (pos[a + 1] + pos[b + 1] + pos[d + 1]) / 3 - c[1], mz = (pos[a + 2] + pos[b + 2] + pos[d + 2]) / 3 - c[2];
      s += nx * mx + ny * my + nz * mz;
    }
    if (s < 0) for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
  };

  /** Skin over a list of closed rings (one per station). Smooth normals; the last ring is capped. */
  const loft = (rings: V3[][], capLast = true, capFirst = false) => {
    const n = rings[0].length;
    const pos: number[] = [];
    rings.forEach((r) => r.forEach((q) => pos.push(q[0], q[1], q[2])));
    const idx: number[] = [];
    for (let r = 0; r < rings.length - 1; r++) {
      for (let i = 0; i < n; i++) {
        const a = r * n + i, b = r * n + ((i + 1) % n), c = (r + 1) * n + i, d = (r + 1) * n + ((i + 1) % n);
        idx.push(a, c, b, b, c, d);
      }
    }
    const cap = (ringIndex: number) => {
      const o = pos.length / 3;
      const cx = [0, 0, 0];
      rings[ringIndex].forEach((q) => { cx[0] += q[0]; cx[1] += q[1]; cx[2] += q[2]; });
      pos.push(cx[0] / n, cx[1] / n, cx[2] / n);
      for (let i = 0; i < n; i++) idx.push(ringIndex * n + i, ringIndex * n + ((i + 1) % n), o);
    };
    if (capLast) cap(rings.length - 1);
    if (capFirst) cap(0);
    orient(pos, idx);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };

  /** Flat quads (hinge lines, control-surface panels, door outlines) with a fixed normal. */
  const quadsOf = (list: { q: [V3, V3, V3, V3]; n: V3 }[]) => {
    const pos: number[] = [];
    const nor: number[] = [];
    for (const { q, n } of list) {
      for (const k of [0, 1, 2, 0, 2, 3]) {
        pos.push(...q[k]);
        nor.push(...n);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    return g;
  };
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  /** Half thickness of a lens-shaped section at chord fraction cf (0 nose, 1 trailing edge), relative to its thickness. */
  const lens = (cf: number) => Math.sqrt(Math.max(0, 1 - (2 * cf - 1) ** 2));

  /** One closed section of a lifting surface: chordwise lens, round leading edge, pointed trailing edge. */
  const section = (le: number, c: number, t: number, at: (x: number, h: number) => V3): V3[] => {
    const out: V3[] = [];
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2;
      out.push(at(le + (0.5 + 0.5 * Math.cos(a)) * c, (t / 2) * Math.sin(a)));
    }
    return out;
  };

  /* ---------------------------------------------------- 1. hold, nose, inner shell */

  const rot90 = (g: THREE.BufferGeometry) => g.rotateZ(-Math.PI / 2); // lathe/cylinder axis y -> x
  const tube = rot90(new THREE.CylinderGeometry(R, R, L, seg, 1, true));
  tube.translate(L / 2, 0, 0);
  place(tube, fixed.body);
  const hold = new THREE.CylinderGeometry(R - 0.06, R - 0.06, L, seg, 1, true);
  rot90(hold).translate(L / 2, 0, 0);
  const holdInner = plain(hold);

  /** Radius along the nose: a rounded, slightly blunt ellipsoid. */
  const noseR = (t: number) => R * Math.pow(Math.max(0, 1 - Math.pow(t, 1.9)), 0.6);
  const nosePts: THREE.Vector2[] = [];
  const NN = low ? 10 : 16;
  for (let i = 0; i <= NN; i++) {
    const t = Math.sin((i / NN) * Math.PI * 0.5);
    nosePts.push(new THREE.Vector2(noseR(t), t * NOSE));
  }
  const nose = new THREE.LatheGeometry(nosePts, seg);
  rot90(nose).translate(L, 0, 0);
  // the tip droops a little, so the cockpit sits above the nose line
  const np = nose.attributes.position;
  for (let i = 0; i < np.count; i++) np.setY(i, np.getY(i) - DROOP * Math.pow((np.getX(i) - L) / NOSE, 2));
  nose.computeVertexNormals();
  place(nose, fixed.body);
  const bulkhead = new THREE.CircleGeometry(R - 0.05, seg);
  bulkhead.rotateY(-Math.PI / 2).translate(L - 0.05, 0, 0);
  place(bulkhead, fixed.dark);

  /** A partial shell over a list of stations ({x, yc, r}); phi runs from the top (+y) around the axis. */
  type Station = { x: number; yc: number; r: number };
  const shell = (st: Station[], phi0: number, phi1: number, grow = 1) => {
    const rows = st.map((s) => {
      const out: V3[] = [];
      const steps = Math.max(6, Math.round(((phi1 - phi0) / (Math.PI * 2)) * seg));
      for (let i = 0; i <= steps; i++) {
        const f = phi0 + ((phi1 - phi0) * i) / steps;
        out.push([s.x, s.yc + Math.cos(f) * s.r * grow, Math.sin(f) * s.r * grow]);
      }
      return out;
    });
    const n = rows[0].length;
    const pos: number[] = [];
    rows.forEach((r) => r.forEach((q) => pos.push(...q)));
    const idx: number[] = [];
    for (let r = 0; r < rows.length - 1; r++) {
      for (let i = 0; i < n - 1; i++) {
        const a = r * n + i, b = r * n + i + 1, c = (r + 1) * n + i, d = (r + 1) * n + i + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    // orient against the axis side: outward means away from the station centres
    let s = 0;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, d = idx[t + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[d] - pos[a], vy = pos[d + 1] - pos[a + 1], vz = pos[d + 2] - pos[a + 2];
      const ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const my = (pos[a + 1] + pos[b + 1] + pos[d + 1]) / 3 - st[0].yc, mz = (pos[a + 2] + pos[b + 2] + pos[d + 2]) / 3;
      s += ny * my + nz * mz;
    }
    if (s < 0) for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const tubeStations = (x0: number, x1: number, r: number, n = 2): Station[] =>
    Array.from({ length: n }, (_, i) => ({ x: lerp(x0, x1, i / (n - 1)), yc: 0, r }));

  // livery: one accent band round the body, a thin neutral stripe along it, the cockpit windows on the nose
  place(shell(tubeStations(L * 0.6, L * 0.6 + 1.5, R * 1.006), 0, Math.PI * 2), fixed.accent);
  place(shell(tubeStations(L * 0.6 + 2.1, L * 0.6 + 2.35, R * 1.006), 0, Math.PI * 2), fixed.accent);
  const noseStations = (t0: number, t1: number, n = 4): Station[] =>
    Array.from({ length: n }, (_, i) => {
      const t = lerp(t0, t1, i / (n - 1));
      return { x: L + t * NOSE, yc: -DROOP * t * t, r: noseR(t) };
    });
  place(shell(noseStations(0.2, 0.3), -Math.PI * 0.62, Math.PI * 0.62, 1.012), fixed.dark);

  /** A thin strip lying on the fuselage tube between two (x, angle) points. */
  const tubeLine = (x0: number, f0: number, x1: number, f1: number, w: number, to: THREE.BufferGeometry[], mat: MatKey) => {
    const rr = R * 1.004;
    const at = (x: number, f: number): V3 => [x, Math.cos(f) * rr, Math.sin(f) * rr];
    const a = at(x0, f0), b = at(x1, f1);
    const mid = at((x0 + x1) / 2, (f0 + f1) / 2);
    const nrm = unit([0, mid[1], mid[2]]);
    const side = unit(cross(nrm, sub(b, a)));
    const h = w / 2;
    const q: [V3, V3, V3, V3] = [
      [a[0] - side[0] * h, a[1] - side[1] * h, a[2] - side[2] * h],
      [b[0] - side[0] * h, b[1] - side[1] * h, b[2] - side[2] * h],
      [b[0] + side[0] * h, b[1] + side[1] * h, b[2] + side[2] * h],
      [a[0] + side[0] * h, a[1] + side[1] * h, a[2] + side[2] * h],
    ];
    // make the quad face outward
    const nq = cross(sub(q[1], q[0]), sub(q[3], q[0]));
    if (nq[0] * nrm[0] + nq[1] * nrm[1] + nq[2] * nrm[2] < 0) q.reverse();
    to.push(quadsOf([{ q, n: nrm }]));
    void mat;
  };
  const deg = Math.PI / 180;
  for (const sd of [1, -1]) {
    tubeLine(3, sd * 84 * deg, L - 1, sd * 84 * deg, 0.22, fixed.shade, "shade"); // neutral stripe along the body
    // a small crew door and a larger cargo-door outline on each side
    const door = [[6.4, 62], [8.4, 62], [8.4, 118], [6.4, 118]];
    for (let i = 0; i < 4; i++) {
      const [xa, fa] = door[i], [xb, fb] = door[(i + 1) % 4];
      tubeLine(xa, sd * fa * deg, xb, sd * fb * deg, 0.07, fixed.dark, "dark");
    }
    const hatch = [[15.5, 40], [19.8, 40], [19.8, 120], [15.5, 120]];
    for (let i = 0; i < 4; i++) {
      const [xa, fa] = hatch[i], [xb, fb] = hatch[(i + 1) % 4];
      tubeLine(xa, sd * fa * deg, xb, sd * fb * deg, 0.07, fixed.dark, "dark");
    }
  }

  /* ------------------------------------------------------------------- 2. wings */

  const W = { z0: 2.3, half: 19, le0: 19.2, c0: 10.8, c1: 3.8, t0: 1.15, t1: 0.3, sweep: Math.tan(24 * deg), y0: R * 0.7, dih: Math.tan(3 * deg) };
  const U = W.half - W.z0;
  const wc = (u: number) => lerp(W.c0, W.c1, u / U);
  const wt = (u: number) => lerp(W.t0, W.t1, Math.pow(u / U, 0.8));
  const wle = (u: number) => W.le0 - u * W.sweep;
  const wy = (u: number) => W.y0 + u * W.dih;
  /** A point on the top (side>0 of h) or bottom of the wing surface at span u and chord fraction cf. */
  const wingPt = (sd: number, u: number, cf: number, up: number, off = 0): V3 => [wle(u) + cf * wc(u), wy(u) + up * (wt(u) / 2) * lens(cf) + off * up, sd * (W.z0 + u)];
  const wingSteps = [0, 0.18, 0.42, 0.7, 1].map((f) => f * U);
  for (const sd of [1, -1]) {
    const rings = wingSteps.map((u) => section(wle(u), wc(u), wt(u), (x, h) => [x, wy(u) + h, sd * (W.z0 + u)]));
    place(loft(rings), fixed.shade);
    // hinge lines: flaps on the inner wing, ailerons outboard (thin dark strips on the top surface)
    const seam = (u0: number, u1: number, cf: number, w: number) => {
      const pt = (u: number, d: number) => wingPt(sd, u, cf + d / wc(u), 1, 0.02);
      place(quadsOf([{ q: [pt(u0, -w / 2), pt(u1, -w / 2), pt(u1, w / 2), pt(u0, w / 2)], n: [0, 1, 0] }]), fixed.dark);
    };
    const flap = [0.1 * U, 0.52 * U];
    const ail = [0.6 * U, 0.92 * U];
    seam(flap[0], flap[1], 0.74, 0.1);
    seam(ail[0], ail[1], 0.78, 0.1);
    for (const [u0, u1, cf] of [[flap[0], flap[1], 0.74], [ail[0], ail[1], 0.78]]) {
      for (const u of [u0, u1]) {
        const a = wingPt(sd, u, cf, 1, 0.02), b = wingPt(sd, u, 0.97, 1, 0.02);
        const w = 0.05;
        place(quadsOf([{ q: [[a[0], a[1], a[2] - w], [b[0], b[1], b[2] - w], [b[0], b[1], b[2] + w], [a[0], a[1], a[2] + w]], n: [0, 1, 0] }]), fixed.dark);
      }
    }
  }

  /* ---------------------------------------------------------------- 3. engines */

  const engX = (u: number) => wle(u) + 1.55; // nacelle front, ahead of the wing leading edge
  const NAC = 4.8;
  const nacPts: THREE.Vector2[] = [];
  // profile along the axis (y here, rotated to x): inner lip, rounded intake ring, body, tapered exhaust
  [[0.62, 0], [0.74, 0.06], [0.88, 0.22], [0.97, 0.55], [0.99, 1.2], [0.97, 2.6], [0.86, 3.7], [0.7, 4.5], [0.58, NAC]].forEach(([r, y]) => nacPts.push(new THREE.Vector2(r, y)));
  const nacGeo = new THREE.LatheGeometry(nacPts, low ? 12 : 20);
  rot90(nacGeo);
  const fan = new THREE.CircleGeometry(0.64, low ? 12 : 20);
  fan.rotateY(Math.PI / 2).translate(0.22, 0, 0);
  const cone = new THREE.ConeGeometry(0.42, 1.1, low ? 8 : 12);
  rot90(cone).translate(NAC - 0.35, 0, 0);
  for (const sd of [1, -1]) {
    for (const u of [4.3, 9.6]) {
      const x0 = engX(u);
      const wingBottom = wy(u) - wt(u) / 2;
      const yN = wingBottom - 2.05;
      const zN = sd * (W.z0 + u);
      const put = (g: THREE.BufferGeometry, to: THREE.BufferGeometry[]) => {
        const c = g.clone();
        c.translate(x0, yN, zN);
        place(c, to);
      };
      put(nacGeo, fixed.shade);
      put(fan, fixed.dark);
      put(cone, fixed.dark);
      // pylon: a thin swept fin from the top of the nacelle up into the wing
      const yBot = yN + 0.75, yTop = wingBottom + 0.12;
      const rings = [0, 0.5, 1].map((f) => {
        const y = lerp(yBot, yTop, f);
        const le = lerp(x0 + 0.1, wle(u) + 0.9, f);
        return section(le, lerp(3.4, 5.4, f), lerp(0.32, 0.4, f), (x, h) => [x, y, zN + h]);
      });
      place(loft(rings, false), fixed.shade);
    }
  }

  /* ------------------------------------------------------------ 4. fin, rudder */

  const FIN = { x: 9.3, y: R - 0.4, h: 7.5, c0: 8.0, c1: 4.9, t0: 0.95, t1: 0.36, sweep: Math.tan(38 * deg) };
  const fc = (h: number) => lerp(FIN.c0, FIN.c1, h / FIN.h);
  const ft = (h: number) => lerp(FIN.t0, FIN.t1, h / FIN.h);
  const fle = (h: number) => FIN.x - h * FIN.sweep;
  const finRings = [0, 0.3, 0.62, 1].map((f) => f * FIN.h).map((h) => section(fle(h), fc(h), ft(h), (x, t) => [x, FIN.y + h, t]));
  place(loft(finRings), fixed.body);
  // rudder: a separate panel on both faces of the trailing edge, with a dark hinge line
  const finPt = (sd: number, h: number, cf: number, off = 0): V3 => [fle(h) + cf * fc(h), FIN.y + h, sd * ((ft(h) / 2) * lens(cf) + off)];
  for (const sd of [1, -1]) {
    const hs = [0.1, FIN.h * 0.97];
    const cfs = [0.7, 0.8, 0.9, 0.985];
    const list: { q: [V3, V3, V3, V3]; n: V3 }[] = [];
    for (let i = 0; i < cfs.length - 1; i++) list.push({ q: [finPt(sd, hs[0], cfs[i], 0.015), finPt(sd, hs[0], cfs[i + 1], 0.015), finPt(sd, hs[1], cfs[i + 1], 0.015), finPt(sd, hs[1], cfs[i], 0.015)], n: [0, 0, sd] });
    if (sd < 0) list.forEach((e) => e.q.reverse());
    place(quadsOf(list), fixed.shade);
    const w = 0.05 / FIN.c0;
    const line = [{ q: [finPt(sd, hs[0], 0.7 - w, 0.03), finPt(sd, hs[0], 0.7 + w, 0.03), finPt(sd, hs[1], 0.7 + w, 0.03), finPt(sd, hs[1], 0.7 - w, 0.03)] as [V3, V3, V3, V3], n: [0, 0, sd] as V3 }];
    if (sd < 0) line[0].q.reverse();
    place(quadsOf(line), fixed.dark);
  }
  // accent cap on the fin tip
  const capRings = [0.93, 1].map((f) => f * FIN.h).map((h) => section(fle(h) - 0.02, fc(h) + 0.04, ft(h) + 0.04, (x, t) => [x, FIN.y + h, t]));
  place(loft(capRings), fixed.accent);

  /* ------------------------------------------------- 5. T-tail horizontal stabilizers */

  const ST = { y: FIN.y + FIN.h, z0: 0.12, half: 7.8, c0: 4.6, c1: 2.0, t0: 0.52, t1: 0.2, sweep: Math.tan(30 * deg), dih: Math.tan(4 * deg) };
  const SU = ST.half - ST.z0;
  const sle0 = fle(FIN.h) + 0.15;
  const sc = (u: number) => lerp(ST.c0, ST.c1, u / SU);
  const st = (u: number) => lerp(ST.t0, ST.t1, u / SU);
  const sle = (u: number) => sle0 - u * ST.sweep;
  const sy = (u: number) => ST.y + u * ST.dih;
  const stabPt = (sd: number, u: number, cf: number, up: number, off = 0): V3 => [sle(u) + cf * sc(u), sy(u) + up * (st(u) / 2) * lens(cf) + off * up, sd * (ST.z0 + u)];
  for (const sd of [1, -1]) {
    const rings = [0, 0.35, 0.7, 1].map((f) => f * SU).map((u) => section(sle(u), sc(u), st(u), (x, h) => [x, sy(u) + h, sd * (ST.z0 + u)]));
    place(loft(rings), fixed.shade);
    // elevator hinge line on top and bottom
    for (const up of [1, -1]) {
      const pt = (u: number, d: number) => stabPt(sd, u, 0.68 + d / sc(u), up, 0.015);
      const q: [V3, V3, V3, V3] = [pt(0.06 * SU, -0.04), pt(0.97 * SU, -0.04), pt(0.97 * SU, 0.04), pt(0.06 * SU, 0.04)];
      if ((sd > 0) !== (up > 0)) q.reverse();
      place(quadsOf([{ q, n: [0, up, 0] }]), fixed.dark);
    }
  }
  // fairing where the stabilizers meet the fin
  const fairing = new THREE.SphereGeometry(1, low ? 10 : 16, low ? 6 : 10);
  fairing.scale(3.3, 0.5, 0.8).translate(fle(FIN.h) + 2.4, ST.y, 0);
  place(fairing, fixed.accent);

  /* ---------------------------------------------- 6. fairings, wing-tip nav lights */

  const sponson = new THREE.SphereGeometry(1, low ? 12 : 20, low ? 8 : 12);
  sponson.scale(4.6, 0.9, 1.0);
  for (const sd of [1, -1]) {
    const c = sponson.clone().translate(13.2, -R * 0.64, sd * 2.55);
    place(c, fixed.shade);
  }
  const lightSphere = (c: THREE.Color, at: V3) => {
    const g = new THREE.SphereGeometry(0.26, 8, 6);
    g.translate(...at);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return plain(g);
  };
  const lights = mergeGeometries([
    lightSphere(new THREE.Color("#ff2d2d"), [wle(U) + wc(U) * 0.45, wy(U), -(W.z0 + U) - 0.1]), // port (left): red
    lightSphere(new THREE.Color("#25d366"), [wle(U) + wc(U) * 0.45, wy(U), W.z0 + U + 0.1]), // starboard (right): green
  ], false)!;

  /* ------------------------------------------------------------- 7. landing gear */

  const wheel = new THREE.CylinderGeometry(0.8, 0.8, 0.55, low ? 10 : 14);
  wheel.rotateX(Math.PI / 2);
  const strut = new THREE.BoxGeometry(0.26, 1, 0.26);
  const beam = new THREE.BoxGeometry(3.4, 0.2, 0.2);
  const yWheel = -R - 0.4; // wheel centres: the tyres touch the ground exactly as before
  const gearAt = (g: THREE.BufferGeometry, x: number, y: number, z: number, to: THREE.BufferGeometry[], sy = 1) => {
    const c = g.clone();
    c.scale(1, sy, 1).translate(x, y + R, z); // the gear group pivots on the belly (y = -R)
    place(c, to);
  };
  for (const sd of [1, -1]) {
    for (const x of [11.7, 14.7]) {
      for (const dz of [-0.45, 0.45]) gearAt(wheel, x, yWheel, sd * 2.55 + dz, gearParts.dark);
    }
    gearAt(strut, 13.2, (-R * 0.64 - 0.9 + yWheel) / 2, sd * 2.55, gearParts.shade, 1.6);
    gearAt(beam, 13.2, yWheel, sd * 2.55, gearParts.shade);
  }
  for (const dz of [-0.4, 0.4]) gearAt(wheel, L + 4.2, yWheel, dz, gearParts.dark);
  gearAt(strut, L + 4.2, (-R * 0.6 + yWheel) / 2, 0, gearParts.shade, 1.5);

  /* ----------------------------------------- 8. tail door: swings up on the hinge */

  const NS = low ? 6 : 10;
  const tailSt: Station[] = Array.from({ length: NS + 1 }, (_, i) => {
    const s = i / NS;
    return { x: -TAIL * s, yc: UPSWEEP * Math.pow(s, 1.5), r: R * (1 - 0.9 * Math.pow(s, 1.05)) };
  });
  const PHI = 125 * deg;
  const doorShell = shell(tailSt, -PHI, PHI);
  place(doorShell, doorParts.body);
  const doorIn = plain(doorShell.clone());
  doorInner.push(doorIn);
  // accent band across the door
  place(shell(tailSt.slice(2, 4), -PHI, PHI, 1.012), doorParts.accent);
  // belly plate (the stowed cargo ramp) between the lower edges of the shell
  const plate: { q: [V3, V3, V3, V3]; n: V3 }[] = [];
  const edge = (s: Station, sd: number): V3 => [s.x, s.yc + Math.cos(PHI) * s.r, sd * Math.sin(PHI) * s.r];
  for (let i = 0; i < tailSt.length - 1; i++) {
    plate.push({ q: [edge(tailSt[i], -1), edge(tailSt[i], 1), edge(tailSt[i + 1], 1), edge(tailSt[i + 1], -1)], n: [0, -1, 0] });
  }
  place(quadsOf(plate), doorParts.shade);
  // the part of the end ring below the plate (a lens): closes the underside when the door is shut
  {
    const pos: number[] = [];
    const nor: number[] = [];
    const steps = low ? 6 : 10;
    const arc: V3[] = [];
    for (let i = 0; i <= steps; i++) {
      const f = PHI + ((Math.PI * 2 - 2 * PHI) * i) / steps;
      arc.push([-0.02, Math.cos(f) * R, Math.sin(f) * R]);
    }
    for (let i = 0; i < steps; i++) {
      pos.push(...arc[0], ...arc[i + 1], ...arc[i]);
      for (let k = 0; k < 3; k++) nor.push(-1, 0, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    place(g, doorParts.shade);
  }

  /* --------------------------------------------------------------- assemble */

  const root = new THREE.Group();
  const addMerged = (parts: THREE.BufferGeometry[], mat: THREE.Material, parent: THREE.Object3D, shift?: [number, number, number]) => {
    if (parts.length === 0) return;
    const g = mergeGeometries(parts, false)!;
    if (shift) g.translate(...shift);
    geos.push(g);
    triangles += g.attributes.position.count / 3;
    meshes++;
    parent.add(new THREE.Mesh(g, mat));
  };
  (Object.keys(M) as MatKey[]).forEach((k) => addMerged(fixed[k], M[k], root));
  addMerged([holdInner], inner, root);
  addMerged([lights], lightMat, root);

  const gear = new THREE.Group();
  gear.position.y = -R;
  (Object.keys(M) as MatKey[]).forEach((k) => addMerged(gearParts[k], M[k], gear));
  root.add(gear);

  const hinge = new THREE.Group();
  hinge.position.set(0, R, 0);
  (Object.keys(M) as MatKey[]).forEach((k) => addMerged(doorParts[k], M[k], hinge, [0, -R, 0]));
  addMerged(doorInner, inner, hinge, [0, -R, 0]);
  root.add(hinge);

  return {
    root,
    stats: { triangles: Math.round(triangles), meshes },
    setGear(e) {
      gear.scale.y = Math.max(0.001, e);
      gear.visible = e > 0.01;
    },
    setHatch(closed) {
      hinge.rotation.z = HATCH_OPEN * (1 - closed);
    },
    dispose() {
      geos.forEach((x) => x.dispose());
      mats.forEach((x) => x.dispose());
    },
  };
}
