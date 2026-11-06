"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { composePanel, hasArt, type ArtMap, type Panel } from "@/lib/artwork";
import { PANELS, type ModelId } from "@/lib/configurator";
import { createPackMaterial, type MaterialKind } from "@/lib/textures";

/* All models are built from a handful of shared geometries + a base board material, plus one
   material per printed panel. Origin = centre of the floor footprint, +y up, front = +z. */

const T = 0.03; // board thickness (constant, so resizing never distorts the walls)
const ACCENT = "#ff5b2e";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

type Detail = 0 | 1 | 2;

/** Box factory (Step 4 swaps in beveled edges here). */
function box(w: number, h: number, d: number, _detail: Detail = 0, _radius = 0) {
  void _detail;
  void _radius;
  return new THREE.BoxGeometry(w, h, d);
}

/** Height profile of a flat pillow bag (courier / poly) at (u,v) in [-1,1] x [0,1]. */
function pillowZ(u: number, v: number, bulge: number) {
  return bulge * Math.pow(Math.max(0, 1 - u * u), 0.7) * Math.pow(Math.sin(Math.PI * clamp(v, 0, 1)), 0.55);
}

/** Where the heat-sealed top ends (fraction of height); matches the crimp band in composePanel. */
const POUCH_SEAL = 0.89;

/**
 * Stand-up pouch panel profile. Seen from the side it is a wedge: full depth `d` at the base,
 * tapering to a flat heat seal at the top. Faces are flat across the width; the side seals are
 * diagonal gusset seals, and the bottom corners are pulled in so the base reads as a boat shape.
 */
function pouchZ(u: number, v: number, d: number) {
  const wedge = Math.pow(1 - smooth(0, POUCH_SEAL, v), 0.9);
  const pinch = 1 - (0.25 + 0.75 * smooth(0, 0.62, v)) * Math.pow(Math.abs(u), 2.2);
  const belly = 0.12 * d * Math.sin(Math.PI * clamp(v / POUCH_SEAL, 0, 1)) * (1 - u * u); // slight bulge
  return d * wedge * pinch + belly;
}

type ZFn = (u: number, v: number) => number;

function surface(w: number, h: number, z: ZFn, sx: number, sy: number) {
  const g = new THREE.PlaneGeometry(w, h, sx, sy).translate(0, h / 2, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, z(p.getX(i) / (w / 2), p.getY(i) / h));
  g.computeVertexNormals();
  return g;
}

/** A thin strip that hugs a surface at height fraction v (zip line, tamper tape). */
function ribbon(w: number, h: number, v: number, thick: number, z: ZFn) {
  const g = new THREE.PlaneGeometry(w * 0.94, thick, 24, 1).translate(0, v * h, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setZ(i, z(p.getX(i) / (w / 2), v) + 0.004);
  g.computeVertexNormals();
  return g;
}

/** Flat boat-shaped gusset base, outlined by the faces' bottom edge. */
function pouchBase(w: number, d: number) {
  const pts: THREE.Vector2[] = [];
  const n = 20;
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n;
    pts.push(new THREE.Vector2((u * w) / 2, pouchZ(u, 0, d)));
  }
  for (let i = n; i >= 0; i--) {
    const u = -1 + (2 * i) / n;
    pts.push(new THREE.Vector2((u * w) / 2, -pouchZ(u, 0, d)));
  }
  return new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(Math.PI / 2);
}

interface Dims {
  l: number; // x
  w: number; // z
  h: number; // y
}

/** Faces of a BoxGeometry, in material-array order. */
interface Faces {
  px?: THREE.Material;
  nx?: THREE.Material;
  py?: THREE.Material;
  ny?: THREE.Material;
  pz?: THREE.Material;
  nz?: THREE.Material;
}

interface Parts {
  board: THREE.Material;
  accent: THREE.Material;
  panel: Partial<Record<Panel, THREE.Material>>;
  /** Top panel split across two flaps (carton only). */
  topHalves: [THREE.Material, THREE.Material] | null;
  detail: Detail;
  open: boolean;
}

/** Per-face materials. Collapses to ONE material (one draw call) when no face is overridden. */
const mat6 = (b: THREE.Material, f: Faces) =>
  f.px || f.nx || f.py || f.ny || f.pz || f.nz
    ? [f.px ?? b, f.nx ?? b, f.py ?? b, f.ny ?? b, f.pz ?? b, f.nz ?? b]
    : b;

/** Disposes every BufferGeometry held in `geoms` when it changes or the model unmounts. */
function useDisposeGeoms(geoms: Record<string, unknown>) {
  useEffect(
    () => () => {
      for (const g of Object.values(geoms)) {
        if (g instanceof THREE.BufferGeometry) g.dispose();
      }
    },
    [geoms],
  );
}

