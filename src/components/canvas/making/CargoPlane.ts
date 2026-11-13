import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * A stylized, clean low-poly heavy freighter with a T-tail (no livery text, no real airline or aircraft).
 *
 * ONE specification (`PLANE_SPEC`) drives the whole model; every part hangs off a named anchor derived from it, so
 * nothing is placed by a loose number elsewhere. The stage logic never touches the meshes: it places `root`, and calls
 * `setGear` and `setHatch` (the side cargo door) with plain numbers. To ship by sea instead, write another builder that
 * returns the same `Vehicle`.
 *
 * One coordinate system: fuselage axis along +X (nose at +X), up +Y, left/right along Z (right-hand wing = +Z),
 * origin at the centre of the fuselage. Fractions `f` below run from the nose (0) to the tail tip (1), of length L.
 *
 * Built once at mount; nothing is allocated afterwards. Fixed parts are merged per material; every left/right pair is
 * built ONCE (+Z side) and mirrored by a parent group with scale.z = -1, so symmetry is exact by construction.
 * This file only imports three, so scripts/plane-test.mjs can build the plane in plain Node.
 */
export const PLANE_SPEC = {
  L: 48, // fuselage length, nose to tail tip
  R: 3.1, // fuselage radius (diameter 0.13 L; the carton sets the scale)
  nose: { len: 0.15, droop: 0.8 }, // rounded nose, its tip sits a little below the axis
  rear: { start: 0.78, upsweepDeg: 11, tipRadius: 0.1 }, // cone from f=0.78 to the tail tip, sweeping up; the tip is the last point
  fin: { rootTE: 0.945, rootChord: 8.0, tipChord: 4.8, height: 8.2, sweepDeg: 35, rootY: 1.8, rootThick: 0.95, tipThick: 0.36, rudder: 0.3 },
  stab: { rootChord: 4.4, tipChord: 1.2, halfSpan: 9.4, sweepDeg: 20, dihedralDeg: 4, rootThick: 0.5, tipThick: 0.2 },
  wing: { rootCenter: 0.47, rootChord: 9.6, tipChord: 3.4, halfSpan: 21.6, sweepDeg: 27, dihedralDeg: 3, rootY: -1.25, rootZ: 2.6, rootThick: 1.15, tipThick: 0.3 },
  engines: { u: [0.28, 0.62], length: 4.8, drop: 1.35, ahead: 1.55 }, // spanwise stations (0..1), nacelle length, drop under the wing, intake ahead of the wing leading edge
  door: { center: 0.65, width: 3.6, sill: -1.75, top: 1.25, recess: 0.4 }, // side cargo door (+Z side), main deck behind the wing root
  gear: { main: 0.47, nose: 0.08, mainZ: 2.55 },
};

export interface VehiclePalette {
  body: THREE.Color;
  shade: THREE.Color;
  accent: THREE.Color;
  dark: THREE.Color;
  inner: THREE.Color;
}

export interface Vehicle {
  /** Origin = centre of the fuselage on the axis; nose toward +x, up toward +y. */
  root: THREE.Group;
  /** 1 = landing gear down, 0 = retracted. */
  setGear(extended: number): void;
  /** Side cargo door: 0 = swung up and open, 1 = closed. */
  setHatch(closed: number): void;
  dispose(): void;
  /** Named anchors (plane space) every part is attached to. Also drawn as small axes with `debug`. */
  anchors: Record<string, THREE.Object3D>;
  /** Right-hand (+Z) bounding boxes of the mirrored parts, in plane space (for the symmetry tests). */
  boxes: Record<string, THREE.Box3>;
  /** Mirrored halves, for the symmetry tests. */
  halves: { name: string; right: THREE.Group; left: THREE.Group }[];
  stats: { triangles: number; meshes: number };
}

/** Radians about the door's top hinge; negative swings the door up and outward (+Z). */
const DOOR_OPEN = -1.9;

type V3 = [number, number, number];
type MatKey = "body" | "shade" | "accent" | "dark";
type Bag = Record<MatKey, THREE.BufferGeometry[]>;
const deg = Math.PI / 180;
const KEYS: MatKey[] = ["body", "shade", "accent", "dark"];

