"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createPackMaterial, type MaterialKind } from "@/lib/textures";
import type { ModelId } from "@/lib/configurator";

/* All models are built from a handful of shared geometries + 2 materials (board + accent),
   so each stays under ~12 draw calls. Origin = centre of the floor footprint, +y up. */

const T = 0.03; // board thickness (constant, so resizing never distorts the walls)
const ACCENT = "#ff5b2e";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Height profile of a bulged pouch / pillow bag at (u,v) in [-1,1] x [0,1]. */
function bulgeAt(u: number, v: number, bulge: number, stand: boolean) {
  const side = Math.pow(Math.max(0, 1 - u * u), stand ? 0.8 : 0.7);
  if (stand) return bulge * side * (1 - smooth(0.72, 0.93, v)) * (0.3 + 0.7 * smooth(0, 0.22, v));
  return bulge * side * Math.pow(Math.sin(Math.PI * clamp(v, 0, 1)), 0.55);
}

function pillow(w: number, h: number, bulge: number, stand: boolean) {
  const g = new THREE.PlaneGeometry(w, h, 18, 26).translate(0, h / 2, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    p.setZ(i, bulgeAt(p.getX(i) / (w / 2), p.getY(i) / h, bulge, stand));
  }
  g.computeVertexNormals();
  return g;
}

/** A thin strip that hugs the pillow surface at height fraction v (zip line, tamper tape). */
function ribbon(w: number, h: number, v: number, thick: number, bulge: number, stand: boolean) {
  const g = new THREE.PlaneGeometry(w * 0.94, thick, 18, 1).translate(0, v * h, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    p.setZ(i, bulgeAt(p.getX(i) / (w / 2), v, bulge, stand) + 0.004);
  }
  g.computeVertexNormals();
  return g;
}

interface Dims {
  l: number; // x
  w: number; // z
  h: number; // y
}

interface Parts {
  board: THREE.Material;
  accent: THREE.Material;
}

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

/* ---------- 1. Corrugated shipping carton (closed, taped) ---------- */
function Carton({ l, w, h, board, accent }: Dims & Parts) {
  const g = useMemo(() => ({
      body: new THREE.BoxGeometry(l, h, w),
      tape: new THREE.BoxGeometry(l + 0.01, 0.006, Math.min(0.16, w * 0.3)),
      seam: new THREE.BoxGeometry(l + 0.004, 0.004, 0.006),
      front: new THREE.PlaneGeometry(Math.min(l, w) * 0.5, h * 0.12),
    }), [l, w, h]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.body} material={board} position={[0, h / 2, 0]} />
      <mesh geometry={g.seam} material={board} position={[0, h + 0.003, 0]} />
      <mesh geometry={g.tape} material={accent} position={[0, h + 0.006, 0]} />
      <mesh geometry={g.front} material={accent} position={[0, h * 0.55, w / 2 + 0.002]} />
    </group>
  );
}

/* ---------- 2. Folding carton (tuck-top with open lid) ---------- */
function Folding({ l, w, h, board, accent }: Dims & Parts) {
  const g = useMemo(() => ({
      body: new THREE.BoxGeometry(l, h, w),
      lid: new THREE.BoxGeometry(l, T, w * 0.92).translate(0, 0, w * 0.46),
      tuck: new THREE.BoxGeometry(l * 0.9, T, w * 0.22).translate(0, 0, w * 0.11),
      band: new THREE.PlaneGeometry(l * 0.84, h * 0.14),
    }), [l, w, h]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.body} material={board} position={[0, h / 2, 0]} />
      {/* lid hinged on the back edge, swung open */}
      <group position={[0, h, -w / 2]} rotation={[-2.0, 0, 0]}>
        <mesh geometry={g.lid} material={board} />
        <group position={[0, 0, w * 0.92]} rotation={[0.9, 0, 0]}>
          <mesh geometry={g.tuck} material={board} />
        </group>
      </group>
      <mesh geometry={g.band} material={accent} position={[0, h * 0.62, w / 2 + 0.002]} />
    </group>
  );
}

