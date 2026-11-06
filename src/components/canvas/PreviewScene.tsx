"use client";

import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Spec } from "@/lib/configurator";
import { shadowTexture } from "@/lib/textures";
import { useAppStore } from "@/lib/store";
import PackModel from "./models/PackModel";

const TARGET = 1.7; // largest dimension in world units

function Shadow() {
  const { geo, mat, tex } = useMemo(() => {
    const tex = shadowTexture();
    return {
      tex,
      geo: new THREE.PlaneGeometry(1, 1),
      mat: new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    };
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
      tex.dispose();
    },
    [geo, mat, tex],
  );
  return <mesh geometry={geo} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} scale={[3.4, 3.4, 1]} />;
}

/** Single-model preview canvas for the configurator page (drag to rotate). */
export default function PreviewScene({ spec }: { spec: Spec }) {
  const profile = useAppStore((s) => s.profile);
  const reduced = useAppStore((s) => s.reducedMotion);
  if (!profile) return null;

  const s = TARGET / Math.max(spec.l, spec.w, spec.h);
  const l = spec.l * s;
  const w = spec.w * s;
  const h = spec.h * s;
  const calm = profile.tier === "low" || reduced;

  return (
    <Canvas
      dpr={profile.dpr}
      frameloop={calm ? "demand" : "always"}
      gl={{ antialias: profile.tier !== "low", alpha: true }}
      camera={{ position: [2.6, 1.7, 3.6], fov: 34 }}
      onCreated={(state) => {
        window.__gl = state.gl;
        window.__r3f = state;
      }}
    >
      <hemisphereLight args={["#fff1dc", "#1a1008", 0.6]} />
      <directionalLight position={[3, 5, 3]} intensity={2.4} color="#ffe9cf" />
      <directionalLight position={[-4, 2, -3]} intensity={2} color="#ff5b2e" />
      <group position={[0, -0.55, 0]}>
        <PackModel model={spec.model} material={spec.material} l={l} w={w} h={h} />
        <Shadow />
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!calm}
        autoRotateSpeed={1.2}
        enableDamping
        minPolarAngle={0.5}
        maxPolarAngle={1.6}
        target={[0, 0.2, 0]}
      />
    </Canvas>
  );
}