/** Everything derived from the spec: positions along the axis, surfaces, anchors. */
export function planeLayout(S = PLANE_SPEC) {
  const { L, R } = S;
  /** x of a fraction f (0 nose, 1 tail tip). */
  const xAt = (f: number) => L / 2 - f * L;
  const restart = S.rear.start;
  const coneLen = (1 - restart) * L;
  const upU = (Math.tan(S.rear.upsweepDeg * deg) * coneLen) / 1.5;
  /** Axis offset and radius of the fuselage skin at fraction f. */
  const skin = (f: number): { yc: number; r: number } => {
    if (f < S.nose.len) {
      const u = f / S.nose.len;
      return { yc: -S.nose.droop * (1 - u) ** 2, r: R * Math.pow(Math.max(0, 1 - (1 - u) ** 1.9), 0.6) };
    }
    if (f <= restart) return { yc: 0, r: R };
    const s = (f - restart) / (1 - restart);
    return { yc: upU * s ** 1.5, r: R * (1 - (1 - S.rear.tipRadius) * s ** 1.05) };
  };
  const tail = skin(1);
  // fin
  const fin = S.fin;
  const finTE = xAt(fin.rootTE);
  const finLE = finTE + fin.rootChord;
  const finSweep = Math.tan(fin.sweepDeg * deg);
  const finTipLE = finLE - fin.height * finSweep;
  const finTipTE = finTipLE - fin.tipChord;
  const finTipY = fin.rootY + fin.height;
  // stabilizers sit on the fin tip
  const stRootLE = finTipLE - 0.2;
  // wing
  const w = S.wing;
  const wingLE0 = xAt(w.rootCenter) + w.rootChord / 2;
  const wingU = w.halfSpan - w.rootZ;
  const wingSweep = Math.tan(w.sweepDeg * deg);
  const wc = (u: number) => w.rootChord + (w.tipChord - w.rootChord) * (u / wingU);
  const wt = (u: number) => w.rootThick + (w.tipThick - w.rootThick) * Math.pow(u / wingU, 0.8);
  const wle = (u: number) => wingLE0 - u * wingSweep;
  const wy = (u: number) => w.rootY + u * Math.tan(w.dihedralDeg * deg);
  const lens = (cf: number) => Math.sqrt(Math.max(0, 1 - (2 * cf - 1) ** 2));
  /** Height of the wing's lower surface at span u and chord fraction cf. */
  const wingUnder = (u: number, cf: number) => wy(u) - (wt(u) / 2) * lens(cf);
  // door
  const d = S.door;
  const doorX = xAt(d.center);
  const phiTop = Math.acos(d.top / R);
  const phiSill = Math.acos(d.sill / R);
  // engines
  const nacelles = S.engines.u.map((f) => {
    const u = f * wingU;
    return { u, front: wle(u) + S.engines.ahead, y: wingUnder(u, 0.3) - S.engines.drop, z: w.rootZ + u };
  });
  return {
    S, L, R, xAt, skin, restart, tail, coneLen,
    fin: { te: finTE, le: finLE, tipLE: finTipLE, tipTE: finTipTE, tipY: finTipY, sweep: finSweep },
    st: { rootLE: stRootLE },
    wing: { le0: wingLE0, U: wingU, c: wc, t: wt, le: wle, y: wy, under: wingUnder, lens },
    door: { x: doorX, x0: doorX - d.width / 2, x1: doorX + d.width / 2, phiTop, phiSill },
    nacelles,
  };
}

