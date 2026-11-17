"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type RootState } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/lib/store";
import { rbox } from "@/lib/geometry";
import { THEMES, type Theme } from "@/lib/palette";
import { seg } from "@/lib/making";
import { setKraftBase, kraftTexture, kraftNormal, contactShadowTexture } from "@/lib/textures";

/* ---------- dimensions (world units) ---------- */
const W = 1.6; // width  (x)
const H = 1.0; // height (y)
const D = 1.2; // depth  (z)
const T = 0.035; // board thickness

interface Pose {
  open: number; // 0 closed .. 1 flaps open
  rotY: number;
}

/** Hero scroll -> target pose. Writes into `out`, allocates nothing. */
function computePose(out: Pose, hero: number) {
  out.open = seg(hero, 0.08, 0.85);
  out.rotY = 0.55 + hero * 1.4;
}

/** Built once per (detail, theme): shared geometries and materials, disposed on change/unmount. */
function buildAssets(detail: 0 | 1 | 2, theme: Theme) {
  setKraftBase(theme.kraft);
  const accent = new THREE.Color(theme.accent);

  const flapFB = rbox(W, T, D / 2, detail).translate(0, 0, D / 4);
  const flapLR = rbox(W * 0.42, T, D - 2 * T, detail).translate(W * 0.21, 0, 0);
  const bottom = rbox(W, T, D, detail);
  const wallFB = rbox(W, H, T, detail);
  const wallLR = rbox(T, H, D - 2 * T, detail);
  const tape = new THREE.BoxGeometry(W + 0.02, 0.006, 0.2);
  const plane = new THREE.PlaneGeometry(1, 1);

  const kraftMap = kraftTexture();
  const shadowMap = contactShadowTexture();
  const normalMap = detail > 0 ? kraftNormal() : null;
  const board = new THREE.MeshStandardMaterial({
    map: kraftMap,
    normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.92,
    metalness: 0,
  });
  const tapeMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4 });
  const glowMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });

  const disposables: { dispose(): void }[] = [
    flapFB, flapLR, bottom, wallFB, wallLR, tape, plane,
    kraftMap, shadowMap, ...(normalMap ? [normalMap] : []),
    board, tapeMat, glowMat, shadowMat,
  ];

  return {
    g: { flapFB, flapLR, bottom, wallFB, wallLR, tape, plane },
    m: { board, tapeMat, glowMat, shadowMat },
    accent,
    look: theme.scene,
    disposables,
  };
}

type Assets = ReturnType<typeof buildAssets>;

/** Hero scroll track is 240vh (HeroStage): pinned until the progress where one viewport of it is left. */
const HERO_PIN_END = 1 - 1 / 2.4;

interface Anim {
  pose: Pose;
  cur: Pose;
  /** Pointer position in -1..1 (target, and the damped value the box actually leans by). */
  ptr: { tx: number; ty: number; x: number; y: number };
}

interface Parts {
  root: React.RefObject<THREE.Group | null>;
  flaps: React.RefObject<(THREE.Group | null)[]>;
  tapeRef: React.RefObject<THREE.Mesh | null>;
  glowRef: React.RefObject<THREE.Mesh | null>;
  shadowRef: React.RefObject<THREE.Mesh | null>;
  light: React.RefObject<THREE.PointLight | null>;
}

