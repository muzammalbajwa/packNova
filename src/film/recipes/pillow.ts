import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { RecipeCtx, RecipeInstance } from "../types";
import { Pool, PI2, blobShadow, fitDistance, lerp, lin, orbit, seg, sheetTexture, skinMats, steel } from "../kit";

const N = 6; // print, die-cut, curl, glue, close (curved sides, then crimped ends), pack
const NU = 52;
const NV = 44;
const tmpM = new THREE.Matrix4();
const tmpP = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const sp = (x: number, e: number) => (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), e);

/**
 * Pillow carton. One printed sheet is die-cut, curls round into a tube (the seam stays open a little), the seam is glued,
 * then it closes in two moves: the sides curve in to the pillow shape, then both ends are pressed flat along an arched crimp line.
 * The sheet is a grid whose vertices are written every frame from the progress (no allocation); flat and tube positions blend.
 */
export function createPillow({ skin, low }: RecipeCtx): RecipeInstance {
  const pool = new Pool();
  const k = 1.7 / Math.max(...skin.ratio);
  const L = skin.ratio[0] * k;
  const D = skin.ratio[1] * k; // width of the pillow
  const H = skin.ratio[2] * k; // thickness
  const a = D / 2;
  const b = H / 2;
  const Cs = 1.04 * Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); // length of the sheet around the tube
  const cl = L * 0.2; // crimp length

  const art = { SW: L, SH: Cs, fronts: [{ x: L * 0.14, y: Cs * 0.3, w: L * 0.72, h: Cs * 0.4 }], sides: [] as never[] };
  const mats = skinMats(pool, skin, sheetTexture(pool, skin, art, false, low), sheetTexture(pool, skin, art, true, low));
  mats.outer.side = THREE.FrontSide;
  const backMat = pool.add(new THREE.MeshStandardMaterial({ color: mats.inner.color, roughness: 0.9, side: THREE.BackSide }));

  const vn = (NU + 1) * (NV + 1);
  const pos = new Float32Array(vn * 3);
  const nor = new Float32Array(vn * 3);
  const uv = new Float32Array(vn * 2);
  const idx: number[] = [];
  for (let iv = 0; iv <= NV; iv++)
    for (let iu = 0; iu <= NU; iu++) {
      const i = iv * (NU + 1) + iu;
      uv[i * 2] = iu / NU;
      uv[i * 2 + 1] = iv / NV;
      if (iu < NU && iv < NV) {
        const p0 = i, p1 = i + 1, p2 = i + NU + 1, p3 = i + NU + 2;
        idx.push(p0, p1, p2, p1, p3, p2);
      }
    }
  const geo = pool.add(new THREE.BufferGeometry());
  const pAttr = new THREE.BufferAttribute(pos, 3);
  pAttr.setUsage(THREE.DynamicDrawUsage);
  const nAttr = new THREE.BufferAttribute(nor, 3);
  nAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", pAttr);
  geo.setAttribute("normal", nAttr);
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(L, Cs));

  const root = new THREE.Group();
  const sheet = new THREE.Group();
  root.add(sheet);
  const front = new THREE.Mesh(geo, mats.outer);
  const back = new THREE.Mesh(geo, backMat);
  front.frustumCulled = back.frustumCulled = false;
  sheet.add(front, back);

  // waste: a border around the sheet that the die cuts away (one merged mesh)
  const m = 0.2;
  const blank = pool.add(new THREE.MeshStandardMaterial({ color: skin.base, roughness: 0.9 }));
  const strips = [
    new THREE.BoxGeometry(L + 2 * m, m, 0.012).translate(0, Cs / 2 + m / 2, -0.007),
    new THREE.BoxGeometry(L + 2 * m, m, 0.012).translate(0, -Cs / 2 - m / 2, -0.007),
    new THREE.BoxGeometry(m, Cs, 0.012).translate(-L / 2 - m / 2, 0, -0.007),
    new THREE.BoxGeometry(m, Cs, 0.012).translate(L / 2 + m / 2, 0, -0.007),
  ];
  const waste = new THREE.Mesh(pool.add(mergeGeometries(strips)), blank);
  strips.forEach((g) => g.dispose());
  root.add(waste);
  const bar = pool.add(new THREE.BoxGeometry(1, 1, 1));
  const knife = new THREE.InstancedMesh(bar, steel(pool, "#6c7378"), 4);
  const put = (i: number, x: number, y: number, sx: number, sy: number) => { tmpM.makeScale(sx, sy, 0.08).setPosition(x, y, 0.04); knife.setMatrixAt(i, tmpM); };
  put(0, 0, Cs / 2, L, 0.02); put(1, 0, -Cs / 2, L, 0.02); put(2, -L / 2, 0, 0.02, Cs); put(3, L / 2, 0, 0.02, Cs);
  knife.frustumCulled = false;
  root.add(knife);
  const roller = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(0.06, 0.06, Cs * 1.12, 24)), steel(pool));
  roller.position.z = 0.18;
  root.add(roller);
  const bead = new THREE.Mesh(pool.add(new THREE.BoxGeometry(L * 0.96, 0.02, 0.02)), pool.add(new THREE.MeshStandardMaterial({ color: "#f6e7a8", roughness: 0.4 })));
  root.add(bead);

  const faceMat = pool.add(new THREE.MeshStandardMaterial({ color: skin.base, roughness: 0.8 }));
  const others = new THREE.InstancedMesh(pool.add(new THREE.SphereGeometry(0.5, 20, 12)), faceMat, 5);
  others.frustumCulled = false;
  root.add(others);
  const shadow = blobShadow(pool);
  root.add(shadow);
  const shadowMat = shadow.material as THREE.MeshBasicMaterial;
  void PI2;

  /** Writes all vertex positions and normals for the current curl, seam gap, side curve and crimp. */
  const shape = (curl: number, gap: number, side: number, crimp: number) => {
    const n = lerp(4, 2, side);
    const e = 2 / n;
    for (let iv = 0; iv <= NV; iv++) {
      const v = iv / NV;
      const th = (v - 0.5) * Math.PI * 2 * (1 - gap);
      const c = Math.cos(th);
      const s = Math.sin(th);
      const ez = a * sp(c, e);
      const eyBase = b * sp(s, e);
      const w = ez / a;
      for (let iu = 0; iu <= NU; iu++) {
        const xs = (iu / NU - 0.5) * L;
        const xc = L / 2 - cl * (1 - 0.5 * w * w); // arched crimp line
        const d = Math.min(1, Math.max(0, (Math.abs(xs) - xc) / (cl * 0.55)));
        const flat = crimp * d * d * (3 - 2 * d);
        const ey = eyBase * (1 - flat);
        const i = (iv * (NU + 1) + iu) * 3;
        pos[i] = xs;
        pos[i + 1] = lerp((v - 0.5) * Cs, ey, curl);
        pos[i + 2] = lerp(0, ez, curl);
      }
    }
    for (let iv = 0; iv <= NV; iv++)
      for (let iu = 0; iu <= NU; iu++) {
        const i = iv * (NU + 1) + iu;
        const ua = iv * (NU + 1) + Math.min(NU, iu + 1), ub = iv * (NU + 1) + Math.max(0, iu - 1);
        const va = Math.min(NV, iv + 1) * (NU + 1) + iu, vb = Math.max(0, iv - 1) * (NU + 1) + iu;
        const tux = pos[ua * 3] - pos[ub * 3], tuy = pos[ua * 3 + 1] - pos[ub * 3 + 1], tuz = pos[ua * 3 + 2] - pos[ub * 3 + 2];
        const tvx = pos[va * 3] - pos[vb * 3], tvy = pos[va * 3 + 1] - pos[vb * 3 + 1], tvz = pos[va * 3 + 2] - pos[vb * 3 + 2];
        let nx = tuy * tvz - tuz * tvy, ny = tuz * tvx - tux * tvz, nz = tux * tvy - tuy * tvx;
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l;
        nor[i * 3] = nx; nor[i * 3 + 1] = ny; nor[i * 3 + 2] = nz;
      }
    pAttr.needsUpdate = true;
    nAttr.needsUpdate = true;
  };

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t0 = lin(p, 0, 1 / N);
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 4 / N);
    const t4 = lin(p, 4 / N, 5 / N);
    const t5 = lin(p, 5 / N, 1);

    const rv = lin(t0, 0.04, 0.94);
    const rx = lerp(-L / 2 - m - 0.4, L / 2 + m + 0.4, seg(rv, 0, 1));
    mats.uReveal.value = p >= 1 / N ? 1 : Math.min(1, Math.max(0, (rx + L / 2) / L));
    const printing = p > 0 && p < 1 / N && rv > 0 && rv < 1;
    mats.uScan.value = printing ? 1 : 0;
    roller.visible = printing;
    roller.position.x = rx;
    // reveal is along texture u (= x), the same direction the roller travels

    const press = seg(t1, 0, 0.3);
    knife.visible = p >= 1 / N && p < 2 / N && press > 0.001 && t1 < 0.8;
    knife.position.z = (1 - press) * 1.1 - seg(t1, 0.5, 0.8) * 1.1;
    const drop = seg(t1, 0.55, 1);
    waste.visible = p < 2 / N;
    waste.position.set(0, -drop * 5, drop * 0.6);
    waste.rotation.z = drop * 0.35;

    const curl = seg(t2, 0.05, 0.95);
    const gap = p >= 3 / N ? lerp(0.1, 0, seg(t3, 0.35, 0.85)) : 0.1;
    const side = seg(t4, 0.02, 0.5);
    const crimp = seg(t4, 0.5, 0.98);
    shape(curl, gap, side, crimp);
    bead.visible = p >= 2 / N && p < 4 / N + 0.01 && t3 < 0.9;
    bead.position.set(0, -b * 0.0 - (1 - curl) * 0, -a);
    bead.position.y = lerp(-Cs / 2, 0, curl);
    bead.position.z = lerp(0.01, -a * 0.98, curl);

    // pack: a few more pillows around the one you watched
    for (let i = 0; i < 5; i++) {
      const s = seg(t5, 0.12 + 0.1 * i, 0.4 + 0.1 * i);
      tmpP.set((i % 2 ? 1 : -1) * L * 0.95, -0.0, (i < 2 ? 1 : -1) * 0.0 + (i - 2) * D * 0.9);
      tmpP.y = (1 - s) * 0.9;
      tmpS.set(L * 0.98, H * 0.9, D).multiplyScalar(Math.max(s, 0.0001));
      tmpM.compose(tmpP, tmpQ, tmpS);
      others.setMatrixAt(i, tmpM);
    }
    others.instanceMatrix.needsUpdate = true;
    others.visible = p >= 5 / N + 0.01;
    shadow.position.set(0, -b - 0.02, 0);
    shadow.scale.set(L * 1.7, D * 2.4, 1);
    shadowMat.opacity = curl;
    shadow.visible = curl > 0.05;

    const dFlat = fitDistance(cam, L + 2 * m, Cs + 2 * m, 1.06);
    const dTube = fitDistance(cam, L * 1.5, Math.max(H * 2.4, D * 1.8), 1.1);
    const dPack = fitDistance(cam, L * 3.4, D * 3.8, 1.0);
    const s2 = seg(p, 2 / N - 0.01, 3 / N);
    const dist = lerp(lerp(dFlat, dTube, s2), dPack, seg(t5, 0.05, 0.7));
    const yaw = lerp(0, 0.45, s2) + lerp(0, 0.4, seg(t4, 0, 1)) + t5 * 0.2;
    const pitch = lerp(0.02, 0.32, s2) + t5 * 0.15;
    orbit(cam, 0, 0, 0, dist, yaw, pitch);
  };

  return { root, update, dispose: () => { pool.dispose(); others.dispose(); knife.dispose(); } };
}
