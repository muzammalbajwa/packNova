"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Lightweight image-based lighting generated in code (a small procedural "room"
 * prefiltered once with PMREM). No HDR download. Mid and high tiers only.
 */
export default function RoomEnv({ intensity = 0.4 }: { intensity?: number }) {
  const get = useThree((s) => s.get); // read scene/gl at effect time (they are mutated here)

  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [get, intensity]);

  return null;
}
