import * as THREE from "three";
import type { RecipeInstance } from "./types";

declare global {
  interface Window {
    /** Film renderer (dev / ?perf=1 / tests): __film.renderer.info.render.calls */
    __film?: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; set: (p: number) => void; visible: () => boolean };
  }
}

/**
 * One WebGL renderer for the whole session. A page attaches its canvas to a container, mounts a recipe,
 * and on leaving detaches and disposes the recipe: the renderer, its compiled shaders and the lights stay,
 * so the next page does not rebuild the scene or create a new GL context.
 * Rendering is on demand: a frame is drawn when progress, size or the recipe changes (never in a loop).
 */
class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  private host: HTMLElement | null = null;
  private recipe: RecipeInstance | null = null;
  private p = 0;
  private raf = 0;
  private tail = 0;
  private ro: ResizeObserver | null = null;
  private maxDpr = 1.5;
  firstFrame: (() => void) | null = null;

  constructor() {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.domElement.setAttribute("aria-hidden", "true");
    r.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    this.renderer = r;
    const hemi = new THREE.HemisphereLight("#fff6e6", "#b59a78", 1.25);
    const key = new THREE.DirectionalLight("#fff1dc", 2.3);
    key.position.set(3, 5, 4);
    const rim = new THREE.DirectionalLight("#dfe9ff", 0.9);
    rim.position.set(-4, 3, -3);
    const fill = new THREE.DirectionalLight("#ffffff", 0.55);
    fill.position.set(0, 1, 5);
    this.scene.add(hemi, key, rim, fill);
    window.__film = { renderer: r, scene: this.scene, camera: this.camera, set: (p) => this.setProgress(p), visible: () => this.anyVisible() };
  }

  attach(host: HTMLElement, maxDpr: number) {
    this.host = host;
    this.maxDpr = maxDpr;
    host.appendChild(this.renderer.domElement);
    this.ro?.disconnect();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
  }

  detach() {
    this.ro?.disconnect();
    this.ro = null;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.recipe) {
      this.scene.remove(this.recipe.root);
      this.recipe.dispose();
      this.recipe = null;
    }
    this.renderer.domElement.remove();
    this.renderer.renderLists.dispose();
    this.host = null;
    this.firstFrame = null;
  }

  /** Mount a recipe: warm every shader and texture while it is fully visible, then draw the first frame. */
  async mount(r: RecipeInstance) {
    if (this.recipe) {
      this.scene.remove(this.recipe.root);
      this.recipe.dispose();
    }
    this.recipe = r;
    this.scene.add(r.root);
    r.update(0, this.camera);
    r.root.traverse((o) => (o.visible = true)); // warm-up: everything on, one compile
    this.renderer.compile(this.scene, this.camera);
    r.root.traverse((o) => ((o as THREE.Mesh).isMesh && (o as THREE.Mesh).material && this.initTextures(o as THREE.Mesh)));
    r.update(this.p, this.camera); // restores the visibility of this progress
    this.request();
  }

  private initTextures(m: THREE.Mesh) {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) this.renderer.initTexture(v as THREE.Texture);
  }

  setProgress(p: number) {
    this.p = p;
    this.request();
  }

  /** Draw once on the next animation frame (and twice more after it, so a stale frame can never stay). */
  request() {
    this.tail = 2;
    if (!this.raf) this.raf = requestAnimationFrame(this.draw);
  }

  private draw = () => {
    this.raf = 0;
    if (!this.recipe || !this.host) return;
    const t0 = window.__perfOn ? performance.now() : 0; // ?perf=1 only: record the CPU time of this draw
    this.recipe.update(this.p, this.camera);
    this.renderer.render(this.scene, this.camera);
    if (t0) {
      const m = window.__filmMs;
      if (m) m.buf[m.n++ % m.buf.length] = performance.now() - t0;
    }
    if (this.firstFrame) {
      const f = this.firstFrame;
      this.firstFrame = null;
      f();
    }
    if (this.tail-- > 0) this.raf = requestAnimationFrame(this.draw);
  };

  private resize() {
    if (!this.host) return;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxDpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.request();
  }

  /** Test hook: true when a visible mesh of the recipe is inside the camera frustum. */
  private fr = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private sp = new THREE.Sphere();
  anyVisible(): boolean {
    if (!this.recipe) return false;
    this.camera.updateMatrixWorld();
    this.m4.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.fr.setFromProjectionMatrix(this.m4);
    this.scene.updateMatrixWorld(true);
    let any = false;
    this.recipe.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (any || !m.isMesh || m.renderOrder < 0) return;
      for (let n: THREE.Object3D | null = m; n; n = n.parent) if (!n.visible) return;
      if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
      this.sp.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrixWorld);
      if (this.fr.intersectsSphere(this.sp)) any = true;
    });
    return any;
  }
}

let engine: Engine | null = null;
export const getEngine = () => (engine ??= new Engine());
export type { Engine };