export function createCargoPlane(p: VehiclePalette, low: boolean, debug = false): Vehicle {
  const Ly = planeLayout();
  const { S, L, R, xAt } = Ly;
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
  const M: Record<MatKey, THREE.MeshStandardMaterial> = { body: m(p.body), shade: m(p.shade), accent: m(p.accent, { roughness: 0.5 }), dark: m(p.dark, { roughness: 0.8 }) };
  const inner = m(p.inner, { roughness: 0.95, side: THREE.BackSide });
  const lightMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  mats.push(lightMat);

  /* ------------------------------------------------------------ geometry helpers */

  const bag = (): Bag => ({ body: [], shade: [], accent: [], dark: [] });
  const plain = (g: THREE.BufferGeometry) => {
    g.deleteAttribute("uv");
    return g.index ? g.toNonIndexed() : g;
  };
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const unit = (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const lens = Ly.wing.lens;

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

  /** Skin over closed rings (one per station). Smooth normals; ends can be capped. */
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

  /** Flat quads (hinge lines, panels, reveals) with given normals. */
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
  /** One quad whose normal faces `toward` (a point). */
  const quadToward = (q: [V3, V3, V3, V3], toward: V3) => {
    let n = unit(cross(sub(q[1], q[0]), sub(q[3], q[0])));
    const c: V3 = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, (q[0][2] + q[2][2]) / 2];
    if (dot(n, sub(toward, c)) < 0) {
      q = [q[3], q[2], q[1], q[0]];
      n = [-n[0], -n[1], -n[2]];
    }
    return { q, n };
  };

  /** One closed lifting-surface section: chordwise lens, round leading edge, pointed trailing edge. */
  const section = (le: number, c: number, t: number, at: (x: number, h: number) => V3): V3[] => {
    const out: V3[] = [];
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2;
      out.push(at(le + (0.5 + 0.5 * Math.cos(a)) * c, (t / 2) * Math.sin(a)));
    }
    return out;
  };

  /** A partial shell over stations ({x, yc, r}); phi runs from the top (+y) around the axis (z = r sin phi). */
  type Station = { x: number; yc: number; r: number };
  const shell = (st: Station[], phi0: number, phi1: number, grow = 1) => {
    const steps = Math.max(6, Math.round(((phi1 - phi0) / (Math.PI * 2)) * seg));
    const rows = st.map((s) => {
      const out: V3[] = [];
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

  const fixed = bag();
  const fixedGear = bag();
  const place = (g: THREE.BufferGeometry, to: THREE.BufferGeometry[]) => void to.push(plain(g));
  const boxOf = (gs: THREE.BufferGeometry[]) => {
    const b = new THREE.Box3();
    gs.forEach((g) => {
      g.computeBoundingBox();
      b.union(g.boundingBox!);
    });
    return b;
  };

  /* -------------------------------------------------- anchors (all derived from the spec) */

  const A: Record<string, V3> = {};
  A.noseAnchor = [xAt(0), Ly.skin(0).yc, 0];
  A.tailTipAnchor = [xAt(1), Ly.tail.yc, 0];
  A.finRootAnchor = [Ly.fin.te, S.fin.rootY, 0]; // root trailing edge, on the axis
  A.stabilizerAnchor = [(Ly.fin.tipLE + Ly.fin.tipTE) / 2, Ly.fin.tipY, 0]; // centre of the fin tip
  A.wingRootAnchorRight = [xAt(S.wing.rootCenter), S.wing.rootY, S.wing.rootZ];
  A.wingRootAnchorLeft = [xAt(S.wing.rootCenter), S.wing.rootY, -S.wing.rootZ];
  A.sideDoorAnchor = [Ly.door.x, (S.door.top + S.door.sill) / 2, Math.sqrt(R * R - ((S.door.top + S.door.sill) / 2) ** 2)];
  A.mainGearAnchorRight = [xAt(S.gear.main), -R * 0.64, S.gear.mainZ];
  A.mainGearAnchorLeft = [xAt(S.gear.main), -R * 0.64, -S.gear.mainZ];
  A.noseGearAnchor = [xAt(S.gear.nose), -R * 0.6, 0];
  const pylonCF = (n: { u: number; front: number }) => (n.front + 2.0 - Ly.wing.le(n.u)) / Ly.wing.c(n.u);
  Ly.nacelles.forEach((n, i) => {
    // pylon top: where the pylon meets the wing's lower surface (right side, then mirrored)
    const y = Ly.wing.under(n.u, pylonCF(n));
    A[`enginePylonAnchorRight${i}`] = [n.front + 2.0, y, n.z];
    A[`enginePylonAnchorLeft${i}`] = [n.front + 2.0, y, -n.z];
  });

  /* ------------------------------------------------ 1. fuselage skin with the door cut out */

  const ringAt = (f: number): V3[] => {
    const s = Ly.skin(f);
    const x = xAt(f);
    const out: V3[] = [];
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      out.push([x, s.yc + Math.cos(a) * s.r, Math.sin(a) * s.r]);
    }
    return out;
  };
  const fAt = (x: number) => (L / 2 - x) / L;
  const noseSt = low ? 8 : 12;
  const fuseA: V3[][] = [];
  for (let i = 0; i <= noseSt; i++) fuseA.push(ringAt(Math.max(1e-4, Math.sin((i / noseSt) * Math.PI * 0.5) * S.nose.len)));
  fuseA.push(ringAt(fAt(Ly.door.x1)));
  place(loft(fuseA, false, true), fixed.body);
  // the band with the door window cut out (open shell around the +Z side)
  const doorSt: Station[] = [{ x: Ly.door.x1, yc: 0, r: R }, { x: Ly.door.x0, yc: 0, r: R }];
  place(shell(doorSt, Ly.door.phiSill, Math.PI * 2 + Ly.door.phiTop), fixed.body);
  const fuseC: V3[][] = [ringAt(fAt(Ly.door.x0)), ringAt(S.rear.start)];
  const coneSt = low ? 6 : 10;
  for (let i = 1; i <= coneSt; i++) fuseC.push(ringAt(S.rear.start + ((1 - S.rear.start) * i) / coneSt));
  place(loft(fuseC, true, false), fixed.body);

  // inside the hold, seen through the open door: an inner shell, a floor, the reveal of the opening
  const x0 = Ly.door.x0 - 1.6, x1 = Ly.door.x1 + 1.6;
  const holdShell = new THREE.CylinderGeometry(R - 0.34, R - 0.34, x1 - x0, seg, 1, true);
  holdShell.rotateZ(-Math.PI / 2).translate((x0 + x1) / 2, 0, 0);
  const holdInner = plain(holdShell);
  for (const x of [x0, x1]) {
    const cap = new THREE.CircleGeometry(R - 0.34, seg);
    cap.rotateY(x === x0 ? Math.PI / 2 : -Math.PI / 2).translate(x, 0, 0);
    place(cap, fixed.dark);
  }
  const zS = R * Math.sin(Ly.door.phiSill);
  place(quadsOf([quadToward([[x0, S.door.sill, -zS + 0.05], [x1, S.door.sill, -zS + 0.05], [x1, S.door.sill, zS - 0.05], [x0, S.door.sill, zS - 0.05]], [0, 10, 0])]), fixed.shade);
  {
    const inward = R - S.door.recess;
    const pt = (x: number, phi: number, r: number): V3 => [x, Math.cos(phi) * r, Math.sin(phi) * r];
    const centre: V3 = [Ly.door.x, (S.door.top + S.door.sill) / 2, 0];
    const list: { q: [V3, V3, V3, V3]; n: V3 }[] = [];
    list.push(quadToward([pt(Ly.door.x1, Ly.door.phiTop, R), pt(Ly.door.x0, Ly.door.phiTop, R), pt(Ly.door.x0, Ly.door.phiTop, inward), pt(Ly.door.x1, Ly.door.phiTop, inward)], centre));
    const N = 6;
    for (const x of [Ly.door.x0, Ly.door.x1]) {
      for (let i = 0; i < N; i++) {
        const a = Ly.door.phiTop + ((Ly.door.phiSill - Ly.door.phiTop) * i) / N;
        const b = Ly.door.phiTop + ((Ly.door.phiSill - Ly.door.phiTop) * (i + 1)) / N;
        list.push(quadToward([pt(x, a, R), pt(x, b, R), pt(x, b, inward), pt(x, a, inward)], centre));
      }
    }
    place(quadsOf(list), fixed.dark);
    // a thin dark seam just outside the opening, so the closed door reads as a door
    const seam = (st: Station[], a: number, b: number) => place(shell(st, a, b, 1.0035), fixed.dark);
    const e = 0.03;
    seam([{ x: Ly.door.x1 + e, yc: 0, r: R }, { x: Ly.door.x0 - e, yc: 0, r: R }], Ly.door.phiTop - 0.018, Ly.door.phiTop);
    seam([{ x: Ly.door.x1 + e, yc: 0, r: R }, { x: Ly.door.x0 - e, yc: 0, r: R }], Ly.door.phiSill, Ly.door.phiSill + 0.018);
    for (const x of [Ly.door.x0, Ly.door.x1]) seam([{ x: x + e, yc: 0, r: R }, { x: x - e, yc: 0, r: R }], Ly.door.phiTop, Ly.door.phiSill);
  }

  /* livery: accent bands, a neutral stripe, cockpit windows, a crew door outline */
  const bandAt = (f0: number, f1: number) => place(shell([{ x: xAt(f0), yc: 0, r: R * 1.006 }, { x: xAt(f1), yc: 0, r: R * 1.006 }], 0, Math.PI * 2), fixed.accent);
  bandAt(0.3, 0.325);
  bandAt(0.34, 0.345);
  bandAt(0.69, 0.71);
  const noseF = (u: number) => Ly.skin(u * S.nose.len);
  place(shell([0.2, 0.3, 0.4].map((u) => ({ x: xAt(u * S.nose.len), yc: noseF(u).yc, r: noseF(u).r })), -Math.PI * 0.62, Math.PI * 0.62, 1.012), fixed.dark);
  const tubeLine = (xa: number, fa: number, xb: number, fb: number, w: number, to: THREE.BufferGeometry[]) => {
    const rr = R * 1.004;
    const at = (x: number, f: number): V3 => [x, Math.cos(f) * rr, Math.sin(f) * rr];
    const a = at(xa, fa), b = at(xb, fb);
    const mid = at((xa + xb) / 2, (fa + fb) / 2);
    const nrm = unit([0, mid[1], mid[2]]);
    const side = unit(cross(nrm, sub(b, a)));
    const h = w / 2;
    const q: [V3, V3, V3, V3] = [
      [a[0] - side[0] * h, a[1] - side[1] * h, a[2] - side[2] * h],
      [b[0] - side[0] * h, b[1] - side[1] * h, b[2] - side[2] * h],
      [b[0] + side[0] * h, b[1] + side[1] * h, b[2] + side[2] * h],
      [a[0] + side[0] * h, a[1] + side[1] * h, a[2] + side[2] * h],
    ];
    to.push(quadsOf([quadToward(q, [mid[0] + nrm[0], mid[1] + nrm[1], mid[2] + nrm[2]])]));
  };
  for (const sd of [1, -1]) {
    tubeLine(xAt(0.2), sd * 84 * deg, xAt(0.76), sd * 84 * deg, 0.22, fixed.shade); // neutral stripe along the body
    const crew = [[xAt(0.3), 62], [xAt(0.3) - 2.0, 62], [xAt(0.3) - 2.0, 118], [xAt(0.3), 118]];
    for (let i = 0; i < 4; i++) {
      const [xa, fa] = crew[i], [xb, fb] = crew[(i + 1) % 4];
      tubeLine(xa, sd * fa * deg, xb, sd * fb * deg, 0.07, fixed.dark);
    }
  }

  /* -------------------------------------------------------- 2. vertical fin and rudder */

  const F = S.fin;
  const fc = (h: number) => lerp(F.rootChord, F.tipChord, h / F.height);
  const ft = (h: number) => lerp(F.rootThick, F.tipThick, h / F.height);
  const fle = (h: number) => Ly.fin.le - h * Ly.fin.sweep;
  const finRings = [0, 0.3, 0.62, 1].map((f) => f * F.height).map((h) => section(fle(h), fc(h), ft(h), (x, t) => [x, F.rootY + h, t]));
  place(loft(finRings), fixed.body);
  const finPt = (sd: number, h: number, cf: number, off = 0): V3 => [fle(h) + cf * fc(h), F.rootY + h, sd * ((ft(h) / 2) * lens(cf) + off)];
  for (const sd of [1, -1]) {
    const hs = [0.1, F.height * 0.97];
    const c0 = 1 - F.rudder;
    const cfs = [c0, c0 + (1 - c0) * 0.35, c0 + (1 - c0) * 0.7, 0.985];
    const list: { q: [V3, V3, V3, V3]; n: V3 }[] = [];
    for (let i = 0; i < cfs.length - 1; i++) {
      const q: [V3, V3, V3, V3] = [finPt(sd, hs[0], cfs[i], 0.015), finPt(sd, hs[0], cfs[i + 1], 0.015), finPt(sd, hs[1], cfs[i + 1], 0.015), finPt(sd, hs[1], cfs[i], 0.015)];
      list.push(quadToward(q, [Ly.fin.te, F.rootY + F.height / 2, sd * 10]));
    }
    place(quadsOf(list), fixed.shade);
    const w = 0.05 / F.rootChord;
    const hinge: [V3, V3, V3, V3] = [finPt(sd, hs[0], c0 - w, 0.03), finPt(sd, hs[0], c0 + w, 0.03), finPt(sd, hs[1], c0 + w, 0.03), finPt(sd, hs[1], c0 - w, 0.03)];
    place(quadsOf([quadToward(hinge, [Ly.fin.te, F.rootY + F.height / 2, sd * 10])]), fixed.dark);
  }
  const capRings = [0.93, 1].map((f) => f * F.height).map((h) => section(fle(h) - 0.02, fc(h) + 0.04, ft(h) + 0.04, (x, t) => [x, F.rootY + h, t]));
  place(loft(capRings), fixed.accent);
  // fairing where the stabilizers meet the fin tip
  const fairing = new THREE.SphereGeometry(1, low ? 10 : 16, low ? 6 : 10);
  fairing.scale(2.3, 0.45, 0.75).translate(A.stabilizerAnchor[0], Ly.fin.tipY, 0);
  place(fairing, fixed.accent);

  /* --------------------------------- 3. the mirrored halves (built once on +Z, mirrored by a group) */

  const wingBag = bag();
  const stabBag = bag();
  const engBag = bag();
  const gearHalf = bag();
  const boxes: Record<string, THREE.Box3> = {};

  // wing
  const W = S.wing;
  const wU = Ly.wing.U;
  const wPt = (u: number, cf: number, up: number, off = 0): V3 => [Ly.wing.le(u) + cf * Ly.wing.c(u), Ly.wing.y(u) + up * (Ly.wing.t(u) / 2) * lens(cf) + off * up, W.rootZ + u];
  {
    const steps = [0, 0.18, 0.42, 0.7, 1].map((f) => f * wU);
    const rings = steps.map((u) => section(Ly.wing.le(u), Ly.wing.c(u), Ly.wing.t(u), (x, h) => [x, Ly.wing.y(u) + h, W.rootZ + u]));
    place(loft(rings), wingBag.shade);
    const seam = (u0: number, u1: number, cf: number, w: number) => {
      const pt = (u: number, d: number) => wPt(u, cf + d / Ly.wing.c(u), 1, 0.02);
      place(quadsOf([quadToward([pt(u0, -w / 2), pt(u1, -w / 2), pt(u1, w / 2), pt(u0, w / 2)], [0, 50, 0])]), wingBag.dark);
    };
    const flap = [0.1 * wU, 0.52 * wU];
    const ail = [0.6 * wU, 0.92 * wU];
    seam(flap[0], flap[1], 0.74, 0.1);
    seam(ail[0], ail[1], 0.78, 0.1);
    for (const [u0, u1, cf] of [[flap[0], flap[1], 0.74], [ail[0], ail[1], 0.78]]) {
      for (const u of [u0, u1]) {
        const a = wPt(u, cf, 1, 0.02), b = wPt(u, 0.97, 1, 0.02);
        const w = 0.05;
        place(quadsOf([quadToward([[a[0], a[1], a[2] - w], [b[0], b[1], b[2] - w], [b[0], b[1], b[2] + w], [a[0], a[1], a[2] + w]], [0, 50, 0])]), wingBag.dark);
      }
    }
    // wing-root fairing (main gear sponson)
    const sponson = new THREE.SphereGeometry(1, low ? 12 : 20, low ? 8 : 12);
    sponson.scale(4.6, 0.9, 1.0).translate(A.mainGearAnchorRight[0], A.mainGearAnchorRight[1], S.gear.mainZ);
    place(sponson, wingBag.shade);
  }

  // engines on pylons under the wing
  {
    const NAC = S.engines.length;
    const pts: THREE.Vector2[] = [];
    [[0.62, 0], [0.74, 0.06], [0.88, 0.22], [0.97, 0.55], [0.99, 1.2], [0.97, 2.6], [0.86, 3.7], [0.7, 4.5], [0.58, NAC]].forEach(([r, y]) => pts.push(new THREE.Vector2(r, y)));
    const nac = new THREE.LatheGeometry(pts, low ? 12 : 20);
    nac.rotateZ(-Math.PI / 2);
    const fan = new THREE.CircleGeometry(0.64, low ? 12 : 20);
    fan.rotateY(Math.PI / 2).translate(0.22, 0, 0);
    const cone = new THREE.ConeGeometry(0.42, 1.1, low ? 8 : 12);
    cone.rotateZ(-Math.PI / 2).translate(NAC - 0.35, 0, 0);
    Ly.nacelles.forEach((n) => {
      const put = (g: THREE.BufferGeometry, to: THREE.BufferGeometry[]) => {
        const c = g.clone();
        c.translate(n.front, n.y, n.z);
        place(c, to);
      };
      put(nac, engBag.shade);
      put(fan, engBag.dark);
      put(cone, engBag.dark);
      // pylon: a thin swept fin from the top of the nacelle up to the wing's lower surface (its top touches it)
      const yBot = n.y + 0.75;
      const yTop = Ly.wing.under(n.u, pylonCF(n)) + 0.06;
      const pr = [0, 0.5, 1].map((f) => {
        const y = lerp(yBot, yTop, f);
        const le = lerp(n.front + 0.1, Ly.wing.le(n.u) + 0.9, f);
        return section(le, lerp(3.4, 5.2, f), lerp(0.32, 0.4, f), (x, h) => [x, y, n.z + h]);
      });
      place(loft(pr, false), engBag.shade);
    });
  }

  // horizontal stabilizer (T-tail): one half, mirrored
  const T = S.stab;
  const stU = T.halfSpan;
  const stc = (u: number) => lerp(T.rootChord, T.tipChord, u / stU);
  const stt = (u: number) => lerp(T.rootThick, T.tipThick, u / stU);
  const stle = (u: number) => Ly.st.rootLE - u * Math.tan(T.sweepDeg * deg);
  const sty = (u: number) => Ly.fin.tipY + u * Math.tan(T.dihedralDeg * deg);
  const sPt = (u: number, cf: number, up: number, off = 0): V3 => [stle(u) + cf * stc(u), sty(u) + up * (stt(u) / 2) * lens(cf) + off * up, u];
  {
    const rings = [0, 0.35, 0.7, 1].map((f) => f * stU).map((u) => section(stle(u), stc(u), stt(u), (x, h) => [x, sty(u) + h, u]));
    place(loft(rings), stabBag.shade);
    for (const up of [1, -1]) {
      const pt = (u: number, d: number) => sPt(u, 0.68 + d / stc(u), up, 0.015);
      const q: [V3, V3, V3, V3] = [pt(0.06 * stU, -0.04), pt(0.97 * stU, -0.04), pt(0.97 * stU, 0.04), pt(0.06 * stU, 0.04)];
      place(quadsOf([quadToward(q, [0, up * 50, 0])]), stabBag.dark);
    }
  }

  // landing gear: main gear on the right (mirrored), nose gear on the axis
  {
    const wheel = new THREE.CylinderGeometry(0.8, 0.8, 0.55, low ? 10 : 14);
    wheel.rotateX(Math.PI / 2);
    const strut = new THREE.BoxGeometry(0.26, 1, 0.26);
    const beam = new THREE.BoxGeometry(3.4, 0.2, 0.2);
    const yWheel = -R - 0.4; // the tyres touch the ground exactly as before (wheel bottom = -R - 1.2)
    const at = (g: THREE.BufferGeometry, x: number, y: number, z: number, to: THREE.BufferGeometry[], sy = 1) => {
      const c = g.clone();
      c.scale(1, sy, 1).translate(x, y + R, z); // the gear group pivots on the belly (y = -R)
      place(c, to);
    };
    const gx = A.mainGearAnchorRight[0];
    for (const x of [gx - 1.5, gx + 1.5]) for (const dz of [-0.45, 0.45]) at(wheel, x, yWheel, S.gear.mainZ + dz, gearHalf.dark);
    at(strut, gx, (A.mainGearAnchorRight[1] - 0.9 + yWheel) / 2, S.gear.mainZ, gearHalf.shade, 1.6);
    at(beam, gx, yWheel, S.gear.mainZ, gearHalf.shade);
    const nx = A.noseGearAnchor[0];
    for (const dz of [-0.4, 0.4]) at(wheel, nx, yWheel, dz, fixedGear.dark);
    at(strut, nx, (A.noseGearAnchor[1] + yWheel) / 2, 0, fixedGear.shade, 1.5);
  }

  /* ------------------------------------------------------ 4. side cargo door (swings up on a top hinge) */

  const doorBag = bag();
  const doorInnerGeo: THREE.BufferGeometry[] = [];
  const hingePos: V3 = [Ly.door.x, S.door.top, R * Math.sin(Ly.door.phiTop)];
  {
    const st: Station[] = [{ x: Ly.door.x1, yc: 0, r: R + 0.03 }, { x: Ly.door.x0, yc: 0, r: R + 0.03 }];
    const panel = shell(st, Ly.door.phiTop, Ly.door.phiSill);
    place(panel, doorBag.body);
    doorInnerGeo.push(plain(panel.clone()));
    const mid = (Ly.door.phiTop + Ly.door.phiSill) / 2;
    place(shell([{ x: Ly.door.x1 - 0.1, yc: 0, r: R + 0.035 }, { x: Ly.door.x0 + 0.1, yc: 0, r: R + 0.035 }], mid - 0.012, mid + 0.012), doorBag.dark);
  }

  /* ---------------------------------------------------------------- lights, assembly */

  const lightSphere = (c: THREE.Color, at: V3) => {
    const g = new THREE.SphereGeometry(0.26, 8, 6);
    g.translate(...at);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return plain(g);
  };
  const tipX = Ly.wing.le(wU) + Ly.wing.c(wU) * 0.45;
  const lights = mergeGeometries([
    lightSphere(new THREE.Color("#ff2d2d"), [tipX, Ly.wing.y(wU), -(W.rootZ + wU) - 0.1]), // port (left): red
    lightSphere(new THREE.Color("#25d366"), [tipX, Ly.wing.y(wU), W.rootZ + wU + 0.1]), // starboard (right): green
  ], false)!;

  const root = new THREE.Group();
  const addMerged = (parts: THREE.BufferGeometry[], mat: THREE.Material, parent: THREE.Object3D, shift?: V3) => {
    if (parts.length === 0) return;
    const g = mergeGeometries(parts, false)!;
    if (shift) g.translate(...shift);
    geos.push(g);
    triangles += g.attributes.position.count / 3;
    meshes++;
    parent.add(new THREE.Mesh(g, mat));
  };
  const addBag = (b: Bag, parent: THREE.Object3D, shift?: V3) => KEYS.forEach((k) => addMerged(b[k], M[k], parent, shift));
  const halves: { name: string; right: THREE.Group; left: THREE.Group }[] = [];
  /** Build one half once; the left half shares its geometry and is mirrored by scale.z = -1. */
  const mirrored = (b: Bag, name: string, parent: THREE.Object3D) => {
    const right = new THREE.Group();
    right.name = `${name}Right`;
    KEYS.forEach((k) => {
      if (b[k].length === 0) return;
      const g = mergeGeometries(b[k], false)!;
      geos.push(g);
      triangles += (g.attributes.position.count / 3) * 2; // drawn twice
      meshes += 2;
      right.add(new THREE.Mesh(g, M[k]));
    });
    const left = new THREE.Group();
    left.name = `${name}Left`;
    left.scale.z = -1;
    right.children.forEach((c) => left.add(new THREE.Mesh((c as THREE.Mesh).geometry, (c as THREE.Mesh).material)));
    parent.add(right, left);
    halves.push({ name, right, left });
    boxes[name] = boxOf(Object.values(b).flat());
  };

  addBag(fixed, root);
  addMerged([holdInner], inner, root);
  addMerged([lights], lightMat, root);
  mirrored(wingBag, "wing", root);
  mirrored(engBag, "engines", root);
  mirrored(stabBag, "stab", root);

  const gear = new THREE.Group();
  gear.position.y = -R;
  addBag(fixedGear, gear);
  mirrored(gearHalf, "gear", gear);
  root.add(gear);

  const hinge = new THREE.Group();
  hinge.position.set(...hingePos);
  addBag(doorBag, hinge, [-hingePos[0], -hingePos[1], -hingePos[2]]);
  addMerged(doorInnerGeo, inner, hinge, [-hingePos[0], -hingePos[1], -hingePos[2]]);
  root.add(hinge);

  // anchors (and, in debug mode, small axes on them)
  const anchors: Record<string, THREE.Object3D> = {};
  for (const [name, v] of Object.entries(A)) {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(...v);
    root.add(o);
    anchors[name] = o;
    if (debug) {
      const ax = new THREE.AxesHelper(1.4);
      o.add(ax);
      geos.push(ax.geometry);
    }
  }
  boxes.fuselage = new THREE.Box3(new THREE.Vector3(xAt(1), -R, -R), new THREE.Vector3(xAt(0), R, R));
  boxes.fin = boxOf(finRings.length ? [loft(finRings)] : []);

  return {
    root,
    anchors,
    boxes,
    halves,
    stats: { triangles: Math.round(triangles), meshes },
    setGear(e) {
      gear.scale.y = Math.max(0.001, e);
      gear.visible = e > 0.01;
    },
    setHatch(closed) {
      hinge.rotation.x = DOOR_OPEN * (1 - closed);
    },
    dispose() {
      geos.forEach((x) => x.dispose());
      mats.forEach((x) => x.dispose());
    },
  };
}