/** Per-frame update: mutates refs and materials. No allocation. */
function updateFrame(
  state: RootState,
  delta: number,
  assets: Assets,
  anim: Anim,
  parts: Parts,
  detail: 0 | 1 | 2,
  reducedMotion: boolean,
) {
  const r = parts.root.current;
  if (!r) return;
  const { m } = assets;
  const { pose, cur } = anim;
  computePose(pose, useAppStore.getState().heroProgress);

  const k = reducedMotion ? 60 : 5.5;
  const d = THREE.MathUtils.damp;
  cur.open = d(cur.open, pose.open, k, delta);
  cur.rotY = d(cur.rotY, pose.rotY, k, delta);

  // In frameloop="demand" a single frame is rendered per invalidate(); keep
  // requesting frames until the damped values have caught up with the scroll.
  const ptr = anim.ptr;
  ptr.x = d(ptr.x, ptr.tx, 3.2, delta);
  ptr.y = d(ptr.y, ptr.ty, 3.2, delta);
  if (Math.abs(cur.open - pose.open) + Math.abs(cur.rotY - pose.rotY) + Math.abs(ptr.x - ptr.tx) + Math.abs(ptr.y - ptr.ty) > 0.002) state.invalidate();

  /* layout: box sits beside the text on wide screens, above it on narrow ones */
  const cfg = useAppStore.getState().story3d;
  const vw = state.viewport.width;
  const vh = state.viewport.height;
  const wide = vw > 4.6;
  // on a phone the opened box (tall flaps) would cover the headline below it: it shrinks and lifts as it opens (closed = unchanged, so the poster still matches)
  const fit = Math.min(0.82, vw / 3.9) * cfg.hero.scale * (wide ? 1 : 1 - 0.2 * cur.open);
  const bob = reducedMotion || detail === 0 ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.06;
  r.scale.setScalar(fit);
  // The hero stays pinned for the first (HERO_TRACK - 1) / HERO_TRACK of its scroll track, then scrolls away with its text.
  // The canvas is fixed, so after the pin ends the box rides up with the page (one viewport height over the rest of the track).
  const carry = Math.max(0, (useAppStore.getState().heroProgress - HERO_PIN_END) / (1 - HERO_PIN_END)) * vh;
  r.position.x = wide ? vw * cfg.hero.offsetX : 0;
  // Group origin is the box floor; lift by half the (flaps-open) height to centre it.
  r.position.y = (wide ? vh * cfg.hero.offsetY : vh * (cfg.hero.narrowOffsetY + 0.14 * cur.open)) + bob - 0.62 * fit + carry;
  r.rotation.y = cur.rotY + (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.04) + ptr.x * 0.3;
  r.rotation.x = 0.18 + ptr.y * 0.12;

  /* flaps: front/back lead, sides follow */
  const eFB = seg(cur.open, 0, 0.75);
  const eLR = seg(cur.open, 0.2, 1);
  const [front, back, right, left] = parts.flaps.current;
  const fb = THREE.MathUtils.lerp(-Math.PI, -0.3, eFB);
  const lr = THREE.MathUtils.lerp(Math.PI, 0.3, eLR);
  if (front) front.rotation.x = fb;
  if (back) back.rotation.x = fb;
  if (right) right.rotation.z = lr;
  if (left) left.rotation.z = lr;

  if (parts.tapeRef.current) {
    const s = 1 - seg(cur.open, 0, 0.12);
    parts.tapeRef.current.scale.x = Math.max(0.0001, s);
    parts.tapeRef.current.visible = s > 0.01;
  }
  m.glowMat.opacity = cur.open * 0.85;
  if (parts.glowRef.current) parts.glowRef.current.visible = cur.open > 0.02;
  if (parts.light.current) parts.light.current.intensity = cur.open * 2.4;

  // Contact shadow lies on the ground under the box (not at a fixed world height), so on
  // light themes the box does not look like it floats. bob lifts the box, not the shadow.
  m.shadowMat.opacity = Math.min(1, (0.9 - bob * 2) * assets.look.shadow * cfg.shadow.opacity);
  const sh = parts.shadowRef.current;
  if (sh) {
    sh.position.set(r.position.x, r.position.y - bob + 0.01, r.position.z);
    sh.scale.setScalar((2.4 + cur.open * 0.8) * (fit / 0.82) * assets.look.shadowSpread * cfg.shadow.spread);
  }
}

interface Props {
  detail: 0 | 1 | 2;
  reducedMotion: boolean;
}

