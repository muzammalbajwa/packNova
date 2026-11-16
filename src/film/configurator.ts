import * as THREE from "three";
import { TYPE_BY_ID, boxSkin, previewRatio, type BoxConfig } from "@/lib/box";
import { RECIPE_LOADERS } from "./loaders";
import { lerp, orbit, seg } from "./kit";
import type { RecipeInstance } from "./types";

export interface Preview {
  instance: RecipeInstance;
  /** Rotate by a drag (radians); clamped, damped. */
  nudge(dyaw: number, dpitch: number): void;
  resetView(): void;
  /** Instant, cheap feedback while a size slider moves: scales the built model; the exact rebuild follows after a pause. */
  scaleHint(r: [number, number, number]): void;
}

export type LabelFn = (i: number, xPct: number, yPct: number, on: boolean) => void;

const fwd = new THREE.Vector3();
const tgt = new THREE.Vector3();
const pt = new THREE.Vector3();
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * The configurator's 3D box: one of the film recipes (the same geometry and materials as the product pages), driven by a
 * fold amount (0 = the flat cut sheet, 1 = the finished product) instead of the page scroll. The recipe scripts its own
 * camera for the film; here that camera is read into a spare camera and replaced by a user-controlled orbit around the same
 * target and distance, so a drag turns the box and the fold slider still frames it.
 */
export async function createPreview(c: BoxConfig, o: { low: boolean; logo?: CanvasImageSource; reduced: boolean; request: () => void; labels: LabelFn }): Promise<Preview> {
  const t = TYPE_BY_ID[c.type];
  const mod = await RECIPE_LOADERS[t.recipe]!();
  const skin = boxSkin(c, o.logo);
  const inner = mod.default({ skin, steps: [], low: o.low });
  const root = new THREE.Group();
  root.add(inner.root);
  const spare = new THREE.PerspectiveCamera();
  const r0 = previewRatio(c);
  const m0 = Math.max(...r0);
  const k = 1.7 / m0;
  const dim: [number, number, number] = [r0[0] * k, r0[1] * k, r0[2] * k]; // current half-sizes x2: L (x), W (z), H (y)
  let yaw = 0, pitch = 0, yawT = 0, pitchT = 0;

  const update = (s: number, cam: THREE.PerspectiveCamera) => {
    if (spare.aspect !== cam.aspect || spare.fov !== cam.fov) {
      spare.aspect = cam.aspect;
      spare.fov = cam.fov;
      spare.updateProjectionMatrix();
    }
    inner.update(lerp(t.unfold[0], t.unfold[1], s), spare);
    // where the recipe looks, and how far away it stands
    spare.getWorldDirection(fwd);
    const dist = Math.max(0.5, -spare.position.dot(fwd));
    tgt.copy(fwd).multiplyScalar(dist).add(spare.position);
    if (o.reduced) { yaw = yawT; pitch = pitchT; }
    else {
      yaw += (yawT - yaw) * 0.2;
      pitch += (pitchT - pitch) * 0.2;
      if (Math.abs(yawT - yaw) > 0.0008 || Math.abs(pitchT - pitch) > 0.0008) o.request();
    }
    const a = seg(s, 0, 0.45);
    orbit(cam, tgt.x, tgt.y, tgt.z, dist * 1.22, lerp(0.04, 0.55, a) + yaw, lerp(0.03, 0.32, a) + pitch); // a little wider than the film: room for the labels
    // dimension labels: three points on the finished box, projected to the screen (drawn as CSS by the page)
    cam.updateMatrixWorld();
    const on = s > 0.82;
    const hx = dim[0] / 2, hy = dim[2] / 2, hz = dim[1] / 2;
    const put = (i: number, x: number, y: number, z: number) => {
      pt.set(x, y, z).project(cam);
      o.labels(i, (pt.x * 0.5 + 0.5) * 100, (-pt.y * 0.5 + 0.5) * 100, on && pt.z < 1);
    };
    put(0, 0, -hy, hz);
    put(1, hx, -hy, 0);
    put(2, hx, 0, hz);
  };

  return {
    instance: { root, update, dispose: () => inner.dispose() },
    nudge(dy, dp) {
      yawT = clamp(yawT + dy, -1.3, 1.3);
      pitchT = clamp(pitchT + dp, -0.3, 0.8);
      o.request();
    },
    resetView() {
      yawT = pitchT = 0;
      o.request();
    },
    scaleHint(r) {
      const m = Math.max(...r);
      const f = (i: number) => r[i] / m / (r0[i] / m0);
      root.scale.set(f(0), f(2), f(1));
      dim[0] = (r[0] / m) * 1.7;
      dim[1] = (r[1] / m) * 1.7;
      dim[2] = (r[2] / m) * 1.7;
      o.request();
    },
  };
}
