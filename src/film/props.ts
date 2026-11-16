import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PropKind, Skin } from "@/content/catalog";
import { Pool, seg } from "./kit";

/**
 * Seasonal props for the event skins (Halloween, Christmas, Thanksgiving, New Year, anniversary).
 * Simple procedural shapes only: a pumpkin is a squashed sphere with a stem, a bat is a flat silhouette, and so on.
 * Each kind is ONE InstancedMesh (one draw call), so a page with three kinds of props adds three draw calls.
 * `update(a, t)` is a pure function: `a` (0..1) is how much of the props have arrived, `t` is the film progress (for slow spin).
 */
export interface PropArea {
  /** Half the width the props may spread over. */
  halfX: number;
  /** z of the front edge of the product; props sit in front of it. */
  zFront: number;
  /** y of the floor, relative to the group origin. */
  floor: number;
  /** y of the top of the product. */
  top: number;
}

export interface Props {
  root: THREE.Group;
  update(a: number, t: number): void;
}

const tM = new THREE.Matrix4();
const tP = new THREE.Vector3();
const tQ = new THREE.Quaternion();
const tS = new THREE.Vector3();
const tE = new THREE.Euler();

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

function paint(g: THREE.BufferGeometry, c: THREE.ColorRepresentation) {
  const col = new THREE.Color(c);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a[i * 3] = col.r;
    a[i * 3 + 1] = col.g;
    a[i * 3 + 2] = col.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}

function polygon(pts: [number, number][]) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  return s;
}

function batGeometry() {
  const half: [number, number][] = [[0.0, 0.08], [0.04, 0.15], [0.07, 0.09], [0.12, 0.09], [0.28, 0.15], [0.4, 0.04], [0.31, 0.0], [0.27, -0.09], [0.18, -0.02], [0.1, -0.1], [0.05, -0.05], [0.0, -0.1]];
  const right = half;
  const left = half.slice(1, -1).reverse().map(([x, y]) => [-x, y] as [number, number]);
  return paint(new THREE.ShapeGeometry(polygon([...right, ...left])), "#1c1a18");
}

function starGeometry(color: THREE.ColorRepresentation) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.075 : 0.2;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return paint(new THREE.ShapeGeometry(polygon(pts)), color);
}

function snowflakeGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.BoxGeometry(0.38, 0.03, 0.01);
    b.rotateZ((i * Math.PI) / 3);
    parts.push(paint(b, "#9db6c6"));
    const tick = new THREE.BoxGeometry(0.12, 0.022, 0.01);
    for (const s of [-1, 1]) {
      const a = tick.clone();
      a.translate(s * 0.13, 0, 0);
      a.rotateZ((i * Math.PI) / 3);
      parts.push(paint(a, "#9db6c6"));
    }
    tick.dispose();
  }
  const c = new THREE.CircleGeometry(0.045, 6);
  parts.push(paint(c, "#9db6c6"));
  const g = mergeGeometries(parts)!;
  for (const p of parts) p.dispose();
  return g;
}

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.17, 0.13, 0, 0.36);
  s.quadraticCurveTo(-0.17, 0.13, 0, 0);
  const blade = paint(new THREE.ShapeGeometry(s), "#ffffff");
  const stem = new THREE.BoxGeometry(0.02, 0.09, 0.004);
  stem.translate(0, -0.04, 0);
  return mergeGeometries([blade, paint(stem, "#ffffff")])!;
}

function pumpkinGeometry() {
  const body = new THREE.SphereGeometry(0.2, 14, 10);
  body.scale(1, 0.82, 1);
  const stem = new THREE.CylinderGeometry(0.025, 0.04, 0.09, 6);
  stem.translate(0, 0.17, 0);
  return mergeGeometries([paint(body, "#e0701c"), paint(stem, "#4d5a2a")])!;
}

interface Kind {
  mesh: THREE.InstancedMesh;
  kind: PropKind;
  n: number;
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  s: Float32Array;
}

const COUNT: Partial<Record<PropKind, number>> = { pumpkin: 3, bat: 4, star: 3, snowflake: 4, leaf: 8, confetti: 28 };
const ORDER: PropKind[] = ["pumpkin", "bat", "star", "snowflake", "leaf", "confetti"];