/** Damped open/close animation applied through refs (no React state, no allocation per frame). */
function useOpenAnim(open: boolean, apply: (t: number) => void) {
  const cur = useRef(open ? 1 : 0);
  const last = useRef(Number.NaN);
  const applyRef = useRef(apply);
  // Each commit may rebuild pivots (new dims): force a re-apply on the next frame.
  useLayoutEffect(() => {
    applyRef.current = apply;
    last.current = Number.NaN;
  });
  useFrame((state, delta) => {
    const target = open ? 1 : 0;
    cur.current = THREE.MathUtils.damp(cur.current, target, 5, delta);
    if (Math.abs(cur.current - target) < 0.0015) cur.current = target;
    if (cur.current !== last.current) {
      applyRef.current(cur.current);
      last.current = cur.current;
    }
    if (cur.current !== target) state.invalidate(); // keep rendering in frameloop="demand"
  });
}

/* ---------- 1. Corrugated shipping carton (walls + four real flaps) ---------- */
function Carton({ l, w, h, board, accent, panel, topHalves, detail, open }: Dims & Parts) {
  const g = useMemo(
    () => ({
      bottom: box(l, T, w, detail),
      wallFB: box(l, h, T, detail),
      wallLR: box(T, h, w - 2 * T, detail),
      flapFB: box(l, T, w / 2, detail).translate(0, 0, w / 4),
      flapLR: box(l * 0.42, T, w - 2 * T, detail).translate(l * 0.21, 0, 0),
      tape: new THREE.BoxGeometry(l + 0.01, 0.006, Math.min(0.16, w * 0.3)),
    }),
    [l, w, h, detail],
  );
  useDisposeGeoms(g);

  const flaps = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const tape = useRef<THREE.Mesh>(null);
  useOpenAnim(open, (t) => {
    const fb = lerp(-Math.PI, -0.3, smooth(0, 0.75, t));
    const lr = lerp(Math.PI, 0.3, smooth(0.2, 1, t));
    const [f, b, r, le] = flaps.current;
    if (f) f.rotation.x = fb;
    if (b) b.rotation.x = fb;
    if (r) r.rotation.z = lr;
    if (le) le.rotation.z = lr;
    if (tape.current) tape.current.visible = !topHalves && t < 0.04; // a printed top replaces the plain tape
  });

  const wall = (f: Faces) => mat6(board, f);
  return (
    <group>
      <mesh geometry={g.bottom} material={board} position={[0, T / 2, 0]} />
      <mesh geometry={g.wallFB} material={wall({ pz: panel.front })} position={[0, h / 2, w / 2 - T / 2]} />
      <mesh geometry={g.wallFB} material={wall({ nz: panel.back })} position={[0, h / 2, -w / 2 + T / 2]} />
      <mesh geometry={g.wallLR} material={wall({ px: panel.right })} position={[l / 2 - T / 2, h / 2, 0]} />
      <mesh geometry={g.wallLR} material={wall({ nx: panel.left })} position={[-l / 2 + T / 2, h / 2, 0]} />

      {/* flaps hinge on the top outer edges; the printed (outer) face of a flap is its -y face */}
      <group position={[0, h, w / 2]}>
        <group ref={(n) => void (flaps.current[0] = n)} rotation={[-Math.PI, 0, 0]}>
          <mesh geometry={g.flapFB} material={mat6(board, { ny: topHalves?.[0] })} />
        </group>
      </group>
      <group position={[0, h, -w / 2]} rotation={[0, Math.PI, 0]}>
        <group ref={(n) => void (flaps.current[1] = n)} rotation={[-Math.PI, 0, 0]}>
          <mesh geometry={g.flapFB} material={mat6(board, { ny: topHalves?.[1] })} />
        </group>
      </group>
      <group position={[l / 2, h - T * 1.2, 0]}>
        <group ref={(n) => void (flaps.current[2] = n)} rotation={[0, 0, Math.PI]}>
          <mesh geometry={g.flapLR} material={board} />
        </group>
      </group>
      <group position={[-l / 2, h - T * 1.2, 0]} rotation={[0, Math.PI, 0]}>
        <group ref={(n) => void (flaps.current[3] = n)} rotation={[0, 0, Math.PI]}>
          <mesh geometry={g.flapLR} material={board} />
        </group>
      </group>
      <mesh ref={tape} geometry={g.tape} material={accent} position={[0, h + T + 0.006, 0]} />
    </group>
  );
}

