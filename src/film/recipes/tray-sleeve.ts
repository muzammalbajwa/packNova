import * as THREE from "three";
import type { RecipeCtx, RecipeFactory } from "../types";
import { Pool, blobShadow, fitDistance, lerp, lin, orbit, seg, sheetTexture, skinMats } from "../kit";
import { buildChain, chainLayout, type Chain, type ChainSpec } from "../chain";

const N = 4; // sheet, die-cut, fold tray, slide sleeve
const tM = new THREE.Matrix4();
const tP = new THREE.Vector3();
const tQ = new THREE.Quaternion();
const tS = new THREE.Vector3();
// chain y (the tube axis) -> world x, chain z (the printed face) -> world y, chain x -> world z
const qUp = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1));
const qId = new THREE.Quaternion();

/**
 * Tray and sleeve: two flat sheets are die-cut; the tray's walls rise from its floor; the sleeve is wrapped into a
 * four-sided loop, turned to lie along the tray and slid over it. Both are hinged chains, so folding is rotating groups.
 */
const create: RecipeFactory = ({ skin, low }: RecipeCtx) => {
  const pool = new Pool();
  const k = 1.7 / Math.max(...skin.ratio);
  const L = skin.ratio[0] * k;
  const D = skin.ratio[1] * k;
  const Hb = skin.ratio[2] * k * 0.85;
  const t = 0.022;
  const Ls = L * 0.42;
  const clear = 0.07;

  // tray
  const trayInk = { ...skin, material: "kraft" as const, base: skin.second, print: "none" as const, foil: false };
  const trayS: ChainSpec = {
    widths: [L, D, L, D], H: Hb, t, glueW: 0.16, margin: 0.14,
    top: [0, 0, 0, 0], bottom: [0, 0, D, 0], topLayer: [0, 0, 0, 0], bottomLayer: [0, 0, 0, 0], tuckTop: [0, 0, 0, 0], tuckBottom: [0, 0, 0, 0],
  };
  const trayL = chainLayout(trayS);
  const trayMats = skinMats(pool, trayInk, sheetTexture(pool, trayInk, trayL, false, low), sheetTexture(pool, trayInk, trayL, true, low), undefined, true);
  trayMats.uReveal.value = 1;
  trayMats.edge.color.set("#8a6a43");
  const tray: Chain = buildChain(pool, trayS, trayL, trayMats);
  tray.creasesV.visible = tray.creasesH.visible = false;

  // sleeve: top, side, bottom, side of the loop around the tray
  const sleeveS: ChainSpec = {
    widths: [D + clear, Hb + clear, D + clear, Hb + clear], H: Ls, t, glueW: 0.14, margin: 0.14,
    top: [0, 0, 0, 0], bottom: [0, 0, 0, 0], topLayer: [0, 0, 0, 0], bottomLayer: [0, 0, 0, 0], tuckTop: [0, 0, 0, 0], tuckBottom: [0, 0, 0, 0],
  };
  const sleeveL = chainLayout(sleeveS);
  const sleeveMats = skinMats(pool, skin, sheetTexture(pool, skin, sleeveL, false, low), sheetTexture(pool, skin, sleeveL, true, low), undefined, true);
  sleeveMats.uReveal.value = 1;
  const sleeve: Chain = buildChain(pool, sleeveS, sleeveL, sleeveMats);
  sleeve.creasesV.visible = sleeve.creasesH.visible = false;
  const sleeveG = new THREE.Group();
  const sleeveIn = new THREE.Group();
  sleeveIn.add(sleeve.root);
  sleeveG.add(sleeveIn);

  // soap bars in the tray
  const bars = new THREE.InstancedMesh(pool.add(new THREE.BoxGeometry(L * 0.26, Hb * 0.5, D * 0.6)), pool.add(new THREE.MeshStandardMaterial({ color: skin.accent, roughness: 0.6 })), 3);
  bars.frustumCulled = false;
  pool.add(bars);

  const root = new THREE.Group();
  root.add(tray.root, sleeveG, bars);
  const shadow = blobShadow(pool);
  root.add(shadow);
  const shadowMat = shadow.material as THREE.MeshBasicMaterial;

  const yT = 0.65;
  const yS = -1.12;
  const flatCyT = Hb / 2 + (trayL.maxTop - trayL.maxBot) / 2;
  const flatCyS = Ls / 2;
  const floor = -Hb / 2;
  const xr = L / 2 + Ls / 2 + 0.35;

  const press = (c: Chain, p: number, t1: number, shift: number) => {
    const pr = seg(t1, shift, shift + 0.3);
    c.knife.visible = p >= 1 / N && p < 2 / N && pr > 0.001 && t1 < 0.8 + shift * 0.5;
    c.knife.position.z = (1 - pr) * 1.1 - seg(t1, 0.5 + shift, 0.8 + shift) * 1.1;
    const drop = seg(t1, 0.7 + shift * 0.5, 1);
    c.waste.visible = p < 2 / N;
    c.waste.position.set(0, -drop * 5, drop * 0.6);
    c.waste.rotation.z = drop * 0.35;
  };

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 1);

    tray.creasesV.visible = tray.creasesH.visible = sleeve.creasesV.visible = sleeve.creasesH.visible = false;
    press(tray, p, t1, 0);
    press(sleeve, p, t1, 0.12);

    // 2: the tray rises; the sleeve sheet moves off to the side
    const f1 = seg(t2, 0, 0.36);
    const f2 = seg(t2, 0.16, 0.52);
    const f3 = seg(t2, 0.32, 0.68);
    tray.setWall(1, f1);
    tray.setWall(2, f2);
    tray.setWall(3, f3);
    tray.setGlue(seg(t2, 0.5, 0.74));
    tray.setBottom(2, seg(t2, 0.7, 1));
    const fold = (f1 + f2 + f3) / 3;
    tray.center();
    tray.root.position.set(-lerp((trayL.sumW + trayS.glueW) / 2, tray.cx, fold), lerp(yT - flatCyT, floor, fold), -tray.cz * fold);

    // 3: bars drop in, the sleeve wraps, turns and slides over the tray
    const barIn = seg(t3, 0, 0.22);
    bars.visible = p >= 3 / N;
    for (let i = 0; i < 3; i++) {
      const s = seg(barIn, i * 0.2, 0.55 + i * 0.2);
      tP.set((i - 1) * L * 0.3, floor + t + Hb * 0.25 + (1 - s) * 1.3, 0);
      tS.setScalar(Math.max(s, 0.0001));
      tM.compose(tP, tQ.identity(), tS);
      bars.setMatrixAt(i, tM);
    }
    bars.instanceMatrix.needsUpdate = true;

    const sIn = seg(t3, 0, 0.2);
    const g1 = seg(t3, 0.16, 0.38);
    const g2 = seg(t3, 0.26, 0.48);
    const g3 = seg(t3, 0.36, 0.58);
    sleeve.setWall(1, g1);
    sleeve.setWall(2, g2);
    sleeve.setWall(3, g3);
    sleeve.setGlue(seg(t3, 0.5, 0.62));
    const sf = (g1 + g2 + g3) / 3;
    sleeve.center();
    sleeveIn.position.set(lerp(-(sleeveL.sumW + sleeveS.glueW) / 2, -sleeve.cx, sf), lerp(-flatCyS, -Ls / 2, sf), -sleeve.cz * sf);
    const turn = seg(t3, 0.55, 0.72);
    sleeveG.quaternion.slerpQuaternions(qId, qUp, turn);
    const slide = seg(t3, 0.72, 1);
    const sx = p < 3 / N ? seg(t2, 0, 0.3) * 9 : (1 - sIn) * 9;
    sleeveG.position.set(lerp(lerp(0, xr, turn), 0, slide) + sx, lerp(yS, 0, turn), 0);

    shadow.position.set(0, floor - 0.02, 0);
    shadow.scale.set(L * 1.7, D * 2.0, 1);
    shadowMat.opacity = fold;
    shadow.visible = fold > 0.02;

    // camera: both sheets, the tray, then below it for the sleeve, then the finished pair
    const dBoth = fitDistance(cam, trayL.SW, 3.4, 1.04);
    const dTray = fitDistance(cam, L * 1.5, D * 0.9 + Hb + 0.2, 1.1);
    const dWrap = fitDistance(cam, L * 1.55, 2.1, 1.05);
    const dEnd = fitDistance(cam, L * 1.5, D * 0.9 + Hb + 0.3, 1.1);
    const toTray = seg(p, 2 / N - 0.02, 2 / N + 0.12);
    const toWrap = seg(t3, 0, 0.12);
    const toEnd = seg(t3, 0.52, 0.78);
    const dist = lerp(lerp(lerp(dBoth, dTray, toTray), dWrap, toWrap), dEnd, toEnd);
    const ty = lerp(lerp(-0.02, 0, toTray), -0.55, toWrap) * (1 - toEnd);
    const yaw = lerp(0.04, 0.45, toTray) - 0.35 * seg(t3, 0.6, 1);
    const pitch = lerp(0.03, 0.42, toTray) - 0.12 * seg(t3, 0.1, 0.4);
    orbit(cam, 0, ty, 0, dist, yaw, pitch);
  };

  return { root, update, dispose: () => pool.dispose() };
};

/** Marker string, so tests can tell which chunk holds this recipe. */
export const RECIPE_ID = "film-recipe:tray-sleeve";

export default create;
