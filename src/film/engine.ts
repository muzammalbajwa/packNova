import * as THREE from "three";
import { makeEnvironment } from "./env";
import { setKitQuality } from "./kit";
import { watchContext } from "@/lib/contextLoss";
import type { RecipeInstance } from "./types";

declare global {
  interface Window {
    /** Film renderer (dev / ?perf=1 / tests): __film.renderer.info.render.calls */
    /** Releases the film renderer's WebGL context at once (pages that create their own canvas call this first). */
    __filmDestroy?: () => void;
    __film?: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; set: (p: number) => void; visible: () => boolean };
  }
}

/**
 * One WebGL renderer for the whole session. A page attaches its canvas to a container, mounts a recipe,
 * and on leaving detaches and disposes the recipe: the renderer, its compiled shaders and the lights stay,
 * so the next page does not rebuild the scene or create a new GL context.
 * Rendering is on demand: a frame is drawn when progress, size or the recipe changes (never in a loop).
 */
const nextFrame = () => new Promise<void>((res) => requestAnimationFrame(() => res()));

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
  /** The WebGL context was lost / given back: the page shows its poster in between (see lib/contextLoss.ts). */
  onLost: (() => void) | null = null;
  onRestored: (() => void) | null = null;
  private lost = false;
  /**
   * Idle motion (the product page opens on the finished product, gently turning). `idleAmp` is the sway in radians (0 = off), `idleFade` (0..1)
   * is how much of it is left as the visitor starts to scroll. The loop only runs while the stage is on screen, the tab is visible and
   * some sway is left; on the low tier it is capped at 30 fps. Nothing else is drawn in a loop, and nothing is allocated per frame.
   */
  idleAmp = 0;
  idleFade = 1;
  /** Look of the lighting: 0 = low tier (flat three-point light, no tone mapping), 1 = mid, 2 = high (adds the environment reflections). */
  private quality = -1;
  private env: THREE.Texture | null = null;
  private lights: { hemi: THREE.HemisphereLight; key: THREE.DirectionalLight; rim: THREE.DirectionalLight; fill: THREE.DirectionalLight; bounce: THREE.DirectionalLight } | null = null;
  idleLow = false;
  private onScreen = true;
  private io: IntersectionObserver | null = null;
  private lastDraw = 0;
  private onVisible = () => { if (!document.hidden) this.request(); };
  private unwatch: (() => void) | null = null;
  private destroyTimer = 0;

  constructor() {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.domElement.setAttribute("aria-hidden", "true");
    r.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    this.renderer = r;
    this.unwatch = watchContext(r.domElement, {
      onLost: () => {
        this.lost = true;
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.onLost?.();
      },
      onRestored: () => {
        this.lost = false;
        this.onRestored?.();
        this.request(); // three.js re-creates its GPU resources on its own; the next frame draws the current progress
      },
    });
    const hemi = new THREE.HemisphereLight("#fff6e6", "#b59a78", 1.25);
    const key = new THREE.DirectionalLight("#fff1dc", 2.3);
    key.position.set(3, 5, 4);
    const rim = new THREE.DirectionalLight("#dfe9ff", 0.9);
    rim.position.set(-4, 3, -3);
    const fill = new THREE.DirectionalLight("#ffffff", 0.55);
    fill.position.set(0, 1, 5);
    // a low warm bounce from the ground side (kraft floor): lifts the shaded undersides so forms keep their volume
    const bounce = new THREE.DirectionalLight("#e8c79a", 0);
    bounce.position.set(1.5, -3, 2.5);
    this.lights = { hemi, key, rim, fill, bounce };
    this.scene.add(hemi, key, rim, fill, bounce);
    window.__film = { renderer: r, scene: this.scene, camera: this.camera, set: (p) => this.setProgress(p), visible: () => this.anyVisible() };
  }

  /**
   * The look of the light for a tier. Low keeps the original flat three-point light. Mid and high use a stronger key with a softer fill and a
   * stronger rim (more form shading), and a warm ground bounce under the shaded sides; high also gets the small studio environment for
   * gentle reflections (foil, gloss, film). The environment is built once, on first use.
   */
  private setQuality(q: 0 | 1 | 2) {
    if (q === this.quality || !this.lights) return;
    this.quality = q;
    setKitQuality(q);
    const { hemi, key, rim, fill, bounce } = this.lights;
    const r = this.renderer;
    if (q === 0) {
      r.toneMapping = THREE.NoToneMapping;
      this.scene.environment = null;
      hemi.intensity = 1.25; key.intensity = 2.3; rim.intensity = 0.9; fill.intensity = 0.55; bounce.intensity = 0;
    } else {
      r.toneMapping = THREE.NoToneMapping; // tone mapping was tried and made the kraft too golden; depth comes from the light balance instead
      hemi.intensity = 0.95; key.intensity = 2.6; rim.intensity = 1.3; fill.intensity = 0.3; bounce.intensity = 0.38;
      if (q === 2) {
        this.env ??= makeEnvironment(r);
        this.scene.environment = this.env;
        this.scene.environmentIntensity = 0.3;
      } else this.scene.environment = null;
    }
    // materials compiled under the other settings are rebuilt on the next draw
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) mat.needsUpdate = true;
    });
  }

  attach(host: HTMLElement, maxDpr: number, tier: "low" | "mid" | "high" = "mid") {
    window.clearTimeout(this.destroyTimer);
    this.setQuality(tier === "high" ? 2 : tier === "mid" ? 1 : 0);
    this.host = host;
    this.maxDpr = maxDpr;
    host.appendChild(this.renderer.domElement);
    this.ro?.disconnect();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io?.disconnect();
    this.io = new IntersectionObserver(([e]) => {
      this.onScreen = e.isIntersecting;
      if (this.onScreen) this.request();
    });
    this.io.observe(host);
    document.addEventListener("visibilitychange", this.onVisible);
    this.resize();
  }

  detach() {
    this.mountId++; // cancels a mount that is still uploading textures
    this.ro?.disconnect();
    this.ro = null;
    this.io?.disconnect();
    this.io = null;
    document.removeEventListener("visibilitychange", this.onVisible);
    this.idleAmp = 0;
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
    this.onLost = null; // the page that set these is gone
    this.onRestored = null;
    // Another film page attaches within a moment (and keeps the renderer). If none does, free the WebGL context.
    this.destroyTimer = window.setTimeout(() => this.destroy(), 150);
  }

  /** Disposes the renderer and its context. The next getEngine() builds a new one. */
  destroy() {
    this.mountId++;
    window.clearTimeout(this.destroyTimer);
    if (this.recipe) {
      this.scene.remove(this.recipe.root);
      this.recipe.dispose();
      this.recipe = null;
    }
    this.ro?.disconnect();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.unwatch?.();
    this.io?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisible);
    this.renderer.domElement.remove();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.host = null;
    delete window.__film;
    delete window.__filmDestroy;
    if (engine === this) engine = null;
  }

  private mountId = 0;
  /** Where a recipe waits while its shaders are compiled; never drawn. */
  private warm = new THREE.Scene();

  /**
   * Mount a recipe. The textures of the new recipe are uploaded one per frame while the previous recipe keeps drawing, so no
   * single frame carries the whole upload; then, in one light frame, the old recipe is swapped for the new one, with every
   * shader warmed while it is fully visible. A newer mount (or a detach) cancels one that is still waiting.
   */
  async mount(r: RecipeInstance) {
    const id = ++this.mountId;
    const texs = new Set<THREE.Texture>();
    r.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.material) return;
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) texs.add(v as THREE.Texture);
        for (const t of (mat.userData?.extraTextures as THREE.Texture[] | undefined) ?? []) texs.add(t);
      }
    });
    for (const t of texs) {
      this.renderer.initTexture(t);
      await nextFrame();
      if (id !== this.mountId) {
        r.dispose();
        return;
      }
    }
    // warm every shader of the new recipe off to the side (it is not in the drawn scene yet), in a frame of its own
    r.update(0, this.camera);
    r.root.traverse((o) => (o.visible = true));
    this.warm.add(r.root);
    this.renderer.compile(this.warm, this.camera, this.scene);
    await nextFrame();
    if (id !== this.mountId) {
      r.dispose();
      return;
    }
    // the swap itself: remove the old, add the new (this moves it out of the warm-up scene), set its pose
    const t0 = performance.now();
    const old = this.recipe;
    if (old) this.scene.remove(old.root);
    this.recipe = r;
    this.scene.add(r.root);
    r.update(this.p, this.camera);
    this.request();
    (window as unknown as { __swapMs?: number[] }).__swapMs?.push(performance.now() - t0); // tests only
    if (old) requestAnimationFrame(() => old.dispose()); // freeing the old geometry and textures: another frame
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
    if (this.lost || !this.recipe || !this.host) return;
    const now = performance.now();
    const idle = this.idleAmp > 0 && this.idleFade > 0.002 && this.onScreen && !document.hidden;
    if (idle && this.idleLow && this.tail <= 0 && now - this.lastDraw < 30) {
      this.raf = requestAnimationFrame(this.draw); // low tier: draw about every other frame (30 fps)
      return;
    }
    this.lastDraw = now;
    const t0 = window.__perfOn ? performance.now() : 0; // ?perf=1 only: record the CPU time of this draw
    this.recipe.update(this.p, this.camera);
    this.recipe.root.rotation.y = this.idleAmp > 0 ? Math.sin(now * 0.00075) * this.idleAmp * this.idleFade : 0;
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
    if (this.tail-- > 0 || idle) this.raf = requestAnimationFrame(this.draw);
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
export function getEngine() {
  if (!engine) {
    engine = new Engine();
    const e = engine;
    window.__filmDestroy = () => e.destroy();
  }
  return engine;
}
export type { Engine };
