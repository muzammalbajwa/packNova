"use client";

import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ArtMap } from "@/lib/artwork";
import type { Spec } from "@/lib/configurator";
import { contactShadowTexture } from "@/lib/textures";
import { useAppStore } from "@/lib/store";
import PackModel from "./models/PackModel";
import SceneLights from "./SceneLights";

const TARGET = 1.7; // largest dimension in world units

/** Soft footprint shadow, sized from the model footprint (x by z, world units). */
function Shadow({ fx, fz }: { fx: number; fz: number }) {
  const { geo, mat, tex } = useMemo(() => {
    const tex = contactShadowTexture();
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
  return <mesh geometry={geo} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} scale={[fx * 1.9 + 0.5, fz * 1.9 + 0.5, 1]} />;
}

/** Single-model preview canvas for the configurator page (drag to rotate). */
export default function PreviewScene({ spec, art, open }: { spec: Spec; art: ArtMap; open: boolean }) {
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
      <SceneLights low={profile.tier === "low"} />
      <group position={[0, -0.55, 0]}>
        <PackModel model={spec.model} material={spec.material} art={art} open={open} detail={profile.detail} l={l} w={w} h={h} />
        <Shadow fx={l} fz={spec.model === "pouch" ? Math.max(w, 0.12) : w} />
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom
        zoomSpeed={0.6}
        minDistance={3.4}
        maxDistance={7.5}
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
