/**
 * The "Shipped" chapter of the story: count, pack, load, fly, deliver. Everything here is a pure function of the
 * total scroll progress P (no clocks, no smoothing), so any jump in scroll draws the right frame at once.
 * This file is three-free (plain numbers) so UI code and tests can import it; JourneyScene turns it into meshes.
 *
 * Units: the same as the carton ("local" units, 1 = 10 cm). x right, y up, z toward the first camera. The camera and
 * every object live in one world that is placed by `frameFor`: its origin is the finished carton's centre at the end
 * of the "Made" chapter, so stage 7 hands over to stage 8 with nothing moving on screen.
 */
import { BOX_CM, SPLIT, STAGES, lin, seg } from "./making";

export type V3 = [number, number, number];

const range = (id: string) => {
  const s = STAGES.find((st) => st.id === id)!;
  return [s.from, s.to] as const;
};
export const R = { count: range("count"), pack: range("pack"), load: range("load"), fly: range("fly"), deliver: range("deliver") };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t;

/* ------------------------------------------------------------------ layout */

/** The finished folding carton (matches the dieline: W x H x D). */
export const BOX = { w: BOX_CM.l / 10, h: BOX_CM.h / 10, d: BOX_CM.w / 10 };
export const FLOOR_Y = -3.2;
/** Conveyor belt: runs along x, its top is where the standing carton's base was. */
export const BELT = { top: -BOX.h / 2, x0: -16, x1: 3.6, halfW: 3.5, thick: 0.35 };
export const LIE_Y = BELT.top + BOX.d / 2;
/** Corrugated master carton on the floor, opening up. Long side along z, so a loaded carton keeps its label to the camera. */
export const MASTER = { cx: 6.4, w: 2.6, l: 3.8, h: 1.9, wall: 0.05 };
export const MASTER_Y = FLOOR_Y + MASTER.h / 2;
/**
 * The cargo vehicle (a plane today). The stage logic only uses these numbers and the `Vehicle` interface of
 * CargoPlane.ts, so a cargo ship can replace the plane by providing the same spec and a new builder.
 * Parked nose-right with its aft hatch toward the loader; local origin = hatch centre on the vehicle's axis.
 */
export const VEHICLE = { parkX: 15, parkY: 1.1, R: 3.1, len: 30, holdLen: 24, floorY: -2.1, centerX: 15 };
export const HOUSE_X = 262;
export const HOUSE = { w: 14, h: 7.5, d: 9, doorX: 3 };
export const ROAD_Z = 10.5;
export const VAN_STOP_X = HOUSE_X - 8;

export const boxCount = (low: boolean) => (low ? 6 : 12);

/** Slot of box `k` on the belt once it has arrived: columns of 3 across the belt, front column first. */
export function beltSlot(k: number, n: number, out: V3 = [0, 0, 0]): V3 {
  const cols = n / 3;
  out[0] = ((cols - 1) * 1.5) / 2 - Math.floor(k / 3) * 1.5;
  out[1] = LIE_Y;
  out[2] = [0, -2.1, 2.1][k % 3];
  return out;
}

/** Slot of box `k` inside the master carton: 3 layers, `n/3` boxes per layer, lying flat. */
export function masterSlot(k: number, n: number, out: V3 = [0, 0, 0]): V3 {
  const per = n / 3;
  const layer = Math.floor(k / per);
  const j = k % per;
  out[0] = MASTER.cx + (per === 4 ? (j % 2 ? 0.6 : -0.6) : 0);
  out[1] = FLOOR_Y + MASTER.wall + BOX.d / 2 + layer * BOX.d;
  out[2] = per === 4 ? (j < 2 ? -0.9 : 0.9) : j ? 0.9 : -0.9;
  return out;
}

/* ------------------------------------------------------------- shared tools */

/**
 * Cardinal Hermite curve through keys [t, v0, v1, ...] (tangents from the neighbours, zero at both ends), written
 * into `out`. Used for the camera and for the plane's flight path. Allocation free.
 */
