import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Box with slightly beveled edges. `detail` 0 (low tier) returns a plain box.
 * The material-group order matches BoxGeometry, so per-face materials still work.
 */
export function rbox(w: number, h: number, d: number, detail: 0 | 1 | 2, radius = 0.012) {
  if (detail === 0) return new THREE.BoxGeometry(w, h, d);
  const r = Math.max(0.002, Math.min(radius, Math.min(w, h, d) / 2 - 0.001));
  return new RoundedBoxGeometry(w, h, d, detail === 2 ? 3 : 2, r);
}
