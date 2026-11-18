import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { settle } from "./ease";
import { Pool, rectGeo, steel, PI2, type Mats, type Rect, type SheetArt } from "./kit";

/**
 * A carton or box as one flat sheet of hinged panels: four walls (A front, B side, C back, D side) in a row,
 * a glue flap, flaps above and below each wall, and an optional second flap (a tuck) on each of those.
 * Every part is a child of its hinge, so folding is just rotating groups. Local frame of a wall: x along the
 * wall, y up, the printed face looks to +z and the thickness runs into -z.
 * The sheet is exactly tiled by panels and "waste" pieces, so the flat sheet looks like one solid slab.
 */
export interface ChainSpec {
  widths: [number, number, number, number];
  H: number;
  t: number;
  glueW: number;
  margin: number;
  top: [number, number, number, number];
  bottom: [number, number, number, number];
  /** 0 = folds first (minor), 1 = folds over it (major): raises the flap by one board thickness when closed. */
  topLayer: [number, number, number, number];
  bottomLayer: [number, number, number, number];
  tuckTop: [number, number, number, number];
  tuckBottom: [number, number, number, number];
  /** Window opening in wall A, in the wall's own coordinates. */
  window?: Rect;
  /** Pieces of the top edge that should not be built as flaps (the recipe builds its own, e.g. gable ends). */
  skipTop?: [boolean, boolean, boolean, boolean];
}

export interface ChainLayout extends SheetArt {
  xs: number[];
  sumW: number;
  yw0: number;
  maxTop: number;
  maxBot: number;
}

export function chainLayout(s: ChainSpec): ChainLayout {
  const xs = [0, s.widths[0], s.widths[0] + s.widths[1], s.widths[0] + s.widths[1] + s.widths[2]];
  const sumW = xs[3] + s.widths[3];
  const maxTop = Math.max(...s.top.map((d, i) => d + s.tuckTop[i]));
  const maxBot = Math.max(...s.bottom.map((d, i) => d + s.tuckBottom[i]));
  const SW = s.margin * 2 + sumW + s.glueW;
  const SH = s.margin * 2 + maxBot + s.H + maxTop;
  const yw0 = s.margin + maxBot;
  const wall = (i: number): Rect => ({ x: s.margin + xs[i], y: yw0, w: s.widths[i], h: s.H });
  return { SW, SH, xs, sumW, yw0, maxTop, maxBot, fronts: [wall(0), wall(2)], sides: [wall(1), wall(3)] };
}

export interface Chain {
  root: THREE.Group;
  walls: THREE.Group[];
  glue: THREE.Group;
  top: (THREE.Group | null)[];
  bottom: (THREE.Group | null)[];
  tuckT: (THREE.Group | null)[];
  tuckB: (THREE.Group | null)[];
  waste: THREE.Group;
  knife: THREE.Group;
  creasesV: THREE.Group;
  creasesH: THREE.Group;
  /** x of the vertical creases, left to right. */
  vLines: number[];
  layout: ChainLayout;
  spec: ChainSpec;
  /** Fold of walls B, C, D (index 1..3) about their hinge, 0..1 = 0..90 degrees. */
  setWall(i: number, f: number): void;
  setGlue(f: number): void;
  setTop(i: number, f: number): void;
  setBottom(i: number, f: number): void;
  setTuckTop(i: number, f: number): void;
  setTuckBottom(i: number, f: number): void;
  /** Center of the folded strip seen from above, written to cx / cz. */
  center(): void;
  cx: number;
  cz: number;
}

