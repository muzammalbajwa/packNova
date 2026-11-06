"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/lib/store";
import { rbox } from "@/lib/geometry";
import { kraftTexture, kraftNormal, logoTexture, labelTexture, contactShadowTexture, mulberry32 } from "@/lib/textures";

/* ---------- dimensions (world units) ---------- */
const W = 1.6; // width  (x)
const H = 1.0; // height (y)
const D = 1.2; // depth  (z)
const T = 0.035; // board thickness

/* ---------- scroll -> pose ---------- */

/** Smoothstep over [a, b]. */
const seg = (v: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

interface Pose {
  open: number; // 0 closed .. 1 flaps open
  blue: number; // blueprint look (Design)
  print: number; // dark printed box + logo (Print)
  label: number; // shipping label (Deliver)
  travel: number; // motion streaks / fly-off (Deliver)
  rotY: number;
  side: number; // -1 left .. 1 right (desktop layout)
}

/** Writes the target pose for the current scroll position. No allocation. */
function computePose(out: Pose, hero: number, story: number) {
  if (story <= 0.0005) {
    out.open = seg(hero, 0.08, 0.85);
    out.blue = 0;
    out.print = 0;
    out.label = 0;
    out.travel = 0;
    out.rotY = 0.55 + hero * 1.4;
    out.side = 1;
    return;
  }
  const p = story;
  const closing = seg(p, 0.28, 0.4);
  out.open = 1 - closing;
  out.blue = seg(p, 0, 0.06) * (1 - closing);
  out.print = seg(p, 0.38, 0.5);
  out.label = seg(p, 0.7, 0.8);
  out.travel = seg(p, 0.66, 1);
  out.rotY = 1.95 + p * Math.PI * 1.2;
  out.side = 1 - 2 * seg(p, 0.28, 0.38) + 2 * seg(p, 0.62, 0.72);
}

/* ---------- shared colors (never allocated per frame) ---------- */
const KRAFT = new THREE.Color("#ffffff"); // texture carries the kraft color
const BLUE = new THREE.Color("#4d7cff");
const PRINT = new THREE.Color("#5a5148");
const BLUE_GLOW = new THREE.Color("#0c2c9a");
const ACCENT = new THREE.Color("#ff5b2e");

function buildAssets(detail: 0 | 1 | 2) {
    // Beveled meshes; the blueprint edge lines are traced on the plain boxes (clean outlines).
    const flapFB = rbox(W, T, D / 2, detail).translate(0, 0, D / 4);
    const flapLR = rbox(W * 0.42, T, D - 2 * T, detail).translate(W * 0.21, 0, 0);
    const bottom = rbox(W, T, D, detail);
    const wallFB = rbox(W, H, T, detail);
    const wallLR = rbox(T, H, D - 2 * T, detail);
    const plain = {
      flapFB: new THREE.BoxGeometry(W, T, D / 2).translate(0, 0, D / 4),
      flapLR: new THREE.BoxGeometry(W * 0.42, T, D - 2 * T).translate(W * 0.21, 0, 0),
      bottom: new THREE.BoxGeometry(W, T, D),
      wallFB: new THREE.BoxGeometry(W, H, T),
      wallLR: new THREE.BoxGeometry(T, H, D - 2 * T),
    };
    const tape = new THREE.BoxGeometry(W + 0.02, 0.006, 0.2);
    const plane = new THREE.PlaneGeometry(1, 1);
    const streak = new THREE.PlaneGeometry(0.55, 0.01);

    const kraftMap = kraftTexture();
    const logoMap = logoTexture();
    const labelMap = labelTexture();
    const shadowMap = contactShadowTexture();

    const normalMap = detail > 0 ? kraftNormal() : null;
    const board = new THREE.MeshStandardMaterial({ map: kraftMap, normalMap, normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.92, metalness: 0 });
    const tapeMat = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.4 });
    const logoMat = new THREE.MeshBasicMaterial({ map: logoMap, transparent: true, opacity: 0, depthWrite: false });
    const labelMat = new THREE.MeshBasicMaterial({ map: labelMap, transparent: true, opacity: 0, depthWrite: false });
    const glowMat = new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
    const streakMat = new THREE.MeshBasicMaterial({
      color: ACCENT,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lineMat = new THREE.LineBasicMaterial({ color: "#8fb0ff", transparent: true, opacity: 0 });
    lineMat.visible = false;

    const edges =
      detail > 0
        ? {
            flapFB: new THREE.EdgesGeometry(plain.flapFB),
            flapLR: new THREE.EdgesGeometry(plain.flapLR),
            wallFB: new THREE.EdgesGeometry(plain.wallFB),
            wallLR: new THREE.EdgesGeometry(plain.wallLR),
            bottom: new THREE.EdgesGeometry(plain.bottom),
          }
        : null;

    // Streak layout: fixed pseudo-random lanes.
    const rnd = mulberry32(11);
    const lanes = new Float32Array(STREAKS * 4); // x, y, z, speed
    for (let i = 0; i < STREAKS; i++) {
      lanes[i * 4] = rnd() * 8 - 4;
      lanes[i * 4 + 1] = (rnd() - 0.5) * 2.6;
      lanes[i * 4 + 2] = (rnd() - 0.5) * 2;
      lanes[i * 4 + 3] = 1.2 + rnd() * 2.4;
    }

    const disposables: { dispose(): void }[] = [
      ...Object.values(plain),
      flapFB, flapLR, bottom, wallFB, wallLR, tape, plane, streak,
      kraftMap, ...(normalMap ? [normalMap] : []), logoMap, labelMap, shadowMap,
      board, tapeMat, logoMat, labelMat, glowMat, shadowMat, streakMat, lineMat,
      ...(edges ? Object.values(edges) : []),
    ];

    return {
      g: { flapFB, flapLR, bottom, wallFB, wallLR, tape, plane, streak },
      m: { board, tapeMat, logoMat, labelMat, glowMat, shadowMat, streakMat, lineMat },
      edges,
      lanes,
      disposables,
    };
}

type Assets = ReturnType<typeof buildAssets>;

interface Anim {
  dummy: THREE.Object3D;
  pose: Pose;
  cur: Pose;
}

interface Parts {
  root: React.RefObject<THREE.Group | null>;
  flaps: React.RefObject<(THREE.Group | null)[]>;
  tapeRef: React.RefObject<THREE.Mesh | null>;
  logoRef: React.RefObject<THREE.Mesh | null>;
  labelRef: React.RefObject<THREE.Mesh | null>;
  glowRef: React.RefObject<THREE.Mesh | null>;
  shadowRef: React.RefObject<THREE.Mesh | null>;
  streaks: React.RefObject<THREE.InstancedMesh | null>;
  light: React.RefObject<THREE.PointLight | null>;
}

/** Per-frame update: mutates refs, materials and instance matrices. No allocation. */
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
    const { heroProgress, storyProgress } = useAppStore.getState();
    const { m, lanes } = assets;
    const { pose, cur, dummy } = anim;
    computePose(pose, heroProgress, storyProgress);

    const k = reducedMotion ? 60 : 5.5;
    const d = THREE.MathUtils.damp;
    cur.open = d(cur.open, pose.open, k, delta);
    cur.blue = d(cur.blue, pose.blue, k, delta);
    cur.print = d(cur.print, pose.print, k, delta);
    cur.label = d(cur.label, pose.label, k, delta);
    cur.travel = d(cur.travel, pose.travel, k, delta);
    cur.rotY = d(cur.rotY, pose.rotY, k, delta);
    cur.side = d(cur.side, pose.side, k, delta);

    // In frameloop="demand" a single frame is rendered per invalidate(); keep
    // requesting frames until the damped values have caught up with the scroll.
    if (
      Math.abs(cur.open - pose.open) +
        Math.abs(cur.blue - pose.blue) +
        Math.abs(cur.print - pose.print) +
        Math.abs(cur.label - pose.label) +
        Math.abs(cur.travel - pose.travel) +
        Math.abs(cur.rotY - pose.rotY) +
        Math.abs(cur.side - pose.side) >
      0.002
    ) {
      state.invalidate();
    }

    /* layout: box sits beside the text on wide screens, above it on narrow ones */
    const vw = state.viewport.width;
    const vh = state.viewport.height;
    const wide = vw > 4.6;
    const fit = Math.min(0.82, vw / 3.9);
    const bob = reducedMotion || detail === 0 ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.06;
    r.scale.setScalar(fit * (1 - 0.18 * cur.travel));
    r.position.x = wide ? cur.side * vw * 0.2 + cur.travel * vw * 0.04 : 0;
    // Group origin is the box floor; lift by half the (flaps-open) height to centre it.
    r.position.y = (wide ? 0 : vh * 0.2) + bob - 0.62 * fit;
    r.rotation.y = cur.rotY + (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.04);
    r.rotation.x = 0.18 + cur.travel * 0.08;

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

    /* material states */
    m.board.color.copy(KRAFT).lerp(BLUE, cur.blue).lerp(PRINT, cur.print);
    m.board.emissive.copy(BLUE_GLOW).multiplyScalar(cur.blue * 0.7);
    m.lineMat.opacity = cur.blue;
    m.lineMat.visible = cur.blue > 0.02;

    m.logoMat.opacity = cur.print;
    if (parts.logoRef.current) parts.logoRef.current.visible = cur.print > 0.01;
    m.labelMat.opacity = cur.label;
    if (parts.labelRef.current) parts.labelRef.current.visible = cur.label > 0.01;

    if (parts.tapeRef.current) {
      const s = 1 - seg(cur.open, 0, 0.12);
      parts.tapeRef.current.scale.x = Math.max(0.0001, s);
      parts.tapeRef.current.visible = s > 0.01;
    }
    m.glowMat.opacity = cur.open * 0.85;
    if (parts.glowRef.current) parts.glowRef.current.visible = cur.open > 0.02;
    if (parts.light.current) parts.light.current.intensity = cur.open * 2.4;

    m.shadowMat.opacity = 0.9 - bob * 2;
    if (parts.shadowRef.current) parts.shadowRef.current.scale.setScalar(2.4 + cur.open * 0.8);

    /* instanced motion streaks (mid/high only) */
    const sm = parts.streaks.current;
    if (sm) {
      sm.visible = cur.travel > 0.02;
      if (sm.visible) {
        m.streakMat.opacity = cur.travel * 0.55;
        const t = state.clock.elapsedTime;
        for (let i = 0; i < STREAKS; i++) {
          const x = ((((lanes[i * 4] - t * lanes[i * 4 + 3] * cur.travel * 2) % 8) + 8) % 8) - 4;
          dummy.position.set(x, lanes[i * 4 + 1], lanes[i * 4 + 2]);
          dummy.scale.set(0.4 + lanes[i * 4 + 3] * 0.3, 1, 1);
          dummy.updateMatrix();
          sm.setMatrixAt(i, dummy.matrix);
        }
        sm.instanceMatrix.needsUpdate = true;
      }
    }
}

