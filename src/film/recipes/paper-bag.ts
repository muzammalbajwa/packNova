import * as THREE from "three";
import type { RecipeCtx, RecipeFactory } from "../types";
import { Pool, PI2, blobShadow, fitDistance, lerp, lin, orbit, seg, sheetTexture, skinMats, steel } from "../kit";
import { buildChain, chainLayout, type ChainSpec } from "../chain";

const N = 5; // roll, cut, tube, bottom fold, handles

/**
 * Paper bag: paper comes off a roll, is cut to the bag length, wrapped into a tube with one glued seam,
 * the base is folded (the two side flaps first, then the two long flaps over them) and handles are glued inside the top edge.
 * The sheet, tube and base are one hinged chain, so folding is only rotating groups.
 */
const create: RecipeFactory = ({ skin, low }: RecipeCtx) => {
  const pool = new Pool();
  const k = 1.7 / Math.max(...skin.ratio);
  const L = skin.ratio[0] * k;
  const D = skin.ratio[1] * k;
  const H = skin.ratio[2] * k;
  const t = 0.02;
  const spec: ChainSpec = {
    widths: [L, D, L, D], H, t, glueW: 0.16, margin: 0.04,
    top: [0, 0, 0, 0], bottom: [D / 2, D / 2, D / 2, D / 2], topLayer: [0, 0, 0, 0], bottomLayer: [1, 0, 1, 0],
    tuckTop: [0, 0, 0, 0], tuckBottom: [0, 0, 0, 0],
  };
  const layout = chainLayout(spec);
  const printTex = sheetTexture(pool, skin, layout, false, low);
  const blankTex = sheetTexture(pool, skin, layout, true, low);
  const mats = skinMats(pool, skin, printTex, blankTex);
  const c = buildChain(pool, spec, layout, mats);
  c.knife.visible = false;
  c.creasesV.visible = c.creasesH.visible = false;

  const root = new THREE.Group();
  const stage = new THREE.Group();
  root.add(stage);
  stage.add(c.root);

  // roll of paper above the sheet, and the web hanging from it
  const R = 0.46;
  const sheetPaper = pool.add(new THREE.MeshStandardMaterial({ color: skin.base, roughness: 0.9 }));
  const core = pool.add(new THREE.MeshStandardMaterial({ color: "#8d7a5a", roughness: 0.9 }));
  const rollG = new THREE.Group();
  rollG.rotation.z = PI2;
  const roll = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(R, R, layout.SW * 1.02, 32)), [sheetPaper, core, core]);
  rollG.add(roll);
  rollG.position.y = layout.SH / 2 + R;
  root.add(rollG);
  const web = new THREE.Mesh(pool.add(new THREE.BoxGeometry(layout.SW, 1, 0.02)), sheetPaper);
  root.add(web);
  const blade = new THREE.Mesh(pool.add(new THREE.BoxGeometry(1, 0.05, 0.14)), steel(pool));
  root.add(blade);

  // glue bead on the seam, glue patches and handles
  const glueMat = pool.add(new THREE.MeshStandardMaterial({ color: "#f6e7a8", roughness: 0.4 }));
  const bead = new THREE.Mesh(pool.add(new THREE.BoxGeometry(0.04, H * 0.9, 0.02)), glueMat);
  bead.position.set(spec.glueW * 0.6, H / 2, 0.012);
  c.glue.add(bead);
  const handleMat = pool.add(new THREE.MeshStandardMaterial({ color: new THREE.Color(skin.base).multiplyScalar(0.82), roughness: 0.85 }));
  const patchMat = pool.add(new THREE.MeshStandardMaterial({ color: new THREE.Color(skin.base).multiplyScalar(1.12), roughness: 0.9 }));
  const hGeo = pool.add(new THREE.TorusGeometry(Math.min(0.3, L * 0.2), 0.02, 6, 16, Math.PI));
  const pGeo = pool.add(new THREE.BoxGeometry(Math.min(0.34, L * 0.28), 0.16, 0.012));
  const handles: THREE.Group[] = [];
  for (const wi of [0, 2]) {
    const g = new THREE.Group();
    g.position.set(L / 2, H, -t - 0.014);
    const h = new THREE.Mesh(hGeo, handleMat);
    h.position.y = 0.06;
    const pa = new THREE.Mesh(pGeo, patchMat);
    pa.position.y = -0.04;
    g.add(h, pa);
    c.walls[wi].add(g);
    handles.push(g);
  }
  const shadow = blobShadow(pool);
  root.add(shadow);
  const shadowMat = shadow.material as THREE.MeshBasicMaterial;
  const flatCy = H / 2 + (layout.maxTop - layout.maxBot) / 2;

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t0 = lin(p, 0, 1 / N);
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 4 / N);
    const t4 = lin(p, 4 / N, 1);
    const top = layout.SH / 2;
    c.knife.visible = false; // the warm-up shows everything once; the bag has no die press
    c.creasesV.visible = c.creasesH.visible = false;
    c.waste.visible = p < 2 / N; // the sheet's thin border; the bag itself is the whole sheet

    // 0: the web unrolls from the roll
    const u = seg(t0, 0.08, 0.92);
    const onRoll = p < 1 / N;
    rollG.visible = p < 2 / N;
    roll.rotation.y = u * 7 + (p >= 1 / N ? 7 : 0) + seg(t1, 0, 0.5) * 0.4;
    web.visible = onRoll;
    web.scale.y = Math.max(0.001, layout.SH * u);
    web.position.set(0, top - (layout.SH * u) / 2, 0);

    // 1: the sheet is printed as it passes, then the blade cuts it free and it drops
    c.root.visible = p >= 1 / N;
    const wipe = seg(t1, 0, 0.4);
    mats.uReveal.value = p >= 2 / N ? 1 : p < 1 / N ? 0 : wipe;
    mats.uScan.value = p >= 1 / N && wipe > 0 && wipe < 1 ? 1 : 0;
    const cut = seg(t1, 0.45, 0.75);
    blade.visible = p >= 1 / N && p < 2 / N && cut > 0 && cut < 1;
    blade.scale.x = Math.max(0.001, layout.SW * cut);
    blade.position.set(-layout.SW / 2 + (layout.SW * cut) / 2, top, 0.05);
    const drop = seg(t1, 0.72, 1);

    // 2: wrapped into a tube, one glued seam
    const f1 = seg(t2, 0.02, 0.42);
    const f2 = seg(t2, 0.2, 0.6);
    const f3 = seg(t2, 0.38, 0.78);
    c.setWall(1, f1);
    c.setWall(2, f2);
    c.setWall(3, f3);
    c.setGlue(seg(t2, 0.7, 0.98));
    bead.visible = p >= 2 / N && p < 3 / N + 0.01;

    // 3: base folded: the two side flaps, then the two long flaps over them
    c.setBottom(1, seg(t3, 0.08, 0.34));
    c.setBottom(3, seg(t3, 0.08, 0.34));
    c.setBottom(0, seg(t3, 0.4, 0.7));
    c.setBottom(2, seg(t3, 0.4, 0.7));

    // 4: handles
    for (let i = 0; i < 2; i++) {
      const s = seg(t4, 0.12 + i * 0.12, 0.6 + i * 0.12);
      handles[i].visible = s > 0.001;
      handles[i].position.y = H + (1 - s) * 1.1;
    }

    // placement: folded bag centred at the origin; it tips back to show the base, then stands up for the handles
    const fold = (f1 + f2 + f3) / 3;
    c.center();
    c.root.position.set(-lerp((layout.sumW + spec.glueW) / 2, c.cx, fold), -lerp(flatCy, H / 2, fold) - drop * 0.3 * (1 - fold), -c.cz * fold);
    const tilt = seg(t3, 0, 0.3) * (1 - seg(t3, 0.78, 1)) * 1.3;
    stage.rotation.x = -tilt;
    stage.position.y = -tilt * 0.12;
    shadow.position.set(0, -H / 2 - 0.02, 0);
    shadow.scale.set(L * 1.7, D * 2.4, 1);
    shadowMat.opacity = fold * (1 - tilt * 0.6);
    shadow.visible = fold > 0.02 && p >= 3 / N + 0.0;

    // camera: roll and web, the sheet face-on, then round the bag
    const dRoll = fitDistance(cam, layout.SW * 1.05, layout.SH + 2 * R + 0.3, 1.04);
    const dSheet = fitDistance(cam, layout.SW, layout.SH, 1.1);
    const dBag = fitDistance(cam, Math.max(L, D) * 1.9, H * 1.25 + 0.6, 1.15);
    const a = seg(p, 2 / N - 0.02, 2 / N + 0.14);
    const toSheet = seg(p, 1 / N - 0.02, 1 / N + 0.1);
    const dist = lerp(lerp(dRoll, dSheet, toSheet), dBag, a);
    const ty = lerp(lerp(R, 0, toSheet), 0, a);
    const yaw = lerp(0.12, 0.5, a) - 0.9 * seg(t4, 0, 1) * a + 0.25 * seg(t3, 0, 0.5);
    orbit(cam, 0, ty, 0, dist, yaw, lerp(0.04, 0.22, a));
  };

  return { root, update, dispose: () => pool.dispose() };
};

/** Marker string, so tests can tell which chunk holds this recipe. */
export const RECIPE_ID = "film-recipe:paper-bag";

export default create;
