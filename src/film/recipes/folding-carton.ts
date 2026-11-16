import * as THREE from "three";
import type { RecipeCtx, RecipeFactory } from "../types";
import { Pool, PI2, blobShadow, fitDistance, lerp, lin, orbit, seg, sheetTexture, skinMats, steel } from "../kit";
import { buildChain, chainLayout, type ChainSpec } from "../chain";
import { createPillow } from "./pillow";
import { createProps } from "../props";

const N = 6; // print, die-cut, fold lines, glue, close, pack
const ROOF = (30 * Math.PI) / 180; // gable roof slope
const tmpM = new THREE.Matrix4();
const tmpP = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();

/**
 * Folding carton: printed flat, cut and creased with a steel-rule die, folded around its four walls, glued at
 * one seam, closed (tuck lid, or a gabled roof with a handle), then packed with others.
 * The skin chooses the variation: window cut-out, gable top. Pillow and flap styles close like a tuck here.
 */
const create: RecipeFactory = (ctx: RecipeCtx) => {
  if (ctx.skin.lid === "pillow") return createPillow(ctx);
  const { skin, low } = ctx;
  const pool = new Pool();
  const k = 1.7 / Math.max(...skin.ratio);
  const L = skin.ratio[0] * k;
  const D = skin.ratio[1] * k;
  const H = skin.ratio[2] * k;
  const gable = skin.lid === "gable";
  const flap = skin.lid === "flap"; // two inner flaps, then two outer flaps (top and bottom)
  const fl = D / 2;
  const t = 0.022;
  const roofD = D / 2 / Math.cos(ROOF);
  const rise = (D / 2) * Math.tan(ROOF);
  const handleD = Math.min(0.42, D * 0.55);
  const spec: ChainSpec = {
    widths: [L, D, L, D], H, t, glueW: Math.min(0.2, D * 0.45), margin: 0.16,
    top: gable ? [roofD, rise, roofD, rise] : flap ? [fl, fl, fl, fl] : [0, 0, D, 0],
    skipTop: gable ? [false, true, false, true] : undefined,
    bottom: flap ? [fl, fl, fl, fl] : [D * 0.3, 0, D, 0],
    topLayer: flap ? [1, 0, 1, 0] : [0, 0, 1, 0], bottomLayer: flap ? [1, 0, 1, 0] : [0, 0, 1, 0],
    tuckTop: gable ? [handleD, 0, handleD, 0] : flap ? [0, 0, 0, 0] : [0, 0, Math.min(0.42 * D, 0.5), 0],
    tuckBottom: [0, 0, 0, 0],
    window: skin.window ? { x: L * 0.16, y: H * 0.28, w: L * 0.68, h: H * 0.42 } : undefined,
  };
  const layout = chainLayout(spec);
  const printTex = sheetTexture(pool, skin, layout, false, low);
  const blankTex = sheetTexture(pool, skin, layout, true, low);
  const mats = skinMats(pool, skin, printTex, blankTex);
  const c = buildChain(pool, spec, layout, mats);

  const root = new THREE.Group();
  const stage = new THREE.Group(); // holds the chain, moved so the folded carton sits at the origin
  root.add(stage);
  stage.add(c.root);

  // gable ends: triangles above walls B and D (a hair in front of the waste so nothing z-fights)
  if (gable) {
    for (const i of [1, 3]) {
      const g = new THREE.BufferGeometry();
      const sx = spec.margin + layout.xs[i];
      const base = layout.yw0 + H;
      const ux = (x: number) => (sx + x) / layout.SW;
      const vy = (y: number) => (base + y) / layout.SH;
      g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, D, 0, 0, D / 2, rise, 0], 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute([ux(0), vy(0), ux(D), vy(0), ux(D / 2), vy(rise)], 2));
      pool.add(g);
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: printTex, roughness: 0.8, side: THREE.DoubleSide }));
      pool.add(m.material as THREE.Material);
      m.position.set(0, H, 0.002);
      c.walls[i].add(m);
    }
  }

  // window film, glued behind the opening in the glue step
  let film: THREE.Mesh | null = null;
  if (skin.window && spec.window) {
    const w = spec.window;
    film = new THREE.Mesh(pool.add(new THREE.PlaneGeometry(w.w + 0.08, w.h + 0.08)), pool.add(new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false })));
    c.walls[0].add(film);
  }

  // print roller and crease-free die
  const roller = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(0.06, 0.06, layout.SH * 1.06, 24)), steel(pool));
  roller.position.z = 0.18;
  stage.add(roller);
  // a bead of glue on the flap
  const bead = new THREE.Mesh(pool.add(new THREE.BoxGeometry(0.03, H * 0.9, 0.012)), pool.add(new THREE.MeshStandardMaterial({ color: "#f6e7a8", roughness: 0.4 })));
  bead.position.set(spec.glueW * 0.6, H / 2, 0.008);
  c.glue.add(bead);

  // other cartons for the last step
  const faceArt = { SW: L, SH: H, fronts: [{ x: 0, y: 0, w: L, h: H }], sides: [] as never[] };
  const faceMat = pool.add(new THREE.MeshStandardMaterial({ map: sheetTexture(pool, skin, faceArt, false, low), roughness: 0.8 }));
  const boxGeo = pool.add(new THREE.BoxGeometry(L, H, D));
  const others = new THREE.InstancedMesh(boxGeo, faceMat, 5);
  others.frustumCulled = false;
  stage.add(others);
  const OX = [-1, 1, -1, 0, 1];
  const OZ = [0, 0, -1, -1, -1];

  const props = createProps(pool, skin, { halfX: L * 1.5, zFront: D / 2 + 0.45, floor: 0, top: H }, low);
  if (props) root.add(props.root);
  const shadow = blobShadow(pool);
  shadow.scale.set(L * 1.8, D * 1.8, 1);
  root.add(shadow);
  const shadowMat = shadow.material as THREE.MeshBasicMaterial;

  const flatCy = H / 2 + (layout.maxTop - layout.maxBot) / 2;
  const closedTop = gable ? roofD * Math.sin(ROOF + 0.0) + rise + handleD : 0;

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t0 = lin(p, 0, 1 / N);
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 4 / N);
    const t4 = lin(p, 4 / N, 5 / N);
    const t5 = lin(p, 5 / N, 1);

    // 0: print wipe with a roller
    const rv = lin(t0, 0.04, 0.94);
    const rx = lerp(-0.5, layout.SW + 0.5, seg(rv, 0, 1)) - spec.margin;
    mats.uReveal.value = p >= 1 / N ? 1 : Math.min(1, Math.max(0, (rx + spec.margin) / layout.SW));
    const printing = p > 0 && p < 1 / N && rv > 0 && rv < 1;
    mats.uScan.value = printing ? 1 : 0;
    roller.visible = printing;
    roller.position.x = rx;
    roller.position.y = H / 2 + (layout.maxTop - layout.maxBot) / 2;

    // 1: steel-rule die presses the sheet, the waste drops away
    const press = seg(t1, 0, 0.3) * (1 - seg(t1, 0.5, 0.8));
    c.knife.visible = p >= 1 / N && p < 2 / N && press > 0.001;
    c.knife.position.z = (1 - seg(t1, 0, 0.3)) * 1.1 - seg(t1, 0.5, 0.8) * 1.1 + 0.0;
    const dropT = seg(t1, 0.55, 1);
    c.waste.visible = p < 2 / N;
    c.waste.position.y = -dropT * 5;
    c.waste.position.z = dropT * 0.6;
    c.waste.rotation.z = dropT * 0.35;
    const cut = p >= 2 / N ? 1 : seg(t1, 0.3, 0.45);
    c.creasesV.visible = c.creasesH.visible = cut > 0.5 && p < 2 / N + 0.004;

    // 2: fold the four walls around
    const f1 = seg(t2, 0.04, 0.42);
    const f2 = seg(t2, 0.22, 0.6);
    const f3 = seg(t2, 0.4, 0.78);
    c.setWall(1, f1);
    c.setWall(2, f2);
    c.setWall(3, f3);
    // 3: the glue flap folds onto the bead
    const fg = seg(t3, 0.3, 0.8);
    c.setGlue(fg);
    bead.scale.set(1, 1, 1 + fg);
    bead.visible = p >= 2 / N && fg < 0.95;
    if (film) {
      film.visible = p >= 3 / N;
      film.position.set(spec.window!.x + spec.window!.w / 2, spec.window!.y + spec.window!.h / 2, -t - 0.03 * (1 - seg(t3, 0, 0.3)));
    }
    // 4: bottom, then the top
    if (flap) {
      // bottom: the two inner (short) flaps, then the two outer (long) flaps; then the same at the top
      c.setBottom(1, seg(t4, 0, 0.12));
      c.setBottom(3, seg(t4, 0, 0.12));
      c.setBottom(0, seg(t4, 0.1, 0.24));
      c.setBottom(2, seg(t4, 0.1, 0.24));
      c.setTop(1, seg(t4, 0.4, 0.58));
      c.setTop(3, seg(t4, 0.4, 0.58));
      c.setTop(0, seg(t4, 0.56, 0.78));
      c.setTop(2, seg(t4, 0.56, 0.78));
    } else {
      c.setBottom(0, seg(t4, 0, 0.3));
      c.setBottom(2, seg(t4, 0.08, 0.38));
    }
    if (flap) {
      // handled above
    } else if (gable) {
      const ang = PI2 - ROOF;
      const fr = seg(t4, 0.35, 0.75);
      for (const i of [0, 2]) {
        c.top[i]!.rotation.x = -fr * ang;
        c.tuckT[i]!.rotation.x = fr * ang;
      }
    } else {
      c.setTop(2, seg(t4, 0.4, 0.72));
      c.setTuckTop(2, seg(t4, 0.62, 0.94));
    }

    // placement: the carton centre sits at the origin once folded
    const fold = (f1 + f2 + f3) / 3;
    c.center();
    c.root.position.set(-lerp((layout.sumW + spec.glueW) / 2, c.cx, fold), -lerp(flatCy, H / 2 + closedTop / 2 + (gable ? 0 : layout.maxTop * 0.15), fold), -c.cz * fold);
    stage.position.set(0, 0, 0);
    shadow.position.set(0, c.root.position.y - 0.02, 0);
    shadowMat.opacity = fold;
    shadow.visible = fold > 0.02;

    // 5: packed with a few more
    const m = t5;
    for (let i = 0; i < 5; i++) {
      const s = seg(m, 0.12 + 0.1 * i, 0.4 + 0.1 * i);
      const xs = OX[i] * (L * 1.18);
      tmpP.set(xs, c.root.position.y + H / 2 + (1 - s) * 0.9, OZ[i] * (D * 1.5));
      tmpS.setScalar(Math.max(s, 0.0001));
      tmpM.compose(tmpP, tmpQ, tmpS);
      others.setMatrixAt(i, tmpM);
    }
    others.instanceMatrix.needsUpdate = true;
    others.visible = p >= 5 / N + 0.01;
    if (props) {
      props.root.position.y = c.root.position.y;
      props.update(seg(t5, 0.55, 1), p);
    }

    // camera: the flat sheet face-on, then round to a three-quarter view, then back for the pack
    const dFlat = fitDistance(cam, layout.SW, layout.SH, 1.08);
    const topClosed = gable ? rise + handleD * 0.9 : 0.05;
    const dFold = fitDistance(cam, Math.max(L, D) * 1.7, lerp(H + layout.maxTop * 0.95, (H + topClosed) * 1.1, seg(t4, 0.3, 0.9)), 1.12);
    const dPack = fitDistance(cam, L * 4.4, H * 3.4 + D, 1.1);
    const a = seg(p, 2 / N - 0.02, 3 / N);
    const dist = lerp(lerp(dFlat, dFold, a), dPack, seg(t5, 0.05, 0.7));
    const yaw = lerp(0, 0.6, a) + lerp(0, -0.5, seg(t4, 0, 1)) + t5 * 0.3;
    const pitch = lerp(0.02, 0.26, a);
    orbit(cam, 0, 0, 0, dist, yaw, pitch);
  };

  return {
    root,
    update,
    dispose() {
      pool.dispose();
      (others as THREE.InstancedMesh).dispose();
    },
  };
};

/** Marker string, so tests can tell which chunk holds this recipe. */
export const RECIPE_ID = "film-recipe:folding-carton";

export default create;
