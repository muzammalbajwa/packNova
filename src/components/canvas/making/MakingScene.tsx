"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import ContextWatch from "../ContextWatch";
import { useAppStore } from "@/lib/store";
import SceneLights from "../SceneLights";
import CartonModel from "./CartonModel";
import JourneyScene from "./JourneyScene";

declare global {
  interface Window {
    /** Renderer of the making-of canvas (window.__glMaking.info.render.calls for draw calls). */
    __glMaking?: import("three").WebGLRenderer;
    /** Test hook: true when at least one opaque mesh of the story is inside the camera frustum. */
    __makingVisible?: () => boolean;
    /** Test hook: set the story progress without scrolling. */
    __makingSet?: (p: number) => void;
  }
}

/** Re-render whenever the scroll progress changes, plus 2 extra frames after it stops (never a stale frame). */
function Invalidator({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let extra = 0;
    let raf = 0;
    const kick = () => {
      invalidate();
      extra = 2;
      if (!raf) raf = requestAnimationFrame(tail);
    };
    const tail = () => {
      raf = 0;
      invalidate();
      if (--extra > 0) raf = requestAnimationFrame(tail);
    };
    kick();
    const off = useAppStore.subscribe((s, prev) => {
      if (s.makingProgress !== prev.makingProgress) kick();
    });
    return () => {
      off();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [invalidate, active]);
  return null;
}

/**
 * Warm-up, run once right after mount (the canvas mounts in idle time after first paint): every object is
 * made visible for one `compile` so the shaders of ALL stages (die lines, stamp, waste, foil, gloss) are
 * built before the user scrolls here, and every texture is uploaded to the GPU. Visibility is restored
 * synchronously, so nothing flashes.
 */
function WarmUp() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    const textures = new Set<THREE.Texture>();
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) textures.add(v as THREE.Texture);
      }
    });
    textures.forEach((t) => gl.initTexture(t));
    const done = gl.compileAsync(scene, camera); // collects the programs synchronously, links in parallel
    hidden.forEach((o) => (o.visible = false));
    done.then(() => invalidate()).catch(() => {});
  }, [gl, scene, camera, invalidate]);
  return null;
}

/** Dev only: warns when no mesh of the story is visible inside the camera frustum. */
function VisibleGuard() {
  useFrame((state) => {
    if (process.env.NODE_ENV === "production" || state.clock.elapsedTime % 1 > 0.03) return;
    if (!window.__makingVisible?.()) console.warn("[story] no stage object is visible at progress", useAppStore.getState().makingProgress.toFixed(3));
  });
  return null;
}

/** The making-of canvas. Renders only while the section is on screen (`active`). */
export default function MakingScene({ active }: { active: boolean }) {
  const profile = useAppStore((s) => s.profile);
  const reduced = useAppStore((s) => s.reducedMotion);
  const cam = useAppStore((s) => s.story3d.camera);
  if (!profile) return null;
  const low = profile.tier === "low";
  // off screen it only draws on demand (first frame, progress changes); on screen it runs continuously
  const frameloop = !active || low || reduced ? "demand" : "always";

  return (
    <Canvas
      dpr={low ? [1, 1] : profile.dpr}
      frameloop={frameloop}
      gl={{ antialias: !low, alpha: true, powerPreference: "high-performance" }}
      // tight near/far keeps depth precision high enough that stacked flaps never z-fight
      camera={{ position: [0, 0, cam.z], fov: cam.fov, near: cam.z - 4, far: cam.z + 7 }}
      onCreated={(state) => {
        window.__glMaking = state.gl;
        (window as unknown as { __makingR3F?: unknown }).__makingR3F = state; // test hook (scripts/roundtrip-test.mjs)
        window.__makingSet = (p) => useAppStore.getState().setMakingProgress(p);
        const frustum = new THREE.Frustum();
        const m4 = new THREE.Matrix4();
        const sphere = new THREE.Sphere();
        window.__makingVisible = () => {
          state.camera.updateMatrixWorld();
          m4.multiplyMatrices(state.camera.projectionMatrix, state.camera.matrixWorldInverse);
          frustum.setFromProjectionMatrix(m4);
          let any = false;
          state.scene.updateMatrixWorld(true);
          state.scene.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (any || !mesh.isMesh || !mesh.geometry || mesh.userData.bg || (mesh as THREE.InstancedMesh).isInstancedMesh) return;
            for (let n: THREE.Object3D | null = mesh; n; n = n.parent) if (!n.visible) return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            if (!mats.some((mt) => mt.opacity > 0.5 && !(mt as THREE.MeshBasicMaterial).map?.name?.includes("shadow"))) return;
            if (mesh.geometry.type === "PlaneGeometry" && mesh.rotation.x === -Math.PI / 2) return; // ground shadow
            if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
            sphere.copy(mesh.geometry.boundingSphere!).applyMatrix4(mesh.matrixWorld);
            if (frustum.intersectsSphere(sphere)) any = true;
          });
          return any;
        };
      }}
      aria-hidden
    >
      <ContextWatch flag={false} />
      <SceneLights low={low} />
      <CartonModel low={low} reducedMotion={reduced} />
      <JourneyScene low={low} />
      <WarmUp />
      <Invalidator active={active} />
      <VisibleGuard />
    </Canvas>
  );
}
