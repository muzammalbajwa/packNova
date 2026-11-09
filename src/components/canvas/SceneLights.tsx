"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useAppStore } from "@/lib/store";
import { THEMES } from "@/lib/palette";
import RoomEnv from "./RoomEnv";

/** Lights, image-based light and exposure, all driven by the active theme's `scene` look. */
export default function SceneLights({ low, hemiLow }: { low: boolean; hemiLow?: number }) {
  const look = THEMES[useAppStore((s) => s.themeId)].scene;
  const get = useThree((s) => s.get);

  useEffect(() => {
    const { gl } = get();
    const prev = gl.toneMappingExposure;
    gl.toneMappingExposure = look.toneExposure;
    return () => {
      gl.toneMappingExposure = prev;
    };
  }, [get, look.toneExposure]);

  return (
    <>
      {!low && <RoomEnv intensity={look.env} />}
      <hemisphereLight args={[look.hemiSky, look.hemiGround, low ? (hemiLow ?? look.hemi + 0.2) : look.hemi]} />
      <directionalLight position={[3, 5, 3]} intensity={look.key} color={look.keyColor} />
      <directionalLight position={[-4, 2, -3]} intensity={look.rim * 1.4} color={look.rimColor} />
    </>
  );
}