export default function Box3D({ detail, reducedMotion }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const assets = useMemo(() => buildAssets(detail, THEMES[themeId]), [detail, themeId]);
  useEffect(() => () => assets.disposables.forEach((d) => d.dispose()), [assets]);

  /* refs mutated every frame (never React state) */
  const anim = useRef<Anim>({ pose: { open: 0, rotY: 0.55 }, cur: { open: 0, rotY: 0.55 }, ptr: { tx: 0, ty: 0, x: 0, y: 0 } });
  const root = useRef<THREE.Group>(null);
  const flaps = useRef<(THREE.Group | null)[]>([null, null, null, null]); // front, back, right, left
  const tapeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const parts: Parts = { root, flaps, tapeRef, glowRef, shadowRef, light };

  useFrame((state, delta) => {
    updateFrame(state, delta, assets, anim.current, parts, detail, reducedMotion);
  });

  // The box leans toward the pointer (fine pointers only: touch screens have none). Listener is passive and writes two numbers.
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (reducedMotion || detail === 0 || !window.matchMedia("(pointer: fine)").matches) return;
    const p = anim.current.ptr;
    const move = (e: PointerEvent) => {
      p.tx = (e.clientX / window.innerWidth) * 2 - 1;
      p.ty = (e.clientY / window.innerHeight) * 2 - 1;
      invalidate();
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reducedMotion, detail, invalidate]);

  const { g, m } = assets;

  return (
    <>
      <group ref={root}>
        {/* ---- body ---- */}
        <mesh geometry={g.bottom} material={m.board} position={[0, T / 2, 0]} />
        <mesh geometry={g.wallFB} material={m.board} position={[0, H / 2, D / 2 - T / 2]} />
        <mesh geometry={g.wallFB} material={m.board} position={[0, H / 2, -D / 2 + T / 2]} />
        <mesh geometry={g.wallLR} material={m.board} position={[W / 2 - T / 2, H / 2, 0]} />
        <mesh geometry={g.wallLR} material={m.board} position={[-W / 2 + T / 2, H / 2, 0]} />

        {/* ---- flaps: pivot groups sit on the top outer edges ---- */}
        <group position={[0, H, D / 2]}>
          <group ref={(n) => void (flaps.current[0] = n)} rotation={[-Math.PI, 0, 0]}>
            <mesh geometry={g.flapFB} material={m.board} />
          </group>
        </group>
        <group position={[0, H, -D / 2]} rotation={[0, Math.PI, 0]}>
          <group ref={(n) => void (flaps.current[1] = n)} rotation={[-Math.PI, 0, 0]}>
            <mesh geometry={g.flapFB} material={m.board} />
          </group>
        </group>
        <group position={[W / 2, H - T * 1.2, 0]}>
          <group ref={(n) => void (flaps.current[2] = n)} rotation={[0, 0, Math.PI]}>
            <mesh geometry={g.flapLR} material={m.board} />
          </group>
        </group>
        <group position={[-W / 2, H - T * 1.2, 0]} rotation={[0, Math.PI, 0]}>
          <group ref={(n) => void (flaps.current[3] = n)} rotation={[0, 0, Math.PI]}>
            <mesh geometry={g.flapLR} material={m.board} />
          </group>
        </group>

        {/* ---- seam tape and interior glow ---- */}
        <mesh ref={tapeRef} geometry={g.tape} material={m.tapeMat} position={[0, H + T + 0.004, 0]} />
        <mesh
          ref={glowRef}
          geometry={g.plane}
          material={m.glowMat}
          position={[0, T + 0.003, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[W - 2 * T, D - 2 * T, 1]}
          visible={false}
        />
        {detail > 0 && <pointLight ref={light} position={[0, H * 0.55, 0]} color={assets.accent} distance={4} intensity={0} />}
      </group>

      {/* blob shadow (cheaper than real shadows, same on every tier) */}
      <mesh ref={shadowRef} geometry={g.plane} material={m.shadowMat} rotation={[-Math.PI / 2, 0, 0]} scale={[2.4, 2.4, 1]} />
    </>
  );
}