export function sampleKeys(keys: readonly (readonly number[])[], t: number, out: number[]): number[] {
  const n = keys.length;
  const dims = keys[0].length - 1;
  if (t <= keys[0][0]) {
    for (let d = 0; d < dims; d++) out[d] = keys[0][d + 1];
    return out;
  }
  if (t >= keys[n - 1][0]) {
    for (let d = 0; d < dims; d++) out[d] = keys[n - 1][d + 1];
    return out;
  }
  let i = 0;
  while (i < n - 2 && t >= keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const dt = b[0] - a[0];
  const u = (t - a[0]) / dt;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2;
  const h11 = u ** 3 - u ** 2;
  const p = i > 0 ? keys[i - 1] : null;
  const q = i + 2 < n ? keys[i + 2] : null;
  for (let d = 1; d <= dims; d++) {
    const ma = p ? (b[d] - p[d]) / (b[0] - p[0]) : 0;
    const mb = q ? (q[d] - a[d]) / (q[0] - a[0]) : 0;
    out[d - 1] = h00 * a[d] + h10 * dt * ma + h01 * b[d] + h11 * dt * mb;
  }
  return out;
}

/** The scene layout implied by the carton's end-of-"Made" placement. Must equal what CartonModel computes at p = 1. */
export interface Frame {
  fit: number;
  /** World position of the journey origin (the finished carton's centre). */
  x: number;
  y: number;
  /** Viewport (world units at distance camZ) and layout offsets (fractions of the viewport). */
  vw: number;
  vh: number;
  ox: number;
  oy: number;
  /** Fractions of the viewport the camera tries to fill. */
  fw: number;
  fh: number;
  aspect: number;
  tanHalf: number;
}

export interface LayoutParams {
  offsetX: number;
  offsetY: number;
  widthFrac: number;
  heightFrac: number;
}

export function frameFor(camZ: number, fovDeg: number, width: number, height: number, wideAspectLimit: number, wide: LayoutParams, narrow: LayoutParams, out: Frame): Frame {
  const aspect = width / height;
  const tanHalf = Math.tan((fovDeg * Math.PI) / 360);
  const vh = 2 * tanHalf * camZ;
  const vw = vh * aspect;
  const L = aspect > wideAspectLimit ? wide : narrow;
  const availW = vw * L.widthFrac;
  const availH = vh * L.heightFrac;
  const W = BOX.w;
  const H = BOX.h;
  // identical to CartonModel's fitBox (foldAmt = 1)
  const fit = Math.min(availW / (W * 2.2), availH / ((H + 0.9) * 1.12));
  out.fit = fit;
  out.x = vw * L.offsetX;
  out.y = vh * L.offsetY;
  out.vw = vw;
  out.vh = vh;
  out.ox = L.offsetX;
  out.oy = L.offsetY;
  // the journey fills the viewport more than the lone carton did
  out.fw = Math.min(0.94, Math.max(0.6, L.widthFrac * 1.6));
  out.fh = Math.min(0.9, Math.max(0.6, L.heightFrac * 1.15));
  out.aspect = aspect;
  out.tanHalf = tanHalf;
  return out;
}

/* -------------------------------------------------------------- lead carton */

export interface LeadPose {
  x: number;
  y: number;
  z: number;
  /** 0 = standing (as finished), 1 = lying flat with the print up. */
  lay: number;
  visible: boolean;
}

/** Pose of box 0, the finished carton from stage 7 (the real CartonModel). */
export function leadPose(P: number, n: number, out: LeadPose): LeadPose {
  const u8 = lin(P, R.count[0], R.count[1]);
  out.visible = P < R.pack[0] + (R.pack[1] - R.pack[0]) * 0.88;
  out.z = 0;
  if (P < R.pack[0]) {
    const slide = ease(lin(u8, 0.12, 0.5));
    const slot = beltSlot(0, n, TMP3);
    out.lay = ease(lin(u8, 0.1, 0.42));
    out.x = lerp(0, slot[0], slide);
    out.y = lerp(0, LIE_Y, ease(lin(u8, 0.1, 0.45)));
    out.z = lerp(0, slot[2], slide);
  } else {
    const p = packBoxPos(0, n, P, TMP3);
    out.lay = 1;
    out.x = p[0];
    out.y = p[1];
    out.z = p[2];
  }
  return out;
}
const TMP3: V3 = [0, 0, 0];
const TMP3B: V3 = [0, 0, 0];

/* ----------------------------------------------------------------- boxes */

const packStart = (k: number, n: number) => 0.07 + (k * 0.5) / (n - 1);
const PACK_DUR = 0.12;

/** Position of box k during the pack stage (and after: parked in the carton). */
function packBoxPos(k: number, n: number, P: number, out: V3): V3 {
  const u9 = lin(P, R.pack[0], R.pack[1]);
  const t = lin(u9, packStart(k, n), packStart(k, n) + PACK_DUR);
  const a = beltSlot(k, n, TMP3B);
  const b = masterSlot(k, n, out);
  const e = ease(t);
  const ax = a[0], ay = a[1], az = a[2];
  const hump = 1.7 * Math.sin(Math.PI * e);
  out[0] = lerp(ax, b[0], e);
  out[1] = lerp(ay, b[1], e) + hump;
  out[2] = lerp(az, b[2], e);
  return out;
}

/** Position of an instanced box (k >= 1), or null when it is not on screen. */
export function boxPos(k: number, n: number, P: number, out: V3): V3 | null {
  if (P >= R.pack[0] + (R.pack[1] - R.pack[0]) * 0.88) return null;
  if (P < R.pack[0]) {
    const u8 = lin(P, R.count[0], R.count[1]);
    const s = 0.22 + ((k - 1) * 0.5) / (n - 2);
    const t = lin(u8, s, s + 0.22);
    if (t <= 0) return null;
    const slot = beltSlot(k, n, out);
    out[0] = slot[0] - 13.5 * (1 - easeOut(t));
    return out;
  }
  return packBoxPos(k, n, P, out);
}

/** How far along the belt the surface has scrolled (texture offset in belt lengths). Only moves while boxes arrive. */
export function beltScroll(P: number): number {
  const u8 = lin(P, R.count[0], R.count[1]);
  return (u8 * 13.5) / 1.2; // texture repeats (1 repeat = 1.2 units); the boxes cover about 13.5 units while they arrive
}

/** 0..1 glow of the "checked" scanner arch: peaks as each box passes under it. */
export function scanGlow(P: number, n: number): number {
  if (P >= R.pack[0]) return 0;
  let g = 0;
  const u8 = lin(P, R.count[0], R.count[1]);
  for (let k = 1; k < n; k++) {
    const s = 0.22 + ((k - 1) * 0.5) / (n - 2);
    const t = lin(u8, s, s + 0.22);
    if (t <= 0 || t >= 1) continue;
    const x = beltSlot(k, n, TMP3)[0] - 13.5 * (1 - easeOut(t));
    g = Math.max(g, Math.exp(-(((x - SCAN_X) / 1.1) ** 2)));
  }
  return g;
}
export const SCAN_X = -6;

/* ------------------------------------------------------ master carton + load */

export interface CartonState {
  x: number;
  y: number;
  z: number;
  /** Pitch while riding the ramp (rotation about z). */
  rotZ: number;
  scale: number;
  visible: boolean;
  /** Flap opening angles (rad): minor flaps (short sides) and major flaps (long sides). */
  minor: number;
  major: number;
  /** 0..1 */
  tape: number;
  label: number;
}

const FLAP_OPEN = 2.2;
const RAMP = { x0: 9, x1: 15 };
/** World height of the hold floor (the loader ramp ends here). */
export const HOLD_FLOOR_Y = VEHICLE.parkY + VEHICLE.floorY; // -1.0
const HOLD_CARTON_Y = HOLD_FLOOR_Y + MASTER.h / 2;

export function masterState(P: number, out: CartonState): CartonState {
  const u9 = lin(P, R.pack[0], R.pack[1]);
  const open = ease(lin(u9, 0, 0.09));
  out.minor = FLAP_OPEN * open * (1 - ease(lin(u9, 0.72, 0.79)));
  out.major = FLAP_OPEN * open * (1 - ease(lin(u9, 0.79, 0.87)));
  out.tape = ease(lin(u9, 0.86, 0.93));
  out.label = ease(lin(u9, 0.92, 0.99));
  out.rotZ = 0;
  out.scale = 1;
  out.z = 0;
  out.visible = P > R.count[0] + 0.02 && P < R.deliver[0] + 0.03;
  if (P < R.load[0]) {
    out.x = MASTER.cx;
    out.y = MASTER_Y;
  } else if (P < R.deliver[0]) {
    const s = ease(lin(lin(P, R.load[0], R.load[1]), 0.04, 0.8));
    const x = lerp(MASTER.cx, 19.2, s);
    const ramp = lin(x, RAMP.x0, RAMP.x1); // linear: the carton follows the ramp surface
    out.x = x;
    out.y = lerp(MASTER_Y, HOLD_CARTON_Y, ramp);
    out.rotZ = 0.35 * ease(lin(x, RAMP.x0 - 0.5, RAMP.x0 + 0.5)) * (1 - ease(lin(x, RAMP.x1 - 0.5, RAMP.x1 + 0.5)));
    out.visible = P < R.load[1] - 0.003;
  } else {
    // delivered: from the van's rear to the doorstep, at half size (the house is big)
    const t = ease(lin(P, 0.962, 0.982));
    const x0 = VAN_STOP_X + 4.2;
    const x1 = HOUSE_X + HOUSE.doorX;
    out.scale = 0.5;
    out.x = lerp(x0, x1, t);
    out.y = lerp(FLOOR_Y + 2.3, FLOOR_Y + MASTER.h * 0.25, t) + 2.4 * Math.sin(Math.PI * t);
    out.z = lerp(ROAD_Z, HOUSE.d / 2 + 2.2, t);
    out.visible = P > 0.962;
    out.minor = 0;
    out.major = 0;
    out.tape = 1;
    out.label = 1;
  }
  return out;
}

/** Hatch of the plane: 0 = swung up and open, 1 = closed. */
export function hatchClosed(P: number): number {
  return ease(lin(lin(P, R.load[0], R.load[1]), 0.8, 0.97));
}

/* ----------------------------------------------------------------- plane */

export interface PlanePose {
  x: number;
  y: number;
  z: number;
  pitch: number;
  roll: number;
  yaw: number;
  /** 1 = gear down, 0 = retracted. */
  gear: number;
  visible: boolean;
}

// [u, x, y, z, pitch, roll, yaw] over the fly stage
const FLIGHT: number[][] = [
  [0, VEHICLE.parkX, VEHICLE.parkY, 0, 0, 0, 0],
  [0.15, 17.5, VEHICLE.parkY, 0, 0, 0, 0],
  [0.32, 33, VEHICLE.parkY, 0, 0, 0, 0],
  [0.44, 55, 1.5, 0, 0.12, 0, 0],
  [0.56, 85, 7.5, -1, 0.3, 0, 0.02],
  [0.72, 125, 22, -8, 0.24, 0.3, 0.18],
  [0.88, 160, 36, -25, 0.1, 0.12, 0.42],
  [1, 190, 41, -42, 0.04, 0, 0.55],
];
const FL = new Array(6).fill(0);

export function planePose(P: number, out: PlanePose): PlanePose {
  const u = lin(P, R.fly[0], R.fly[1]);
  sampleKeys(FLIGHT, u, FL);
  out.x = FL[0];
  out.y = FL[1];
  out.z = FL[2];
  out.pitch = FL[3];
  out.roll = FL[4];
  out.yaw = FL[5];
  out.gear = 1 - ease(lin(u, 0.46, 0.56));
  out.visible = P > R.load[0] - 0.01 && P < 0.945;
  return out;
}
const PP: PlanePose = { x: 0, y: 0, z: 0, pitch: 0, roll: 0, yaw: 0, gear: 1, visible: true };

/* ------------------------------------------------------------------- van */

export function vanState(P: number, out: { x: number; visible: boolean }) {
  const t = easeOut(lin(P, 0.942, 0.972));
  out.x = lerp(HOUSE_X + 78, VAN_STOP_X, t);
  out.visible = P > 0.935;
  return out;
}

/* ----------------------------------------------------------- environment */

/** 0..1: how much of the sky and ground replaces the plain page background. */
export const skyAmount = (P: number) => ease(lin(P, 0.79, 0.84));
/** 0 = day, 1 = dusk. */
export const duskAmount = (P: number) => ease(lin(P, 0.86, 0.97));
/** Clouds slide apart as the camera comes down, so the village shows through. */
export const cloudsParted = (P: number) => ease(lin(P, 0.935, 0.975));
/** 0..1 progress of the dotted route and of the plane marker on the map. */
export const routeAmount = (P: number) => lin(P, 0.845, 0.955);
export const mapAmount = (P: number) => ease(lin(P, 0.835, 0.855));
/** The pin pulses once when the carton is placed. */
export const pinPulse = (P: number) => lin(P, 0.978, 0.995);

/* ---------------------------------------------------------------- camera */

/** Camera key: [P, subjectX, subjectY, subjectZ, azimuth, elevation, extentW, extentH]. extent <= 0 marks "use the first-frame distance". */
type CamKey = [number, number, number, number, number, number, number, number];

const planeC = (P: number, dx = 0, dy = 0, dz = 0): [number, number, number] => {
  planePose(P, PP);
  return [PP.x + VEHICLE.centerX + dx, PP.y + dy, PP.z + dz];
};
const k = (P: number, s: [number, number, number], az: number, el: number, w: number, h: number): CamKey => [P, s[0], s[1], s[2], az, el, w, h];

const CAM_KEYS: CamKey[] = [
  [SPLIT, 0, 0, 0, 0, 0, -1, -1], // exactly the "Made" camera
  k(0.618, [0, -0.5, 0], -0.2, 0.3, 9.5, 6.2),
  k(0.665, [0.2, -0.6, 0], -0.3, 0.5, 8.8, 5.8),
  k(0.7, [3.4, -1.7, 0], -0.3, 0.42, 14, 7.6),
  k(0.745, [3.6, -1.5, 0], -0.32, 0.3, 14, 7.6),
  k(0.77, [5.8, -1.4, 0], -0.4, 0.24, 14.5, 7.8),
  k(0.805, [11.5, -1.0, 0], -0.55, 0.2, 18, 9.5),
  k(0.835, [18, 0.4, 0], -0.55, 0.16, 26, 12.5),
  // the subject sits a little above the plane, so the plane rides in the lower middle of the view, clear of the map
  k(0.86, planeC(0.86, 1, 3), -0.45, 0.12, 52, 25),
  k(0.89, planeC(0.89, 2, 4), -0.38, 0.1, 58, 28),
  k(0.915, planeC(0.915, 3, 5), -0.3, 0.09, 64, 31),
  k(0.935, planeC(0.935, 6, 5), -0.22, 0.12, 70, 34),
  k(0.955, [HOUSE_X - 22, 16, 6], -0.18, 0.3, 62, 30),
  k(0.975, [HOUSE_X - 5, 1.5, 5], -0.15, 0.2, 40, 18),
  k(1, [HOUSE_X - 2, 0.2, 4.5], -0.1, 0.17, 31, 14.5),
];

export interface CamPose {
  /** Camera position and look-at target in journey-local units. */
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
  /** Camera distance to the subject, local units. */
  dist: number;
}

const CK: number[][] = CAM_KEYS.map((c) => [c[0], 0, 0, 0, 0, 0, 0]);
const CS = new Array(6).fill(0);

/** Camera pose for progress P (journey-local, before the layout offset is applied by the caller). */
export function cameraPose(P: number, f: Frame, camZ: number, out: CamPose): CamPose {
  const tan = f.tanHalf;
  for (let i = 0; i < CAM_KEYS.length; i++) {
    const c = CAM_KEYS[i];
    const row = CK[i];
    row[1] = c[1];
    row[2] = c[2];
    row[3] = c[3];
    row[4] = c[4];
    row[5] = c[5];
    // distance that makes the key's extent fill the layout fraction of the viewport (aspect aware)
    row[6] = c[6] < 0 ? camZ / f.fit : Math.max(c[7] / (2 * tan * f.fh), c[6] / (2 * tan * f.aspect * f.fw));
  }
  sampleKeys(CK, P, CS);
  const [sx, sy, sz, az, el, dist] = CS;
  const cosEl = Math.cos(el);
  let dx = Math.sin(az) * cosEl;
  let dy = Math.sin(el);
  let dz = Math.cos(az) * cosEl;
  // camera right and up vectors (forward = -d)
  const rx = Math.cos(az);
  const rz = -Math.sin(az);
  const ux = -Math.sin(az) * Math.sin(el);
  const uy = cosEl;
  const uz = -Math.cos(az) * Math.sin(el);
  // layout offset: the subject sits at (ox, oy) of the viewport, like the carton did in the "Made" chapter
  const wd = 2 * tan * dist * f.aspect;
  const hd = 2 * tan * dist;
  const shx = -f.ox * wd;
  const shy = -f.oy * hd;
  const mx = rx * shx + ux * shy;
  const my = uy * shy;
  const mz = rz * shx + uz * shy;
  dx *= dist;
  dy *= dist;
  dz *= dist;
  out.tx = sx + mx;
  out.ty = sy + my;
  out.tz = sz + mz;
  out.px = out.tx + dx;
  out.py = out.ty + dy;
  out.pz = out.tz + dz;
  out.dist = dist;
  return out;
}

export { easeIn, easeOut, ease, lerp, seg };