export function buildChain(pool: Pool, s: ChainSpec, L: ChainLayout, mats: Mats): Chain {
  const { H, t, margin } = s;
  const { SW, SH, xs, sumW, yw0, maxTop, maxBot } = L;
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[] = mats.arr) => new THREE.Mesh(g, m);
  const three = mats.arr.length === 3;
  const rect = (x: number, y: number, w: number, h: number, sx: number, sy: number, trim = 0.003) => rectGeo(pool, x, y, w, h, t, sx, sy, SW, SH, trim, three, mats.packed);

  const root = new THREE.Group();
  const walls: THREE.Group[] = [];
  const top: (THREE.Group | null)[] = [null, null, null, null];
  const bottom: (THREE.Group | null)[] = [null, null, null, null];
  const tuckT: (THREE.Group | null)[] = [null, null, null, null];
  const tuckB: (THREE.Group | null)[] = [null, null, null, null];

  for (let i = 0; i < 4; i++) {
    const w = s.widths[i];
    const g = new THREE.Group();
    g.position.x = i === 0 ? 0 : s.widths[i - 1];
    (i === 0 ? root : walls[i - 1]).add(g);
    walls.push(g);
    const sx = margin + xs[i];
    if (i === 0 && s.window) {
      const o = s.window;
      g.add(mesh(rect(0, 0, w, o.y, sx, yw0)));
      g.add(mesh(rect(0, o.y + o.h, w, H - o.y - o.h, sx, yw0)));
      g.add(mesh(rect(0, o.y, o.x, o.h, sx, yw0)));
      g.add(mesh(rect(o.x + o.w, o.y, w - o.x - o.w, o.h, sx, yw0)));
    } else {
      g.add(mesh(rect(0, 0, w, H, sx, yw0)));
    }
    if (s.top[i] > 0 && !s.skipTop?.[i]) {
      const f = new THREE.Group();
      f.position.y = H;
      f.add(mesh(rect(0, 0, w, s.top[i], sx, yw0 + H)));
      g.add(f);
      top[i] = f;
      if (s.tuckTop[i] > 0) {
        const k = new THREE.Group();
        k.position.y = s.top[i];
        k.add(mesh(rect(0, 0, w, s.tuckTop[i], sx, yw0 + H + s.top[i])));
        f.add(k);
        tuckT[i] = k;
      }
    }
    if (s.bottom[i] > 0) {
      const f = new THREE.Group();
      f.add(mesh(rect(0, -s.bottom[i], w, s.bottom[i], sx, yw0)));
      g.add(f);
      bottom[i] = f;
      if (s.tuckBottom[i] > 0) {
        const k = new THREE.Group();
        k.position.y = -s.bottom[i];
        k.add(mesh(rect(0, -s.tuckBottom[i], w, s.tuckBottom[i], sx, yw0 - s.bottom[i])));
        f.add(k);
        tuckB[i] = k;
      }
    }
  }

  // glue flap: hinged t before the end of wall D and t behind it, so it folds flat against the inside of wall A
  const glue = new THREE.Group();
  glue.position.set(s.widths[3] - t, 0, -t);
  glue.add(mesh(rect(0, 0, s.glueW, H, margin + sumW - t, yw0, 0)));
  walls[3].add(glue);

  // waste: everything on the sheet that is not a panel (borders and the gaps between flaps)
  const waste = new THREE.Group();
  root.add(waste);
  // all waste pieces are merged into two meshes (edges, printed faces): two draw calls instead of two per piece
  const wEdge: THREE.BufferGeometry[] = [];
  const wOuter: THREE.BufferGeometry[] = [];
  const wr = (x: number, y: number, w: number, h: number) => {
    if (w <= 0.002 || h <= 0.002) return;
    const g = rectGeo(new Pool(), x, y, w, h, t, margin, yw0, SW, SH, 0, false, mats.packed);
    const idx = g.index!.array as Uint16Array;
    const e = g.clone();
    e.setIndex(Array.from(idx.subarray(0, 30)));
    e.clearGroups();
    const o = g.clone();
    o.setIndex(Array.from(idx.subarray(30, 36)));
    o.clearGroups();
    wEdge.push(e);
    wOuter.push(o);
    g.dispose();
  };
  wr(-margin, -(maxBot + margin), margin, SH); // left
  wr(sumW + s.glueW, -(maxBot + margin), margin, SH); // right
  wr(0, -(maxBot + margin), sumW + s.glueW, margin); // bottom
  wr(0, H + maxTop, sumW + s.glueW, margin); // top
  for (let i = 0; i < 4; i++) {
    const topUsed = (top[i] ? s.top[i] + s.tuckTop[i] : 0);
    wr(xs[i], H + topUsed, s.widths[i], maxTop - topUsed);
    const botUsed = s.bottom[i] + s.tuckBottom[i];
    wr(xs[i], -maxBot, s.widths[i], maxBot - botUsed);
  }
  wr(sumW, H, s.glueW, maxTop);
  wr(sumW, -maxBot, s.glueW, maxBot);

  waste.add(new THREE.Mesh(pool.add(mergeGeometries(wEdge)), mats.edge), new THREE.Mesh(pool.add(mergeGeometries(wOuter)), mats.outer));
  for (const g of [...wEdge, ...wOuter]) g.dispose();

  // steel-rule die: thin bars along the edge of every panel
  const rects: [number, number, number, number][] = [];
  for (let i = 0; i < 4; i++) {
    rects.push([xs[i], 0, s.widths[i], H]);
    if (top[i]) rects.push([xs[i], H, s.widths[i], s.top[i]]);
    if (tuckT[i]) rects.push([xs[i], H + s.top[i], s.widths[i], s.tuckTop[i]]);
    if (bottom[i]) rects.push([xs[i], -s.bottom[i], s.widths[i], s.bottom[i]]);
    if (tuckB[i]) rects.push([xs[i], -s.bottom[i] - s.tuckBottom[i], s.widths[i], s.tuckBottom[i]]);
  }
  rects.push([sumW, 0, s.glueW, H]);
  const bar = pool.add(new THREE.BoxGeometry(1, 1, 1));
  const knife = new THREE.Group();
  const rules = new THREE.InstancedMesh(bar, steel(pool, "#6c7378"), rects.length * 4);
  const m4 = new THREE.Matrix4();
  const kw = 0.018;
  let n = 0;
  for (const [x, y, w, h] of rects) {
    const put = (cx: number, cy: number, sx: number, sy: number) => {
      m4.makeScale(sx, sy, 0.08).setPosition(cx, cy, 0.04);
      rules.setMatrixAt(n++, m4);
    };
    put(x + w / 2, y, w, kw);
    put(x + w / 2, y + h, w, kw);
    put(x, y + h / 2, kw, h);
    put(x + w, y + h / 2, kw, h);
  }
  rules.instanceMatrix.needsUpdate = true;
  rules.frustumCulled = false;
  knife.add(rules);
  root.add(knife);

  // crease lines (dark grooves), drawn after the cut or by the crease roller
  const creaseMat = pool.add(new THREE.MeshBasicMaterial({ color: "#2b1d0e", transparent: true, opacity: 0.38, depthWrite: false }));
  const vLines = [xs[1], xs[2], xs[3], sumW];
  const creasesV = new THREE.Group();
  const creasesH = new THREE.Group();
  const line = (g: THREE.Group, x: number, y: number, w: number, h: number) => {
    const m = new THREE.Mesh(bar, creaseMat);
    m.scale.set(w, h, 0.002);
    m.position.set(x, y, 0.004);
    g.add(m);
  };
  for (const x of vLines) line(creasesV, x, H / 2, 0.014, H);
  line(creasesH, sumW / 2, 0, sumW, 0.014);
  line(creasesH, sumW / 2, H, sumW, 0.014);
  root.add(creasesV, creasesH);

  const chain: Chain = {
    root, walls, glue, top, bottom, tuckT, tuckB, waste, knife, creasesV, creasesH, vLines, layout: L, spec: s, cx: 0, cz: 0,
    setWall(i, f) { walls[i].rotation.y = settle(f) * PI2; fold[i] = f; },
    setGlue(f) { glue.rotation.y = settle(f, 0.02) * PI2; },
    setTop(i, f) { const g = top[i]; if (g) { g.rotation.x = -f * PI2; g.position.y = H + s.topLayer[i] * t * f; } },
    setBottom(i, f) { const g = bottom[i]; if (g) { g.rotation.x = f * PI2; g.position.y = -s.bottomLayer[i] * t * f; } },
    setTuckTop(i, f) { const g = tuckT[i]; if (g) g.rotation.x = -settle(f, 0.03) * PI2; },
    setTuckBottom(i, f) { const g = tuckB[i]; if (g) g.rotation.x = f * PI2; },
    center() {
      let x = 0, z = 0, th = 0;
      let x0 = 0, x1 = 0, z0 = 0, z1 = 0;
      for (let i = 0; i < 4; i++) {
        th += fold[i] * PI2;
        x += s.widths[i] * Math.cos(th);
        z -= s.widths[i] * Math.sin(th);
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (z < z0) z0 = z; if (z > z1) z1 = z;
      }
      chain.cx = (x0 + x1) / 2;
      chain.cz = (z0 + z1) / 2;
    },
  };
  const fold = [0, 0, 0, 0];
  return chain;
}
