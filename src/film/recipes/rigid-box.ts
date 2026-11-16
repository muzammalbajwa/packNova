import * as THREE from "three";
import type { RecipeCtx, RecipeFactory } from "../types";
import { Pool, PI2, blobShadow, fitDistance, lerp, lin, orbit, seg, sheetTexture, skinMats, steel } from "../kit";
import { buildChain, chainLayout, type Chain, type ChainSpec } from "../chain";
import { createProps } from "../props";

const N = 6; // cut board, wrap paper, fold, lid, closure, insert

/**
 * Rigid box: thick greyboard is cut, wrapped in printed paper, folded into a tray; a lid is made the same way and
 * set over it; then the closing detail (magnets, a ribbon, or a plain lift-off lid) and a fitted insert.
 * The base is a strip of four walls with the floor hinged to one wall; the lid is the same strip with its top board.
 */
const create: RecipeFactory = ({ skin, low }: RecipeCtx) => {
  const pool = new Pool();
  const k = 1.7 / Math.max(...skin.ratio);
  const L = skin.ratio[0] * k;
  const D = skin.ratio[1] * k;
  const H = skin.ratio[2] * k;
  const t = 0.075;
  const Hb = H * 0.62;
  const Hl = H * 0.5;
  const Lb = L - 2 * t - 0.025;
  const Db = D - 2 * t - 0.025;
  const magnet = skin.lid === "magnet";
  const ribbon = skin.props.includes("ribbon");

  const baseSpec: ChainSpec = {
    widths: [Lb, Db, Lb, Db], H: Hb, t, glueW: 0.16, margin: 0.16,
    top: [0, 0, 0, 0], bottom: [0, 0, Db, 0], topLayer: [0, 0, 0, 0], bottomLayer: [0, 0, 0, 0],
    tuckTop: [0, 0, 0, 0], tuckBottom: [0, 0, 0, 0],
  };
  const baseLayout = chainLayout(baseSpec);
  const grey = { ...skin, material: "white" as const, base: "#8d8982", print: "none" as const, foil: false };
  const printTex = sheetTexture(pool, skin, baseLayout, false, low);
  const blankTex = sheetTexture(pool, grey, baseLayout, true, low);
  const mats = skinMats(pool, skin, printTex, blankTex, undefined, true, "#77736c");
  mats.uReveal.value = 0;
  const base = buildChain(pool, baseSpec, baseLayout, mats);

  const lidSpec: ChainSpec = {
    widths: [L, D, L, D], H: Hl, t, glueW: 0.16, margin: 0.16,
    top: [0, 0, D, 0], bottom: [0, 0, 0, 0], topLayer: [0, 0, 0, 0], bottomLayer: [0, 0, 0, 0],
    tuckTop: [0, 0, 0, 0], tuckBottom: [0, 0, 0, 0],
  };
  const lidLayout = chainLayout(lidSpec);
  const lidMats = skinMats(pool, skin, sheetTexture(pool, skin, lidLayout, false, true), sheetTexture(pool, grey, lidLayout, true, true), undefined, true, "#77736c");
  const lid: Chain = buildChain(pool, lidSpec, lidLayout, lidMats);
  for (let i = 1; i < 4; i++) lid.setWall(i, 1);
  lid.setGlue(1);
  lid.setTop(2, 1);
  lid.center();

  const root = new THREE.Group();
  const stage = new THREE.Group();
  root.add(stage);
  stage.add(base.root);
  const lidG = new THREE.Group();
  lidG.add(lid.root);
  lid.root.position.set(-lid.cx, 0, -lid.cz);
  stage.add(lidG);

  const roller = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(0.06, 0.06, baseLayout.SH * 1.06, 24)), steel(pool));
  roller.position.z = 0.2;
  stage.add(roller);

  // closing details
  const gold = pool.add(new THREE.MeshStandardMaterial({ color: skin.second, roughness: 0.3, metalness: 0.7 }));
  const magnets = new THREE.Group();
  const mGeo = pool.add(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 20));
  const mPos: [number, number][] = [[-0.3, 1], [0.3, 1], [-0.3, -1], [0.3, -1]];
  const mMeshes: THREE.Mesh[] = [];
  for (const [mx, mz] of mPos) {
    const m = new THREE.Mesh(mGeo, gold);
    m.position.set(mx * Lb, 0, mz * (Db / 2 - t / 2));
    mMeshes.push(m);
    magnets.add(m);
  }
  stage.add(magnets);
  const ribMat = pool.add(new THREE.MeshStandardMaterial({ color: skin.second, roughness: 0.45 }));
  const rib = new THREE.Group();
  const ribW = Math.max(0.1, L * 0.11);
  const ribTop = new THREE.Mesh(pool.add(new THREE.BoxGeometry(ribW, 0.014, D + 0.03)), ribMat);
  const ribF = new THREE.Mesh(pool.add(new THREE.BoxGeometry(ribW, Hl, 0.014)), ribMat);
  const ribB = ribF.clone();
  const bow = new THREE.Mesh(pool.add(new THREE.SphereGeometry(0.1, 12, 8)), ribMat);
  bow.scale.set(1.5, 0.5, 0.8);
  const bow2 = bow.clone();
  rib.add(ribTop, ribF, ribB, bow, bow2);
  lidG.add(rib);
  ribTop.position.set(0, Hl + 0.01, 0);
  ribF.position.set(0, Hl / 2, D / 2 + 0.008);
  ribB.position.set(0, Hl / 2, -D / 2 - 0.008);
  bow.position.set(-0.12, Hl + 0.05, 0);
  bow2.position.set(0.12, Hl + 0.05, 0);
  bow.rotation.z = 0.5;
  bow2.rotation.z = -0.5;

  // insert and a product
  const insert = new THREE.Mesh(pool.add(new THREE.BoxGeometry(Lb - 2 * t - 0.05, 0.12, Db - 2 * t - 0.05)), pool.add(new THREE.MeshStandardMaterial({ color: skin.material === "white" ? "#3b3a38" : "#262523", roughness: 0.95 })));
  const product = new THREE.Mesh(pool.add(new THREE.BoxGeometry(Lb * 0.42, 0.1, Db * 0.34, 1, 1, 1)), pool.add(new THREE.MeshStandardMaterial({ color: skin.second, roughness: 0.35, metalness: 0.45 })));
  stage.add(insert, product);

  const props = createProps(pool, skin, { halfX: L * 1.15, zFront: D / 2 + 0.4, floor: -H / 2, top: -H / 2 + H });
  if (props) root.add(props.root);
  const shadow = blobShadow(pool);
  root.add(shadow);
  const shadowMat = shadow.material as THREE.MeshBasicMaterial;
  const flatCy = Hb / 2 + (baseLayout.maxTop - baseLayout.maxBot) / 2;
  const floor = -H / 2;
  const lidY0 = floor + H - Hl; // lid bottom edge when closed

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t0 = lin(p, 0, 1 / N);
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 4 / N);
    const t4 = lin(p, 4 / N, 5 / N);
    const t5 = lin(p, 5 / N, 1);

    // 0: the die cuts the grey board, the waste drops away
    const press = seg(t0, 0.1, 0.4);
    base.knife.visible = p < 1 / N && press > 0.001 && t0 < 0.85;
    base.knife.position.z = (1 - press) * 1.1 - seg(t0, 0.6, 0.85) * 1.1;
    const drop = seg(t0, 0.7, 1);
    base.waste.visible = p < 1 / N;
    base.waste.position.set(0, -drop * 5, drop * 0.6);
    base.waste.rotation.z = drop * 0.35;
    base.creasesV.visible = base.creasesH.visible = false;
    // 1: printed paper is pressed on from the left
    const rv = lin(t1, 0.05, 0.95);
    const rx = lerp(-0.5, baseLayout.SW + 0.5, seg(rv, 0, 1)) - baseSpec.margin;
    mats.uReveal.value = p >= 2 / N ? 1 : p < 1 / N ? 0 : Math.min(1, Math.max(0, (rx + baseSpec.margin) / baseLayout.SW));
    const wrapping = p >= 1 / N && p < 2 / N && rv > 0 && rv < 1;
    mats.uScan.value = wrapping ? 1 : 0;
    roller.visible = wrapping;
    roller.position.x = rx;
    roller.position.y = flatCy;
    // 2: fold up into a tray
    const f1 = seg(t2, 0.0, 0.36);
    const f2 = seg(t2, 0.16, 0.52);
    const f3 = seg(t2, 0.32, 0.68);
    base.setWall(1, f1);
    base.setWall(2, f2);
    base.setWall(3, f3);
    base.setGlue(seg(t2, 0.5, 0.74));
    base.setBottom(2, seg(t2, 0.7, 1));
    const fold = (f1 + f2 + f3) / 3;
    base.center();
    base.root.position.set(-lerp((baseLayout.sumW + baseSpec.glueW) / 2, base.cx, fold), lerp(-flatCy, floor, fold), -base.cz * fold);

    lid.waste.visible = lid.knife.visible = lid.creasesV.visible = lid.creasesH.visible = false; // the warm-up shows everything once
    // 3: the lid comes down over the base
    const lidIn = seg(t3, 0.05, 0.85);
    lidG.visible = p >= 3 / N;
    // 4: closing detail; 5: lid lifts off and moves aside
    const lift = (ribbon ? 0 : seg(t4, 0.08, 0.34) * (1 - seg(t4, 0.62, 0.9))) * 0.9;
    const aside = seg(t5, 0.18, 0.55);
    const up = seg(t5, 0, 0.2) * (1 - seg(t5, 0.58, 0.82));
    const lx = aside * L * 1.45;
    const ly = lidY0 + (1 - lidIn) * 2.6 + lift + up * (H * 1.3) - seg(t5, 0.58, 0.82) * (lidY0 - floor);
    lidG.position.set(lx, ly, 0);
    magnets.visible = magnet && p >= 4 / N && p < 5 / N;
    const ms = seg(t4, 0.28, 0.5) * (1 - seg(t4, 0.66, 0.84));
    const mTopY = floor + Hb + 0.02;
    for (let i = 0; i < 4; i++) {
      mMeshes[i].scale.setScalar(Math.max(0.001, ms));
      mMeshes[i].position.y = mTopY;
    }
    rib.visible = ribbon && p >= 4 / N;
    const rs = p >= 5 / N ? 1 : seg(t4, 0.45, 0.9);
    ribTop.scale.z = Math.max(0.001, rs);
    ribF.scale.y = ribB.scale.y = Math.max(0.001, rs);
    ribF.position.y = ribB.position.y = Hl - (Hl * Math.max(0.001, rs)) / 2;
    const bs = Math.max(0.001, seg(rs, 0.75, 1));
    bow.scale.set(1.5 * bs, 0.5 * bs, 0.8 * bs);
    bow2.scale.set(1.5 * bs, 0.5 * bs, 0.8 * bs);
    // 5: insert drops into the base, then the product
    const ins = seg(t5, 0.45, 0.75);
    insert.visible = p >= 5 / N + 0.01;
    insert.position.set(0, floor + t + 0.06 + (1 - ins) * 1.4, 0);
    const pr = seg(t5, 0.7, 0.95);
    product.visible = pr > 0.001;
    product.position.set(0, floor + t + 0.12 + 0.05 + (1 - pr) * 1.0, 0);
    props?.update(seg(t5, 0.6, 1), p);
    shadow.position.set((aside * L * 1.45) / 2, floor - 0.02, 0);
    shadow.scale.set(L * (1.8 + aside * 1.9), D * 1.8, 1);
    shadowMat.opacity = fold;
    shadow.visible = fold > 0.02;
    void PI2;

    // camera: flat sheet face-on from above-ish, then round to look into the tray, then wide for the lid beside it
    const dFlat = fitDistance(cam, baseLayout.SW, baseLayout.SH, 1.06);
    const dBox = fitDistance(cam, L * 1.9, H + 1.2, 1.12);
    const dWide = fitDistance(cam, L * 3.9, H * 1.9 + 0.6, 1.05);
    const a = seg(p, 2 / N - 0.01, 3 / N);
    const dist = lerp(lerp(dFlat, dBox, a), dWide, seg(t5, 0.1, 0.6));
    const yaw = lerp(0, 0.5, a) + lerp(0, -0.35, seg(t4, 0, 1)) + 0.2 * seg(t5, 0, 1);
    const pitch = lerp(0.02, 0.34, a) + 0.1 * seg(t5, 0, 0.5);
    orbit(cam, aside * L * 0.55, lerp(0, H * 0.12, a), 0, dist, yaw, pitch);
  };

  return { root, update, dispose: () => pool.dispose() };
};

/** Marker string, so tests can tell which chunk holds this recipe. */
export const RECIPE_ID = "film-recipe:rigid-box";

export default create;