/* ---------- 2. Folding carton (tuck-top lid that opens) ---------- */
function Folding({ l, w, h, board, panel, detail, open }: Dims & Parts) {
  const g = useMemo(
    () => ({
      body: box(l, h, w, detail, 0.02),
      lid: box(l, T, w * 0.92, detail).translate(0, 0, w * 0.46),
      tuck: box(l * 0.9, T, w * 0.22, detail).translate(0, 0, w * 0.11),
    }),
    [l, w, h, detail],
  );
  useDisposeGeoms(g);

  const lid = useRef<THREE.Group>(null);
  const tuck = useRef<THREE.Group>(null);
  useOpenAnim(open, (t) => {
    if (lid.current) lid.current.rotation.x = lerp(0, -2.0, t);
    if (tuck.current) tuck.current.rotation.x = lerp(1.45, 0.6, smooth(0, 1, t));
  });

  return (
    <group>
      <mesh
        geometry={g.body}
        material={mat6(board, { pz: panel.front, nz: panel.back, px: panel.right, nx: panel.left })}
        position={[0, h / 2, 0]}
      />
      {/* lid hinged on the back edge */}
      <group ref={lid} position={[0, h + T / 2, -w / 2]}>
        <mesh geometry={g.lid} material={mat6(board, { py: panel.top })} />
        <group ref={tuck} position={[0, 0, w * 0.92]}>
          <mesh geometry={g.tuck} material={board} />
        </group>
      </group>
    </group>
  );
}

/* ---------- 3. Rigid gift box (base + lift-off lid, accent lining) ---------- */
function Rigid({ l, w, h, board, accent, panel, detail, open }: Dims & Parts) {
  const baseH = h * 0.6;
  const lidH = h * 0.48;
  const g = useMemo(
    () => ({
      base: box(l, baseH, w, detail, 0.02),
      lining: new THREE.PlaneGeometry(l - 0.1, w - 0.1),
      lid: box(l + 0.05, lidH, w + 0.05, detail, 0.02),
      pull: box(0.1, 0.02, 0.2, 0),
    }),
    [l, w, baseH, lidH, detail],
  );
  useDisposeGeoms(g);

  const lid = useRef<THREE.Group>(null);
  useOpenAnim(open, (t) => {
    if (lid.current) lid.current.rotation.x = lerp(0, -1.9, t);
  });

  return (
    <group>
      <mesh geometry={g.base} material={board} position={[0, baseH / 2, 0]} />
      <mesh geometry={g.lining} material={accent} position={[0, baseH + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <group ref={lid} position={[0, baseH, -w / 2 - 0.025]}>
        <mesh
          geometry={g.lid}
          material={mat6(board, { pz: panel.front, nz: panel.back, px: panel.right, nx: panel.left, py: panel.top })}
          position={[0, lidH / 2, (w + 0.05) / 2]}
        />
      </group>
      <mesh geometry={g.pull} material={accent} position={[0, baseH * 0.9, w / 2 + 0.01]} />
    </group>
  );
}

/* ---------- 4. Stand-up pouch (flat faces, gusseted base, heat-sealed top, tear notches) ---------- */
function Pouch({ l, w, h, board, accent, panel }: Dims & Parts) {
  const d = Math.max(0.06, w / 2);
  const g = useMemo(() => {
    const z: ZFn = (u, v) => pouchZ(u, v, d);
    return {
      face: surface(l, h, z, 16, 28),
      base: pouchBase(l, d),
      zip: ribbon(l, h, 0.78, 0.018, z),
    };
  }, [l, h, d]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.face} material={panel.front ?? board} />
      <mesh geometry={g.face} material={panel.back ?? board} rotation={[0, Math.PI, 0]} />
      <mesh geometry={g.base} material={board} position={[0, 0.002, 0]} />
      <mesh geometry={g.zip} material={accent} />
      <mesh geometry={g.zip} material={accent} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

/* ---------- 5. Poly / courier bag (flat pillow, tamper tape) ---------- */
function Courier({ l, w, h, board, accent, panel }: Dims & Parts) {
  const bulge = Math.max(0.03, Math.min(w / 2, 0.14));
  const g = useMemo(() => {
    const z: ZFn = (u, v) => pillowZ(u, v, bulge);
    return { face: surface(l, h, z, 18, 26), tape: ribbon(l, h, 0.86, 0.07, z) };
  }, [l, h, bulge]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.face} material={panel.front ?? board} />
      <mesh geometry={g.face} material={panel.back ?? board} rotation={[0, Math.PI, 0]} />
      <mesh geometry={g.tape} material={accent} />
    </group>
  );
}

/* ---------- 6. Paper bag with handles ---------- */
function PaperBag({ l, w, h, board, panel, detail }: Dims & Parts) {
  const handleR = Math.min(l, w * 2) * 0.22;
  const g = useMemo(
    () => ({
      wallFB: box(l, h, T, detail),
      wallLR: box(T, h, w - 2 * T, detail),
      bottom: box(l, T, w, detail),
      handle: new THREE.TorusGeometry(handleR, 0.012, 8, 24, Math.PI),
    }),
    [l, w, h, handleR, detail],
  );
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.bottom} material={board} position={[0, T / 2, 0]} />
      <mesh geometry={g.wallFB} material={mat6(board, { pz: panel.front })} position={[0, h / 2, w / 2 - T / 2]} />
      <mesh geometry={g.wallFB} material={mat6(board, { nz: panel.back })} position={[0, h / 2, -w / 2 + T / 2]} />
      <mesh geometry={g.wallLR} material={mat6(board, { px: panel.right })} position={[l / 2 - T / 2, h / 2, 0]} />
      <mesh geometry={g.wallLR} material={mat6(board, { nx: panel.left })} position={[-l / 2 + T / 2, h / 2, 0]} />
      <mesh geometry={g.handle} material={board} position={[0, h - 0.02, w / 2 - 0.05]} />
      <mesh geometry={g.handle} material={board} position={[0, h - 0.02, -w / 2 + 0.05]} />
    </group>
  );
}