/** Returns null when the skin has no props that a film can show (ribbon and bow are built by the rigid-box recipe itself). */
/** `low`: weak devices get fewer confetti pieces and leaves (the other props are only a handful). */
export function createProps(pool: Pool, skin: Skin, area: PropArea, low = false): Props | null {
  const kinds = ORDER.filter((k) => skin.props.includes(k));
  if (!kinds.length) return null;
  const root = new THREE.Group();
  const mat = pool.add(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide }));
  const list: Kind[] = [];
  const confettiColors = [skin.second, skin.accent, "#e8e2d0", "#c9622a", "#3f7a52"];

  kinds.forEach((kind, ki) => {
    const n = low ? Math.max(2, Math.ceil(COUNT[kind]! * 0.5)) : COUNT[kind]!;
    const geo =
      kind === "bat" ? batGeometry() : kind === "star" ? starGeometry("#ffffff") : kind === "snowflake" ? snowflakeGeometry() : kind === "leaf" ? leafGeometry() : kind === "pumpkin" ? pumpkinGeometry() : paint(new THREE.PlaneGeometry(0.06, 0.1), "#ffffff");
    pool.add(geo);
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    mesh.frustumCulled = false;
    pool.add(mesh);
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    const z = new Float32Array(n);
    const s = new Float32Array(n);
    const col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const j = hash(i, ki + 1);
      const j2 = hash(i, ki + 11);
      const ground = kind === "pumpkin" || kind === "leaf";
      x[i] = (u * 2 - 1) * area.halfX * (ground ? 0.95 : 1.1) + (j - 0.5) * 0.25;
      if (ground) {
        z[i] = area.zFront + 0.1 + ((i * 7) % 3) * 0.2 + j2 * 0.15;
        y[i] = area.floor + (kind === "pumpkin" ? 0.165 : 0.004 + i * 0.0007);
      } else if (kind === "confetti") {
        z[i] = (j2 - 0.3) * (area.zFront + 0.6);
        y[i] = area.floor + 0.25 + j * (area.top - area.floor + 1.2);
      } else {
        z[i] = area.zFront * 0.5 + j2 * 0.5;
        y[i] = area.top + 0.35 + j * 0.8;
      }
      s[i] = (kind === "pumpkin" ? 0.85 + j * 0.45 : kind === "confetti" ? 0.8 + j2 * 0.7 : 0.8 + j * 0.5) * 1.5;
      if (kind === "leaf") col.set(["#c9622a", "#b9852f", "#8a3b1c", "#d9741f"][i % 4]);
      else if (kind === "confetti") col.set(confettiColors[i % confettiColors.length]);
      else if (kind === "star") col.set(skin.second);
      else col.set("#ffffff");
      if (kind === "leaf" || kind === "confetti" || kind === "star") mesh.setColorAt(i, col);
    }
    root.add(mesh);
    list.push({ mesh, kind, n, x, y, z, s });
  });

  const update = (a: number, t: number) => {
    root.visible = a > 0.001;
    if (!root.visible) return;
    for (const k of list) {
      for (let i = 0; i < k.n; i++) {
        const e = seg(a, (i / k.n) * 0.55, (i / k.n) * 0.55 + 0.45);
        let x = k.x[i];
        let y = k.y[i];
        const z = k.z[i];
        let sx = k.s[i] * Math.max(e, 0.0001);
        const sy = sx;
        let rx = 0;
        let ry = 0;
        let rz = 0;
        switch (k.kind) {
          case "pumpkin":
            y += (1 - e) * 1.4;
            ry = i * 1.7;
            break;
          case "bat":
            y += Math.sin(t * 40 + i * 1.9) * 0.035 + (1 - e) * 0.8;
            rz = Math.sin(t * 28 + i) * 0.16 + (i % 2 ? 0.25 : -0.25);
            sx *= 0.85 + 0.3 * Math.sin(t * 70 + i * 1.7);
            break;
          case "star":
            y += Math.sin(t * 36 + i * 2.1) * 0.03 + (1 - e) * 1.0;
            ry = Math.sin(t * 14 + i * 1.7) * 0.55; // sways, never edge-on
            rz = Math.sin(t * 9 + i) * 0.12;
            break;
          case "snowflake":
            y += (1 - e) * 1.3 + Math.sin(t * 30 + i) * 0.02;
            x += Math.sin(t * 22 + i) * 0.04;
            rz = t * 7 + i;
            break;
          case "leaf":
            y += (1 - e) * 1.6;
            x += Math.sin((1 - e) * 6 + i) * 0.15 * (1 - e);
            rx = -Math.PI / 2 + (1 - e) * 1.2;
            rz = i * 2.3 + (1 - e) * 2;
            break;
          case "confetti":
            y += (1 - e) * 1.8;
            rx = t * 20 + i;
            ry = t * 14 + i * 2;
            rz = i;
            break;
        }
        tE.set(rx, ry, rz);
        tQ.setFromEuler(tE);
        tP.set(x, y, z);
        tS.set(sx, sy, sx);
        tM.compose(tP, tQ, tS);
        k.mesh.setMatrixAt(i, tM);
      }
      k.mesh.instanceMatrix.needsUpdate = true;
    }
  };
  return { root, update };
}
