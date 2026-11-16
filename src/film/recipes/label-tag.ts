import * as THREE from "three";
import type { RecipeCtx, RecipeFactory } from "../types";
import { Pool, fitDistance, lerp, lin, orbit, seg, sheetTexture, steel } from "../kit";

const N = 5; // sheet, print, die-cut, string or peel, apply
const tM = new THREE.Matrix4();
const tP = new THREE.Vector3();
const tQ = new THREE.Quaternion();
const tS = new THREE.Vector3();
const tE = new THREE.Euler();
const ease = (x: number) => x * x * (3 - 2 * x);

function outline(tag: boolean, w: number, h: number, hole: boolean): THREE.Shape {
  const s = new THREE.Shape();
  if (tag) {
    const c = Math.min(w, h) * 0.22;
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    s.lineTo(w / 2, h / 2 - c);
    s.lineTo(w / 2 - c, h / 2);
    s.lineTo(-w / 2 + c, h / 2);
    s.lineTo(-w / 2, h / 2 - c);
    s.closePath();
    if (hole) {
      const hp = new THREE.Path();
      hp.absarc(0, h / 2 - 0.12, 0.04, 0, Math.PI * 2, true);
      s.holes.push(hp);
    }
  } else {
    const r = Math.min(w, h) * 0.26;
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w / 2, h / 2 - r);
    s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w / 2 + r, h / 2);
    s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w / 2, -h / 2 + r);
    s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  }
  return s;
}

/**
 * Hang tag or sticker: a sheet of stock slides in, the artwork is printed across it, a rotary die cuts every shape,
 * the tags get a string (the stickers are lifted off their backing) and one is applied to a product.
 */
