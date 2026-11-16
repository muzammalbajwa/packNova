import * as THREE from "three";

/**
 * Makes every object visible for one `compile` so the shaders of ALL stages (die lines, stamp, waste, foil, gloss) are
 * built before the user scrolls here, and uploads every texture to the GPU. Visibility is restored synchronously, so
 * nothing flashes. Safe to call again after more objects were added (programs and uploaded textures are cached).
 */
export function warmScene(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, invalidate: () => void) {
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
}
