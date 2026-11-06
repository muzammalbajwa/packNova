"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/lib/store";

/** Phase 1 placeholder: a closed kraft box that turns with hero scroll. */
export default function Box3D() {
  const group = useRef<THREE.Group>(null);

  // One geometry + one material, created once and disposed on unmount.
  const geometry = useMemo(() => new THREE.BoxGeometry(1.6, 1.1, 1.2), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b58e5d", roughness: 0.9, metalness: 0 }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const { heroProgress, reducedMotion } = useAppStore.getState();
    const target = reducedMotion ? 0.6 : heroProgress * Math.PI * 1.5 + 0.5;
    g.rotation.y += (target - g.rotation.y) * Math.min(1, delta * 4);
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