interface Props {
  detail: 0 | 1 | 2;
  reducedMotion: boolean;
}

const STREAKS = 36;

export default function Box3D({ detail, reducedMotion }: Props) {
  /* ----- one-time assets: 5 box geometries, 1 board material, small textures ----- */
  const assets = useMemo(() => buildAssets(detail), [detail]);

  useEffect(
    () => () => assets.disposables.forEach((d) => d.dispose()),
    [assets],
  );

  /* ----- refs mutated every frame (never React state) ----- */
  const anim = useRef({
    dummy: new THREE.Object3D(),
    pose: { open: 0, blue: 0, print: 0, label: 0, travel: 0, rotY: 0.55, side: 1 } as Pose,
    cur: { open: 0, blue: 0, print: 0, label: 0, travel: 0, rotY: 0.55, side: 1 } as Pose,
  });
  const root = useRef<THREE.Group>(null);
  const flaps = useRef<(THREE.Group | null)[]>([null, null, null, null]); // front, back, right, left
  const tapeRef = useRef<THREE.Mesh>(null);
  const logoRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const parts: Parts = { root, flaps, tapeRef, logoRef, labelRef, glowRef, shadowRef, streaks, light };

  useFrame((state, delta) => {
    updateFrame(state, delta, assets, anim.current, parts, detail, reducedMotion);
  });

  const { g, m, edges } = assets;
  const edge = (geo: THREE.EdgesGeometry | undefined) =>
    geo ? <lineSegments geometry={geo} material={m.lineMat} /> : null;

  return (
    <>
      {detail > 0 && (
        <instancedMesh ref={streaks} args={[g.streak, m.streakMat, STREAKS]} frustumCulled={false} visible={false} />
      )}

      <group ref={root}>
        {/* ---- body ---- */}
        <mesh geometry={g.bottom} material={m.board} position={[0, T / 2, 0]}>
          {edge(edges?.bottom)}
        </mesh>
        <mesh geometry={g.wallFB} material={m.board} position={[0, H / 2, D / 2 - T / 2]}>
          {edge(edges?.wallFB)}
        </mesh>
        <mesh geometry={g.wallFB} material={m.board} position={[0, H / 2, -D / 2 + T / 2]}>
          {edge(edges?.wallFB)}
        </mesh>
        <mesh geometry={g.wallLR} material={m.board} position={[W / 2 - T / 2, H / 2, 0]}>
          {edge(edges?.wallLR)}
        </mesh>
        <mesh geometry={g.wallLR} material={m.board} position={[-W / 2 + T / 2, H / 2, 0]}>
          {edge(edges?.wallLR)}
        </mesh>

        {/* ---- flaps: pivot groups sit on the top outer edges ---- */}
        <group position={[0, H, D / 2]}>
          <group ref={(n) => void (flaps.current[0] = n)} rotation={[-Math.PI, 0, 0]}>
            <mesh geometry={g.flapFB} material={m.board}>{edge(edges?.flapFB)}</mesh>
          </group>
        </group>
        <group position={[0, H, -D / 2]} rotation={[0, Math.PI, 0]}>
          <group ref={(n) => void (flaps.current[1] = n)} rotation={[-Math.PI, 0, 0]}>
            <mesh geometry={g.flapFB} material={m.board}>{edge(edges?.flapFB)}</mesh>
          </group>
        </group>
        <group position={[W / 2, H - T * 1.2, 0]}>
          <group ref={(n) => void (flaps.current[2] = n)} rotation={[0, 0, Math.PI]}>
            <mesh geometry={g.flapLR} material={m.board}>{edge(edges?.flapLR)}</mesh>
          </group>
        </group>
        <group position={[-W / 2, H - T * 1.2, 0]} rotation={[0, Math.PI, 0]}>
          <group ref={(n) => void (flaps.current[3] = n)} rotation={[0, 0, Math.PI]}>
            <mesh geometry={g.flapLR} material={m.board}>{edge(edges?.flapLR)}</mesh>
          </group>
        </group>

        {/* ---- seam tape, interior glow, decals ---- */}
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
        {detail > 0 && <pointLight ref={light} position={[0, H * 0.55, 0]} color={ACCENT} distance={4} intensity={0} />}
        <mesh
          ref={logoRef}
          geometry={g.plane}
          material={m.logoMat}
          position={[0, H * 0.52, D / 2 + 0.003]}
          scale={[W * 0.7, W * 0.7 * 0.25, 1]}
          visible={false}
        />
        <mesh
          ref={labelRef}
          geometry={g.plane}
          material={m.labelMat}
          position={[W * 0.26, H * 0.2, D / 2 + 0.004]}
          scale={[0.5, 0.31, 1]}
          visible={false}
        />
      </group>

      {/* blob shadow (cheaper than real shadows, same on every tier) */}
      <mesh
        ref={shadowRef}
        geometry={g.plane}
        material={m.shadowMat}
        position={[0, -1.0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[2.4, 2.4, 1]}
      />
    </>
  );
}
