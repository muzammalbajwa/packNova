import * as THREE from "three";
import type { RecipeCtx, RecipeFactory } from "../types";
import { Pool, PI2, blobShadow, fitDistance, lerp, lin, orbit, seg, sheetTexture, skinMats, steel } from "../kit";

const N = 6; // film roll, print, seal, zipper, fill, final seal
const SX = 12; // grid of the film panels
const SY = 18;
const tM = new THREE.Matrix4();
const tP = new THREE.Vector3();
const tQ = new THREE.Quaternion();
const tS = new THREE.Vector3();

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Pouch (stand-up foil pouch or flat poly mailer): film off a roll, printed, two panels sealed on three sides, a zipper
 * (or peel-and-seal strip) added, the pouch opened and filled so it swells, then the top is sealed shut.
 * The two panels are grids whose depth is a pure function of (inflate, open), so any scroll position draws the right shape.
 */
const create: RecipeFactory = ({ skin, low }: RecipeCtx) => {
  const pool = new Pool();
  const k = 1.7 / Math.max(...skin.ratio);
  const L = skin.ratio[0] * k;
  const H = skin.ratio[2] * k;
  const flat = skin.ratio[1] < 0.15;
  const B = flat ? 0.05 : (skin.ratio[1] * k) / 2;
  const SM = 0.075; // side seal, as a share of the width

  const art = { SW: L, SH: H, fronts: [{ x: L * 0.08, y: H * 0.1, w: L * 0.84, h: H * 0.8 }], sides: [] as never[] };
  const printTex = sheetTexture(pool, skin, art, false, low);
  const blankTex = sheetTexture(pool, skin, art, true, low);
  const mats = skinMats(pool, skin, printTex, blankTex);
  mats.outer.side = THREE.DoubleSide;
  mats.outer.metalness = skin.material === "film" && !flat ? 0.25 : 0;
  mats.uReveal.value = 0;
  const backMat = pool.add(new THREE.MeshStandardMaterial({ map: blankTex, roughness: 0.32, metalness: mats.outer.metalness, side: THREE.DoubleSide }));

  const frontGeo = pool.add(new THREE.PlaneGeometry(L, H, SX, SY));
  const backGeo = pool.add(new THREE.PlaneGeometry(L, H, SX, SY));
  const nV = frontGeo.attributes.position.count;
  const U = new Float32Array(nV);
  const V = new Float32Array(nV);
  for (let i = 0; i < nV; i++) {
    U[i] = (i % (SX + 1)) / SX;
    V[i] = 1 - Math.floor(i / (SX + 1)) / SY;
  }
  const front = new THREE.Mesh(frontGeo, mats.outer);
  const back = new THREE.Mesh(backGeo, backMat);
  const pouch = new THREE.Group();
  pouch.add(front, back);

  /** Depth of the panel at (u, v): 0 at the seals, B in the middle of the filled body. */
  const depth = (u: number, v: number, inf: number, open: number) => {
    const fu = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (u - SM) / (1 - 2 * SM)))), 0.7);
    const bot = flat ? smooth(0.04, 0.22, v) : smooth(0.0, 0.16, v);
    const topEdge = 1 - (1 - open) * smooth(1 - SM - 0.16, 1 - SM, v);
    return inf * B * fu * bot * topEdge;
  };
  let lastInf = -1;
  let lastOpen = -1;
  const shape = (inf: number, open: number) => {
    if (Math.abs(inf - lastInf) < 1e-4 && Math.abs(open - lastOpen) < 1e-4) return;
    lastInf = inf;
    lastOpen = open;
    const pf = frontGeo.attributes.position as THREE.BufferAttribute;
    const pb = backGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < nV; i++) {
      const d = depth(U[i], V[i], inf, open);
      pf.setZ(i, d);
      pb.setZ(i, -d);
    }
    pf.needsUpdate = pb.needsUpdate = true;
    frontGeo.computeVertexNormals();
    backGeo.computeVertexNormals();
  };

  // roll and web (steps 1 and 2)
  const R = 0.4;
  const filmMat = pool.add(new THREE.MeshStandardMaterial({ color: skin.material === "film" ? "#cfd4d3" : skin.base, roughness: 0.3, metalness: 0.2 }));
  const core = pool.add(new THREE.MeshStandardMaterial({ color: "#8d8a82", roughness: 0.8 }));
  const rollG = new THREE.Group();
  rollG.rotation.z = PI2;
  const roll = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(R, R, L * 1.04, 32)), [filmMat, core, core]);
  rollG.add(roll);
  rollG.position.y = H / 2 + R;
  const web = new THREE.Mesh(pool.add(new THREE.BoxGeometry(L, 1, 0.01)), filmMat);
  const printRoller = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(0.07, 0.07, H * 1.04, 20)), steel(pool));
  printRoller.position.z = 0.1;

  // heat bars and the seals they leave
  const barMat = steel(pool, "#6c7378");
  const barV = new THREE.Mesh(pool.add(new THREE.BoxGeometry(L * SM * 1.6, H, 0.1)), barMat);
  const barH = new THREE.Mesh(pool.add(new THREE.BoxGeometry(L, 0.1, 0.1)), barMat);
  const sealMat = pool.add(new THREE.MeshStandardMaterial({ color: new THREE.Color(skin.base).lerp(new THREE.Color("#ffffff"), 0.35), roughness: 0.5, transparent: true, opacity: 0.55, depthWrite: false }));
  const sealV = pool.add(new THREE.BoxGeometry(L * SM, H * 0.985, 0.004));
  const sealL = new THREE.Mesh(sealV, sealMat);
  const sealR = new THREE.Mesh(sealV, sealMat);
  const sealB = new THREE.Mesh(pool.add(new THREE.BoxGeometry(L * 0.985, H * 0.07, 0.004)), sealMat);
  const sealT = new THREE.Mesh(pool.add(new THREE.BoxGeometry(L * 0.985, H * 0.07, 0.004)), sealMat);

  // zipper strip that follows the surface
  const zipY = H / 2 - H * (flat ? 0.15 : 0.2);
  const zipV = 1 - (H / 2 - zipY) / H;
  const zipGeo = pool.add(new THREE.PlaneGeometry(L * 0.84, 0.07, 12, 1));
  const zipMat = pool.add(new THREE.MeshStandardMaterial({ color: skin.accent, roughness: 0.5, side: THREE.DoubleSide }));
  const zip = new THREE.Mesh(zipGeo, zipMat);
  zip.position.y = zipY;
  const slider = new THREE.Mesh(pool.add(new THREE.BoxGeometry(0.1, 0.1, 0.05)), pool.add(new THREE.MeshStandardMaterial({ color: skin.second, roughness: 0.45 })));

  // base of a stand-up pouch
  const baseGeo = pool.add(new THREE.CircleGeometry(1, 24));
  const base = new THREE.Mesh(baseGeo, pool.add(new THREE.MeshStandardMaterial({ color: new THREE.Color(skin.base).multiplyScalar(0.8), roughness: 0.6, side: THREE.DoubleSide })));
  base.rotation.x = -PI2;
  base.position.y = -H / 2 + 0.004;
  base.scale.set(L * 0.4, B * 0.95, 1);

  // the product poured in
  const BEANS = 22;
  const beans = new THREE.InstancedMesh(pool.add(new THREE.SphereGeometry(0.055, 8, 6)), pool.add(new THREE.MeshStandardMaterial({ color: "#6b4a2b", roughness: 0.55 })), BEANS);
  beans.frustumCulled = false;
  pool.add(beans);

  const shadow = blobShadow(pool);
  const shadowMat = shadow.material as THREE.MeshBasicMaterial;

  const root = new THREE.Group();
  root.add(rollG, web, printRoller, pouch, barV, barH, sealL, sealR, sealB, sealT, zip, slider, base, beans, shadow);

  const zipP = zipGeo.attributes.position as THREE.BufferAttribute;
  const zn = zipP.count;

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t0 = lin(p, 0, 1 / N);
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 4 / N);
    const t4 = lin(p, 4 / N, 5 / N);
    const t5 = lin(p, 5 / N, 1);

    // 0: the film unrolls
    const u = seg(t0, 0.08, 0.92);
    rollG.visible = p < 2 / N;
    roll.rotation.y = u * 6 + (p >= 1 / N ? 6 : 0) + t1 * 1.5;
    web.visible = p < 1 / N;
    web.scale.y = Math.max(0.001, H * u);
    web.position.set(0, H / 2 - (H * u) / 2, 0);

    // 1: printed as it passes the roller
    front.visible = p >= 1 / N;
    const wipe = seg(t1, 0.1, 0.9);
    mats.uReveal.value = p >= 2 / N ? 1 : p < 1 / N ? 0 : wipe;
    mats.uScan.value = p >= 1 / N && p < 2 / N && wipe > 0 && wipe < 1 ? 1 : 0;
    printRoller.visible = p >= 1 / N && p < 2 / N && wipe > 0 && wipe < 1;
    printRoller.position.x = -L / 2 + L * wipe;

    // 2: the second panel comes in, three edges are heat sealed
    const back2 = seg(t2, 0, 0.28);
    back.visible = p >= 2 / N;
    back.position.z = -(1 - back2) * 0.9 - 0.003;
    const press = (a: number, b: number) => Math.sin(Math.PI * seg(t2, a, b));
    const pL = seg(t2, 0.32, 0.5);
    const pR = seg(t2, 0.48, 0.66);
    const pB = seg(t2, 0.64, 0.84);
    const sealsDone = p >= 3 / N;
    barV.visible = p >= 2 / N && p < 3 / N && ((pL > 0 && pL < 1) || (pR > 0 && pR < 1));
    const left = pL < 1 || pR <= 0;
    barV.position.set(left ? -L / 2 + (L * SM) / 2 : L / 2 - (L * SM) / 2, 0, 0.05 + (1 - press(left ? 0.32 : 0.48, left ? 0.5 : 0.66)) * 0.8);
    barH.visible = p >= 2 / N && p < 3 / N && pB > 0 && pB < 1;
    barH.position.set(0, -H / 2 + H * 0.035, 0.05 + (1 - press(0.64, 0.84)) * 0.8);
    sealL.visible = sealsDone || pL >= 0.5;
    sealR.visible = sealsDone || pR >= 0.5;
    sealB.visible = sealsDone || pB >= 0.5;

    // 3: zipper slides in along the top
    const zs = seg(t3, 0.1, 0.8);
    zip.visible = p >= 3 / N && zs > 0.001;
    zip.scale.x = Math.max(0.001, zs);
    slider.visible = zip.visible;

    // 4: opened, filled (it swells), 5: closed and sealed at the top
    const fill = seg(t4, 0.28, 0.95);
    const open = p < 4 / N ? 0 : p < 5 / N ? seg(t4, 0, 0.22) : 1 - seg(t5, 0.15, 0.5);
    const inf = p < 4 / N ? 0 : 0.28 * seg(t4, 0, 0.22) + 0.72 * fill - 0.06 * seg(t5, 0.4, 0.9);
    shape(inf, open);
    const zsx = Math.max(0.001, zs);
    zip.position.x = -L * 0.42 + (zsx * L * 0.84) / 2;
    for (let i = 0; i < zn; i++) {
      const uu = 0.5 + (zip.position.x + zipP.getX(i) * zsx) / L;
      zipP.setZ(i, depth(uu, zipV + (zipP.getY(i) > 0 ? 0.01 : -0.01), inf, open) + 0.006);
    }
    zipP.needsUpdate = true;
    const sliderX = -L * 0.42 + zsx * L * 0.84;
    slider.position.set(sliderX, zipY, depth(0.5 + sliderX / L, zipV, inf, open) + 0.04);
    base.visible = !flat && p >= 4 / N;
    base.scale.set(Math.max(0.001, L * 0.4 * seg(t4, 0.2, 0.7)), Math.max(0.001, B * 0.95 * seg(t4, 0.2, 0.7)), 1);

    // the beans fall into the mouth and vanish as they pass it
    for (let i = 0; i < BEANS; i++) {
      const s = seg(t4, 0.12 + (i / BEANS) * 0.55, 0.38 + (i / BEANS) * 0.55);
      const h = ((i * 37) % 11) / 11 - 0.5;
      tP.set(h * L * 0.5, H / 2 + 1.2 - s * 1.2, (((i * 13) % 7) / 7 - 0.5) * B * 0.8);
      tS.setScalar(p >= 4 / N && p < 5 / N ? Math.max(0.0001, 1 - seg(s, 0.88, 1)) * (s > 0 ? 1 : 0.0001) : 0.0001);
      tQ.identity();
      tM.compose(tP, tQ, tS);
      beans.setMatrixAt(i, tM);
    }
    beans.instanceMatrix.needsUpdate = true;
    beans.visible = p >= 4 / N && p < 5 / N;

    // 5: top heat bar
    const topPress = seg(t5, 0.4, 0.75);
    barH.visible = barH.visible || (p >= 5 / N && topPress > 0 && topPress < 1);
    if (p >= 5 / N) barH.position.set(0, H / 2 - H * 0.035, 0.05 + (1 - Math.sin(Math.PI * topPress)) * 0.8);
    sealT.visible = p >= 5 / N + 0.0001 && topPress >= 0.5;
    sealL.position.set(-L / 2 + (L * SM) / 2, 0, 0.004);
    sealR.position.set(L / 2 - (L * SM) / 2, 0, 0.004);
    sealB.position.set(0, -H / 2 + H * 0.035, 0.004);
    sealT.position.set(0, H / 2 - H * 0.035, 0.004);
    // the seal strips lie on the swelling surface: lift them with the panel at their centre line
    sealB.position.z = depth(0.5, 0.04, inf, open) + 0.004;
    sealT.position.z = depth(0.5, 0.96, inf, open) + 0.004;

    shadow.rotation.x = -PI2;
    shadow.position.set(0, -H / 2 - 0.02, 0);
    shadow.scale.set(L * 1.7, Math.max(0.35, B * 3.2), 1);
    shadowMat.opacity = seg(p, 1.5 / N, 2.4 / N);
    shadow.visible = p >= 2 / N;
    pouch.position.y = 0;

    // camera: roll and web, face-on to print, three-quarter for sealing, then round the finished pouch
    const dRoll = fitDistance(cam, L * 1.3, H + 2 * R + 0.3, 1.05);
    const dPouch = fitDistance(cam, L * 1.55, H * 1.15, 1.1);
    const toPouch = seg(p, 1 / N - 0.02, 1 / N + 0.12);
    const dist = lerp(dRoll, dPouch, toPouch);
    const ty = lerp(R * 0.8, 0, toPouch);
    const yaw = lerp(0.1, 0.5, seg(p, 2 / N - 0.05, 2 / N + 0.08)) - 0.55 * seg(p, 3 / N, 4 / N) + 0.3 * seg(p, 4 / N, 5 / N) - 0.1 * seg(p, 5 / N, 1);
    orbit(cam, 0, ty, 0, dist, yaw, 0.05 + 0.1 * seg(p, 2 / N, 3 / N));
  };

  return { root, update, dispose: () => pool.dispose() };
};

/** Marker string, so tests can tell which chunk holds this recipe. */
export const RECIPE_ID = "film-recipe:pouch";

export default create;