/* ---------- panel artwork -> materials ---------- */

/** Physical panel proportions (only the ratio is used for the canvas). */
export function panelAspects(model: ModelId, l: number, w: number, h: number): Record<Panel, number> {
  const hh = model === "rigid" ? h * 0.48 : h;
  return { front: l / hh, back: l / hh, left: w / hh, right: w / hh, top: l / w };
}

interface PanelSet {
  base: ReturnType<typeof createPackMaterial>;
  panel: Partial<Record<Panel, THREE.Material>>;
  topHalves: [THREE.Material, THREE.Material] | null;
  dispose(): void;
}

function buildPanelSet(model: ModelId, kind: MaterialKind, d: Dims, art: ArtMap, detail: Detail): PanelSet {
  const base = createPackMaterial(kind, detail);
  const maxPx = detail === 0 ? 512 : 1024;
  const aspects = panelAspects(model, d.l, d.w, d.h);
  const pouch = model === "pouch";
  const owned: { dispose(): void }[] = [];
  const panel: Partial<Record<Panel, THREE.Material>> = {};
  let topHalves: [THREE.Material, THREE.Material] | null = null;

  for (const p of PANELS[model]) {
    if (!hasArt(art[p]) && !pouch) continue;
    const tex = composePanel({ kind, aspect: aspects[p], maxPx, art: art[p], deco: pouch ? "pouch" : null });
    owned.push(tex);

    if (model === "carton" && p === "top") {
      // The top print is shared by the two major flaps: each shows one half of the texture.
      // Front flap: lower half, unchanged. Back flap sits in a flipped frame, so its half is
      // mirrored in both axes to read upright from the front.
      const halves = [
        { rx: 1, ry: 0.5, ox: 0, oy: 0 },
        { rx: -1, ry: -0.5, ox: 1, oy: 1 },
      ].map((u) => {
        const t = tex.clone();
        t.repeat.set(u.rx, u.ry);
        t.offset.set(u.ox, u.oy);
        t.needsUpdate = true;
        owned.push(t);
        const m = base.material.clone();
        m.map = t;
        owned.push(m);
        return m;
      });
      topHalves = [halves[0], halves[1]];
      continue;
    }

    const m = base.material.clone();
    m.map = tex;
    if (pouch) m.alphaTest = 0.5; // cuts out the tear notches
    owned.push(m);
    panel[p] = m;
  }

  return {
    base,
    panel,
    topHalves,
    dispose() {
      owned.forEach((o) => o.dispose());
      base.dispose();
    },
  };
}

interface Props extends Dims {
  model: ModelId;
  material: MaterialKind;
  art: ArtMap;
  open: boolean;
  detail: Detail;
}

/** Procedural model library. Dims are world units; origin is the floor centre. */
export default function PackModel({ model, material, art, open, detail, l, w, h }: Props) {
  const set = useMemo(() => buildPanelSet(model, material, { l, w, h }, art, detail), [model, material, art, detail, l, w, h]);
  const accent = useMemo(() => new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.45, side: THREE.DoubleSide }), []);

  // Old textures/materials are freed whenever the inputs (and therefore `set`) change.
  useEffect(() => () => set.dispose(), [set]);
  useEffect(() => () => accent.dispose(), [accent]);

  const p: Dims & Parts = {
    l, w, h,
    board: set.base.material,
    accent,
    panel: set.panel,
    topHalves: set.topHalves,
    detail,
    open,
  };
  switch (model) {
    case "folding":
      return <Folding {...p} />;
    case "rigid":
      return <Rigid {...p} />;
    case "pouch":
      return <Pouch {...p} />;
    case "courier":
      return <Courier {...p} />;
    case "paperbag":
      return <PaperBag {...p} />;
    default:
      return <Carton {...p} />;
  }
}