const create: RecipeFactory = ({ skin, low }: RecipeCtx) => {
  const pool = new Pool();
  const tag = skin.card !== "sticker";
  const iw = tag ? 0.5 : 0.62;
  const ih = tag ? 1.0 : 0.62;
  const cols = tag ? 5 : 4;
  const rows = tag ? 2 : 3;
  const gap = 0.08;
  const pad = 0.16;
  const SW = cols * iw + (cols - 1) * gap + 2 * pad;
  const SH = rows * ih + (rows - 1) * gap + 2 * pad;
  const count = cols * rows;
  const lead = Math.floor(cols / 2); // top row, middle

  const art = { SW: iw, SH: ih, fronts: [{ x: 0, y: 0, w: iw, h: ih }], sides: [] as never[] };
  const itemPrint = sheetTexture(pool, skin, art, false, low);
  const itemBlank = sheetTexture(pool, skin, art, true, low);

  // item geometry, uv normalised to the item
  const itemGeo = new THREE.ExtrudeGeometry(outline(tag, iw, ih, tag), { depth: 0.012, bevelEnabled: false, curveSegments: 8 });
  const pos = itemGeo.attributes.position;
  const uv = itemGeo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / iw + 0.5, pos.getY(i) / ih + 0.5);
  pool.add(itemGeo);
  const matBlank = pool.add(new THREE.MeshStandardMaterial({ map: itemBlank, roughness: 0.85 }));
  const matPrint = pool.add(new THREE.MeshStandardMaterial({ map: itemPrint, roughness: 0.8 }));

  const liner = tag ? skin.base : "#cfc8b6";
  const sheet = new THREE.Mesh(pool.add(new THREE.BoxGeometry(SW, SH, 0.02)), pool.add(new THREE.MeshStandardMaterial({ color: tag ? new THREE.Color(skin.base).multiplyScalar(0.86) : liner, roughness: 0.9 })));
  sheet.position.z = -0.01;
  const blank = new THREE.InstancedMesh(itemGeo, matBlank, count);
  const printed = new THREE.InstancedMesh(itemGeo, matPrint, count);
  const ringShape = outline(tag, iw + 0.012, ih + 0.012, false);
  const inner = outline(tag, iw - 0.012, ih - 0.012, false);
  ringShape.holes.push(new THREE.Path(inner.getPoints(12).reverse()));
  const ringGeo = pool.add(new THREE.ShapeGeometry(ringShape));
  const rings = new THREE.InstancedMesh(ringGeo, pool.add(new THREE.MeshBasicMaterial({ color: "#2b1d0e", transparent: true, opacity: 0.75, depthWrite: false })), count);
  const loopGeo = pool.add(new THREE.TorusGeometry(0.075, 0.009, 6, 18));
  const loops = new THREE.InstancedMesh(loopGeo, pool.add(new THREE.MeshStandardMaterial({ color: skin.second, roughness: 0.7 })), count);
  for (const m of [blank, printed, rings, loops]) {
    m.frustumCulled = false;
    pool.add(m);
  }
  const sheetG = new THREE.Group();
  sheetG.add(sheet, blank, printed, rings);
  if (tag) sheetG.add(loops);

  // rotary die and the print scan bar
  const roller = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(0.13, 0.13, SH * 1.05, 24)), steel(pool));
  roller.position.z = 0.22;
  const scan = new THREE.Mesh(pool.add(new THREE.BoxGeometry(0.04, SH * 1.04, 0.03)), pool.add(new THREE.MeshBasicMaterial({ color: "#ffd9a0" })));
  scan.position.z = 0.03;
  sheetG.add(scan);

  // the product the label goes on, with a separate lead item and, for the tag, a string
  const prodW = 1.4;
  const prodH = 1.1;
  const prodD = 0.7;
  const product = new THREE.Mesh(pool.add(new THREE.BoxGeometry(prodW, prodH, prodD)), pool.add(new THREE.MeshStandardMaterial({ color: skin.second, roughness: 0.7 })));
  product.position.z = -prodD / 2;
  const leadMesh = new THREE.Mesh(itemGeo, matPrint);
  const stringMesh = new THREE.Mesh(pool.add(new THREE.CylinderGeometry(0.008, 0.008, 1, 5)), pool.add(new THREE.MeshStandardMaterial({ color: skin.second, roughness: 0.7 })));
  const knot = new THREE.Mesh(pool.add(new THREE.SphereGeometry(0.03, 8, 6)), stringMesh.material);
  const root = new THREE.Group();
  root.add(sheetG, roller, product, leadMesh, stringMesh, knot);

  const cx = (c: number) => -SW / 2 + pad + iw / 2 + c * (iw + gap);
  const cy = (r: number) => SH / 2 - pad - ih / 2 - r * (ih + gap);
  const leadX = cx(lead);
  const leadY = cy(0);
  const hookX = -0.35;
  const hookY = prodH / 2;
  const tgtX = tag ? hookX + 0.12 : 0;
  const tgtY = tag ? hookY - 0.62 : -0.02;
  const tgtZ = tag ? 0.09 : 0.014;

  const update = (p: number, cam: THREE.PerspectiveCamera) => {
    const t0 = lin(p, 0, 1 / N);
    const t1 = lin(p, 1 / N, 2 / N);
    const t2 = lin(p, 2 / N, 3 / N);
    const t3 = lin(p, 3 / N, 4 / N);
    const t4 = lin(p, 4 / N, 1);

    // 0: the sheet slides in; 4: it slides away
    const inX = (1 - seg(t0, 0, 0.6)) * SW * 0.55;
    const outX = seg(t4, 0.1, 0.55) * (SW + 3);
    sheetG.position.x = inX - outX;

    // 1: print scan; 2: the die rolls over the sheet; 3: strings or lifted stickers
    const scanX = lerp(-SW / 2 - 0.2, SW / 2 + 0.2, seg(t1, 0.05, 0.95));
    scan.visible = p >= 1 / N && p < 2 / N && t1 > 0.04 && t1 < 0.97;
    scan.position.x = scanX;
    const dieX = lerp(-SW / 2 - 0.3, SW / 2 + 0.3, seg(t2, 0.05, 0.95));
    roller.visible = p >= 2 / N && p < 3 / N && t2 > 0.03 && t2 < 0.98;
    roller.position.x = dieX + sheetG.position.x;
    const lift = seg(t3, 0.1, 0.75);

    for (let i = 0; i < count; i++) {
      const c = i % cols;
      const r = (i / cols) | 0;
      const x = cx(c);
      const y = cy(r);
      const isPrinted = p >= 2 / N || (p >= 1 / N && x < scanX);
      const isCut = p >= 3 / N || (p >= 2 / N && x < dieX);
      const lifted = lift * (isCut ? 1 : 0);
      const hide = p >= 4 / N && i === lead; // the lead item is drawn by leadMesh from here on
      const z = 0.001 + lifted * (tag ? 0.1 : 0.16);
      tE.set(tag ? 0 : lifted * 0.32, 0, 0);
      tQ.setFromEuler(tE);
      tP.set(x, y - (tag ? 0 : lifted * 0.0), z);
      tS.setScalar(hide ? 0.0001 : isPrinted ? 0.0001 : 1);
      tM.compose(tP, tQ, tS);
      blank.setMatrixAt(i, tM);
      tS.setScalar(hide ? 0.0001 : isPrinted ? 1 : 0.0001);
      tM.compose(tP, tQ, tS);
      printed.setMatrixAt(i, tM);
      tS.setScalar(isCut && p < 3 / N + 0.0001 ? 1 : isCut && lift < 0.02 ? 1 : 0.0001);
      tP.z = 0.0135;
      tQ.identity();
      tM.compose(tP, tQ, tS);
      rings.setMatrixAt(i, tM);
      if (tag) {
        const ls = hide ? 0.0001 : Math.max(0.0001, lifted);
        tP.set(x, y + ih / 2 - 0.12 + 0.07 * ls, z + 0.006);
        tE.set(0, Math.PI / 2, 0);
        tQ.setFromEuler(tE);
        tS.setScalar(ls);
        tM.compose(tP, tQ, tS);
        loops.setMatrixAt(i, tM);
      }
    }
    blank.instanceMatrix.needsUpdate = printed.instanceMatrix.needsUpdate = rings.instanceMatrix.needsUpdate = true;
    if (tag) loops.instanceMatrix.needsUpdate = true;

    // 4: the product comes in, the lead item flies to it
    const prodIn = seg(t4, 0, 0.4);
    product.visible = p >= 4 / N;
    product.position.x = (1 - prodIn) * 4;
    product.position.y = 0;
    const fly = ease(seg(t4, 0.2, 0.8));
    leadMesh.visible = p >= 4 / N;
    const sx0 = leadX + inX; // where the lead item sits in the world at the start of this step
    const arc = Math.sin(Math.PI * fly) * 0.45;
    const lz = lerp((tag ? 0.1 : 0.16) + 0.001, tgtZ, fly);
    leadMesh.position.set(lerp(sx0, tgtX + product.position.x, fly), lerp(leadY, tgtY, fly) + arc, lz + arc * 0.6);
    tE.set(tag ? 0 : lerp(0.32, 0, fly), 0, tag ? lerp(0, 0.14, fly) * -1 : 0);
    leadMesh.rotation.copy(tE);
    leadMesh.scale.setScalar(lerp(1, tag ? 0.7 : 0.82, fly));
    stringMesh.visible = knot.visible = tag && p >= 4 / N;
    if (tag) {
      const hx = hookX + product.position.x;
      const ax = leadMesh.position.x;
      const ay = leadMesh.position.y + (ih * 0.5 - 0.12) * leadMesh.scale.x;
      const dx = ax - hx;
      const dy = ay - hookY;
      const len = Math.max(0.001, Math.hypot(dx, dy));
      stringMesh.position.set((ax + hx) / 2, (ay + hookY) / 2, lerp(lz, 0.1, 0.5));
      stringMesh.scale.set(1, len, 1);
      stringMesh.rotation.set(0, 0, Math.atan2(-dx, dy));
      knot.position.set(hx, hookY, 0.1);
    }

    // camera: the sheet face-on, then in on the product
    const dSheet = fitDistance(cam, SW * 1.04, SH * 1.04, 1.05);
    const dProd = fitDistance(cam, prodW * 1.9, prodH * 1.7, 1.05);
    const toProd = seg(p, 4 / N - 0.02, 4 / N + 0.14);
    orbit(cam, 0, 0, 0, lerp(dSheet, dProd, toProd), 0.1 + 0.2 * seg(p, 1 / N, 3 / N) - 0.3 * toProd, 0.06 + 0.1 * toProd);
  };

  return { root, update, dispose: () => pool.dispose() };
};

/** Marker string, so tests can tell which chunk holds this recipe. */
export const RECIPE_ID = "film-recipe:label-tag";

export default create;