/* ---------- 3. Rigid gift box (base + lift-off lid, accent lining) ---------- */
function Rigid({ l, w, h, board, accent }: Dims & Parts) {
  const baseH = h * 0.6;
  const lidH = h * 0.48;
  const g = useMemo(() => ({
      base: new THREE.BoxGeometry(l, baseH, w),
      lining: new THREE.PlaneGeometry(l - 0.1, w - 0.1),
      lid: new THREE.BoxGeometry(l + 0.05, lidH, w + 0.05),
      pull: new THREE.BoxGeometry(0.1, 0.02, 0.2),
    }), [l, w, baseH, lidH]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.base} material={board} position={[0, baseH / 2, 0]} />
      <mesh geometry={g.lining} material={accent} position={[0, baseH + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      {/* lid lifted and tilted off the back edge */}
      <group position={[0, baseH, -w / 2 - 0.03]} rotation={[-1.1, 0, 0]}>
        <mesh geometry={g.lid} material={board} position={[0, lidH / 2, (w + 0.05) / 2]} />
      </group>
      <mesh geometry={g.pull} material={accent} position={[0, baseH * 0.9, w / 2 + 0.01]} />
    </group>
  );
}

/* ---------- 4. Stand-up pouch ---------- */
function Pouch({ l, w, h, board, accent }: Dims & Parts) {
  const bulge = Math.max(0.05, w / 2);
  const g = useMemo(() => ({
      face: pillow(l, h, bulge, true),
      base: new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2).scale(l / 2, 1, bulge),
      zip: ribbon(l, h, 0.78, 0.018, bulge, true),
    }), [l, h, bulge]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.face} material={board} />
      <mesh geometry={g.face} material={board} rotation={[0, Math.PI, 0]} />
      <mesh geometry={g.base} material={board} position={[0, 0.002, 0]} />
      <mesh geometry={g.zip} material={accent} />
      <mesh geometry={g.zip} material={accent} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

/* ---------- 5. Poly / courier bag (flat pillow, tamper tape) ---------- */
function Courier({ l, w, h, board, accent }: Dims & Parts) {
  const bulge = Math.max(0.03, Math.min(w / 2, 0.14));
  const g = useMemo(() => ({
      face: pillow(l, h, bulge, false),
      tape: ribbon(l, h, 0.86, 0.07, bulge, false),
    }), [l, h, bulge]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.face} material={board} />
      <mesh geometry={g.face} material={board} rotation={[0, Math.PI, 0]} />
      <mesh geometry={g.tape} material={accent} />
    </group>
  );
}

/* ---------- 6. Paper bag with handles ---------- */
function PaperBag({ l, w, h, board, accent }: Dims & Parts) {
  const handleR = Math.min(l, w * 2) * 0.22;
  const g = useMemo(() => ({
      wallFB: new THREE.BoxGeometry(l, h, T),
      wallLR: new THREE.BoxGeometry(T, h, w - 2 * T),
      bottom: new THREE.BoxGeometry(l, T, w),
      handle: new THREE.TorusGeometry(handleR, 0.012, 8, 24, Math.PI),
      band: new THREE.PlaneGeometry(l * 0.5, h * 0.1),
    }), [l, w, h, handleR]);
  useDisposeGeoms(g);
  return (
    <group>
      <mesh geometry={g.bottom} material={board} position={[0, T / 2, 0]} />
      <mesh geometry={g.wallFB} material={board} position={[0, h / 2, w / 2 - T / 2]} />
      <mesh geometry={g.wallFB} material={board} position={[0, h / 2, -w / 2 + T / 2]} />
      <mesh geometry={g.wallLR} material={board} position={[l / 2 - T / 2, h / 2, 0]} />
      <mesh geometry={g.wallLR} material={board} position={[-l / 2 + T / 2, h / 2, 0]} />
      <mesh geometry={g.handle} material={board} position={[0, h - 0.02, w / 2 - 0.05]} />
      <mesh geometry={g.handle} material={board} position={[0, h - 0.02, -w / 2 + 0.05]} />
      <mesh geometry={g.band} material={accent} position={[0, h * 0.5, w / 2 + 0.002]} />
    </group>
  );
}

interface Props extends Dims {
  model: ModelId;
  material: MaterialKind;
}

/** Procedural model library. Dims are world units; origin is the floor centre. */
export default function PackModel({ model, material, l, w, h }: Props) {
  const parts = useMemo(() => {
    const board = createPackMaterial(material);
    const accent = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.45, side: THREE.DoubleSide });
    return { board, accent };
  }, [material]);

  useEffect(
    () => () => {
      parts.board.dispose();
      parts.accent.dispose();
    },
    [parts],
  );

  const p: Dims & Parts = { l, w, h, board: parts.board.material, accent: parts.accent };
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
