import * as THREE from "three";
import type { RecipeCtx, RecipeFactory } from "../types";
import { Pool, PI2, blobShadow, fitDistance, fluteTexture, lerp, lin, orbit, seg, sheetTexture, skinMats, steel } from "../kit";
import { buildChain, chainLayout, type ChainSpec } from "../chain";

const N = 7; // sheet, die-cut, crease, fold, glue flap, tape, stack
const tmpM = new THREE.Matrix4();
const tmpP = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const GX = [-0.5, 0.5, -0.5, 0.5];
const GZ = [0.5, 0.5, -0.5, -0.5];

/**
 * Corrugated box (a regular slotted container): a thick fluted sheet, cut with a die, creased by a wheel,
 * folded, glued at one seam, closed and taped, then stacked on a pallet.
 */
const create: RecipeFactory = ({ skin, low }: RecipeCtx) => {
  const pool = new Pool();
  const k = 1.7 / Math.max(...skin.ratio);
  const L = skin.ratio[0] * k;
  const D = skin.ratio[1] * k;
  const H = skin.ratio[2] * k;
  const t = 0.075;
  const fl = Math.max(0.1, D / 2);
  // flat boxes (pizza, apparel mailers) close with one hinged lid and a tuck; tall ones are regular slotted containers
  const flat = H < D * 0.4;
  const spec: ChainSpec = {
    widths: [L, D, L, D], H, t, glueW: Math.min(0.26, D * 0.4), margin: 0.18,
    top: flat ? [0, 0, D, 0] : [fl, fl, fl, fl], bottom: [fl, fl, fl, fl],
    topLayer: [1, 0, 1, 0], bottomLayer: [1, 0, 1, 0],
    tuckTop: flat ? [0, 0, Math.min(0.3, D * 0.2), 0] : [0, 0, 0, 0], tuckBottom: [0, 0, 0, 0],
  };
  const layout = chainLayout(spec);
  const printTex = sheetTexture(pool, skin, layout, false, low);
  const blankTex = sheetTexture(pool, skin, layout, true, low);
  const flute = fluteTexture(pool, skin.base);
  flute.repeat.set(10, 1);
  const mats = skinMats(pool, skin, printTex, blankTex, flute);
  mats.uReveal.value = 1;
  const c = buildChain(pool, spec, layout, mats);
  const root = new THREE.Group();
  const stage = new THREE.Group();
  root.add(stage);
  stage.add(c.root);

  const wheel = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 28)), steel(pool));
  wheel.rotation.x = PI2;
  wheel.position.z = 0.12;
  stage.add(wheel);
  const bead = new THREE.Mesh(pool.add(new THREE.BoxGeometry(0.05, H * 0.9, 0.02)), pool.add(new THREE.MeshStandardMaterial({ color: "#f6e7a8", roughness: 0.4 })));
  bead.position.set(spec.glueW * 0.6, H / 2, 0.012);
  c.glue.add(bead);
  const tape = new THREE.Mesh(pool.add(new THREE.BoxGeometry(1, 0.012, 0.3)), pool.add(new THREE.MeshStandardMaterial({ color: "#d8c79a", roughness: 0.25, metalness: 0.05 })));
  stage.add(tape);

  // pallet stack: 3 layers of 2 x 2 boxes; the carton you watched becomes the first one
  const faceArt = { SW: L, SH: H, fronts: [{ x: 0, y: 0, w: L, h: H }], sides: [] as never[] };
  const faceMat = pool.add(new THREE.MeshStandardMaterial({ map: sheetTexture(pool, skin, faceArt, false, low), roughness: 0.85 }));
  const boxGeo = pool.add(new THREE.BoxGeometry(L, H, D));
  const others = new THREE.InstancedMesh(boxGeo, faceMat, 11);
  others.frustumCulled = false;
  stage.add(others);
  const pallet = new THREE.Mesh(pool.add(new THREE.BoxGeometry(L * 2.25, 0.12, D * 2.25)), pool.add(new THREE.MeshStandardMaterial({ color: "#8a6a43", roughness: 0.9 })));
  stage.add(pallet);

  const shadow = blobShadow(pool);
  root.add(shadow);
  const shadowMat = shadow.material as THREE.MeshBasicMaterial;
  const flatCy = H / 2 + (layout.maxTop - layout.maxBot) / 2;
  const nV = c.creasesV.children as THREE.Mesh[];
  const nH = c.creasesH.children as THREE.Mesh[];
  const gap = 1.04;

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 4 / N);
    const t4 = lin(p, 4 / N, 5 / N);
    const t5 = lin(p, 5 / N, 6 / N);
    const t6 = lin(p, 6 / N, 1);

    // 1: die press, waste drops
    const press = seg(t1, 0, 0.3);
    c.knife.visible = p >= 1 / N && p < 2 / N && press > 0.001 && t1 < 0.8;
    c.knife.position.z = (1 - press) * 1.1 - seg(t1, 0.5, 0.8) * 1.1;
    const dropT = seg(t1, 0.55, 1);
    c.waste.visible = p < 2 / N;
    c.waste.position.set(0, -dropT * 5, dropT * 0.6);
    c.waste.rotation.z = dropT * 0.35;

    // 2: crease wheel runs down each vertical line, then along the two horizontals
    const inCrease = p >= 2 / N && p < 3 / N;
    const pastCrease = p >= 3 / N;
    c.creasesV.visible = c.creasesH.visible = (inCrease || (pastCrease && t3 < 0.02)) ;
    let wx = 0, wy = 0;
    for (let i = 0; i < 4; i++) {
      const f = pastCrease ? 1 : seg(t2, i * 0.16, i * 0.16 + 0.15);
      nV[i].scale.y = Math.max(0.0001, H * f);
      nV[i].position.y = H - (H * f) / 2;
      if (f > 0 && f < 1) { wx = c.vLines[i]; wy = H - H * f; }
    }
    for (let i = 0; i < 2; i++) {
      const f = pastCrease ? 1 : seg(t2, 0.68 + i * 0.15, 0.82 + i * 0.15);
      nH[i].scale.x = Math.max(0.0001, layout.sumW * f);
      nH[i].position.x = (layout.sumW * f) / 2;
      if (f > 0 && f < 1) { wx = layout.sumW * f; wy = i === 0 ? 0 : H; }
    }
    wheel.visible = inCrease && (wx !== 0 || wy !== 0);
    wheel.position.x = wx;
    wheel.position.y = wy;

    // 3: walls fold round
    const f1 = seg(t3, 0.04, 0.42);
    const f2 = seg(t3, 0.22, 0.6);
    const f3 = seg(t3, 0.4, 0.78);
    c.setWall(1, f1);
    c.setWall(2, f2);
    c.setWall(3, f3);
    // 4: glue flap
    const fg = seg(t4, 0.3, 0.8);
    c.setGlue(fg);
    bead.visible = p >= 3 / N && fg < 0.95;
    // 5: flaps close (minor first), then tape along the seam
    c.setBottom(1, seg(t5, 0, 0.18));
    c.setBottom(3, seg(t5, 0, 0.18));
    c.setBottom(0, seg(t5, 0.14, 0.32));
    c.setBottom(2, seg(t5, 0.14, 0.32));
    c.setTop(1, seg(t5, 0.3, 0.46));
    c.setTop(3, seg(t5, 0.3, 0.46));
    c.setTop(0, seg(t5, 0.42, 0.6));
    c.setTop(2, seg(t5, 0.42, 0.6));
    c.setTuckTop(2, seg(t5, 0.55, 0.7));
    const tp = seg(t5, 0.62, 0.95);
    tape.visible = tp > 0.001;
    tape.scale.x = Math.max(0.001, L * 1.04 * tp);

    // placement
    const fold = (f1 + f2 + f3) / 3;
    c.center();
    // t6: the carton walks to its slot on the pallet
    const mv = seg(t6, 0, 0.22);
    const slotX = GX[0] * L * gap;
    const slotZ = GZ[0] * D * gap;
    c.root.position.set(-lerp((layout.sumW + spec.glueW) / 2, c.cx, fold) + slotX * mv, -lerp(flatCy, H / 2, fold) + 0, -c.cz * fold + slotZ * mv);
    const floor = -H / 2;
    tape.position.set(-L * 0.52 + (L * 1.04 * tp) / 2 + slotX * mv, floor + H + 2 * t + 0.008, slotZ * mv + (flat ? D / 2 - 0.2 : 0));
    shadow.position.set(slotX * mv * 0.5, floor - 0.2 * mv - 0.02, slotZ * mv * 0.5);
    shadow.scale.set(L * (1.8 + 2.2 * mv), D * (1.8 + 2.2 * mv), 1);
    shadowMat.opacity = fold;
    shadow.visible = fold > 0.02;

    pallet.visible = t6 > 0.2;
    pallet.position.set(0, floor - 0.06 - 0.02, 0);
    pallet.scale.set(1, 1, 1);
    for (let i = 0; i < 11; i++) {
      const layer = (i + 1) >> 2; // positions 1..11 -> layers 0,0,0,1,1,1,1,2,2,2,2
      const pos = (i + 1) & 3;
      const s = seg(t6, 0.16 + i * 0.055, 0.34 + i * 0.055);
      tmpP.set(GX[pos] * L * gap, floor + H / 2 + layer * H * 1.0 + (1 - s) * 1.1, GZ[pos] * D * gap);
      tmpS.setScalar(Math.max(s, 0.0001));
      tmpM.compose(tmpP, tmpQ, tmpS);
      others.setMatrixAt(i, tmpM);
    }
    others.instanceMatrix.needsUpdate = true;
    others.visible = t6 > 0.15;

    // camera: oblique to the sheet edge (to see the flutes), face-on for cutting, round the box, then back for the stack
    const dSheet = fitDistance(cam, layout.SW, layout.SH, 1.02);
    const dFold = fitDistance(cam, Math.max(L, D) * 1.7, H + (flat ? D : fl) * 1.05, 1.3);
    const dStack = fitDistance(cam, L * 2.9, H * 3.2 + 0.3, 1.1);
    const a = seg(p, 3 / N - 0.02, 4 / N);
    const face = 1 - seg(t1, 0, 0.35); // first step: oblique; the die press: face-on
    const yawSheet = p < 1 / N ? lerp(0.9, 0.05, seg(lin(p, 0, 1 / N), 0.25, 0.95)) : 0.05;
    const pitchSheet = p < 1 / N ? lerp(0.32, 0.04, seg(lin(p, 0, 1 / N), 0.25, 0.95)) : 0.04;
    void face;
    const toStack = seg(p, 6 / N - 0.03, 6 / N + 0.09);
    const dist = lerp(lerp(dSheet * (p < 1 / N ? lerp(0.85, 1, seg(lin(p, 0, 1 / N), 0.3, 1)) : 1), dFold, a), dStack, toStack);
    const yaw = lerp(yawSheet, 0.55, a) + lerp(0, -0.6, seg(t5, 0, 1)) + t6 * 0.45;
    const pitch = lerp(pitchSheet, 0.3, a) + 0.18 * seg(t5, 0.3, 0.8) - 0.1 * seg(t6, 0.2, 1);
    orbit(cam, 0, lerp(0, H * 0.9, toStack), 0, dist, yaw, pitch);
  };

  return { root, update, dispose() { pool.dispose(); others.dispose(); } };
};

export default create;
