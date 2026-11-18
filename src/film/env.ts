import * as THREE from "three";

/**
 * A tiny procedural studio for gentle reflections: a warm cream dome, a dim floor, one large softbox on the key side and a thin strip on the
 * rim side. Rendered once into a small PMREM texture (64 px cube faces, well under 1 MB) that every recipe shares. Cream, not white, so the
 * reflections stay in the palette. High and mid tier only; nothing here runs per frame.
 */
export function makeEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(20, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 top = vec3(1.0,0.96,0.88); vec3 mid = vec3(0.80,0.74,0.64); vec3 low = vec3(0.30,0.25,0.19); vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.9, h)) : mix(mid, low, smoothstep(0.0, -0.6, h)); gl_FragColor = vec4(c, 1.0); }",
    }),
  );
  s.add(dome);
  const panel = (w: number, h: number, intensity: number, color: string, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(9, 7, 3.2, "#fff1dc", 9, 8, 9); // key softbox
  panel(1.4, 12, 2.2, "#e4ecff", -12, 3, -6); // rim strip
  panel(10, 3, 1.1, "#ffffff", 0, 14, 0); // overhead
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035, 0.1, 60, { size: 64 }).texture;
  pm.dispose();
  dome.geometry.dispose();
  (dome.material as THREE.Material).dispose();
  s.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m !== dome) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
  });
  return tex;
}
