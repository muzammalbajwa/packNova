"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/lib/store";
import { THEMES, type Theme } from "@/lib/palette";
import { FOLD, lin, seg } from "@/lib/making";
import {
  PANELS, PANEL_BY_ID, CHILDREN, SHEET, W, H, D,
  panelGeometry, buildArtTextures, type PanelId,
} from "@/lib/dieline";
import { contactShadowTexture, kraftTexture, setKraftBase } from "@/lib/textures";

const lerp = THREE.MathUtils.lerp;

/* ---------- print / sheen / foil shader patch (mid and high tiers) ---------- */

interface PrintUniforms {
  uArt: { value: THREE.Texture };
  uFoil: { value: THREE.Texture };
  uPrint: { value: number };
  uGloss: { value: number };
  uSheen: { value: number };
  uFoilAmt: { value: number };
  uScanOn: { value: number };
  uScanColor: { value: THREE.Color };
  uFoilColor: { value: THREE.Color };
}

/**
 * Adds, on top of the standard kraft material: artwork revealed left to right behind a moving
 * scan line, a gloss band that sweeps across the print, and a metallic foil layer.
 * All driven by uniforms, so animating them allocates nothing.
 */
function patchPrint(mat: THREE.MeshStandardMaterial, u: PrintUniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vSheetUv;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvSheetUv = uv;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec2 vSheetUv;
uniform sampler2D uArt;
uniform sampler2D uFoil;
uniform float uPrint;
uniform float uGloss;
uniform float uSheen;
uniform float uFoilAmt;
uniform float uScanOn;
uniform vec3 uScanColor;
uniform vec3 uFoilColor;`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
vec4 art = texture2D(uArt, vSheetUv);
float rev = 1.0 - smoothstep(uPrint - 0.012, uPrint, vSheetUv.x);
float ink = art.a * rev;
diffuseColor.rgb = mix(diffuseColor.rgb, art.rgb, ink);
float foil = texture2D(uFoil, vSheetUv).a * uFoilAmt * ink;
diffuseColor.rgb = mix(diffuseColor.rgb, uFoilColor, foil);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.2, ink * uGloss);
roughnessFactor = mix(roughnessFactor, 0.26, foil);`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, 0.85, foil);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
float scan = exp(-pow((vSheetUv.x - uPrint) * 55.0, 2.0)) * uScanOn;
totalEmissiveRadiance += uScanColor * scan * 1.5;
float band = smoothstep(0.07, 0.0, abs(vSheetUv.x * 0.85 + vSheetUv.y * 0.4 - uSheen)) * ink * uGloss;
totalEmissiveRadiance += vec3(1.0) * band * 0.5;`,
      );
  };
}

/* ---------- assets: built once per (theme, tier), disposed on change/unmount ---------- */

function buildAssets(theme: Theme, low: boolean, roughness: number) {
  setKraftBase(theme.kraft);
  const kraft = kraftTexture();
  kraft.repeat.set(SHEET.w / 1.3, SHEET.h / 1.3);

  const tx = buildArtTextures(theme, low ? 1024 : 2048, low);

  const geo = Object.fromEntries(PANELS.map((p) => [p.id, panelGeometry(p)])) as Record<PanelId, THREE.BoxGeometry>;
  const sheetPlane = new THREE.PlaneGeometry(SHEET.w, SHEET.h);
  const stampGeo = new THREE.BoxGeometry(SHEET.w * 0.97, SHEET.h * 0.97, 0.12);
  const shadowGeo = new THREE.PlaneGeometry(1, 1);

  const accent = new THREE.Color(theme.accent);
  const glueInk = new THREE.Color(theme.ink.glue);
  const uniforms: PrintUniforms = {
    uArt: { value: tx.art },
    uFoil: { value: tx.foil },
    uPrint: { value: 0 },
    uGloss: { value: 0 },
    uSheen: { value: -1 },
    uFoilAmt: { value: 0 },
    uScanOn: { value: 0 },
    uScanColor: { value: new THREE.Color(theme.ink.crease).lerp(new THREE.Color("#ffffff"), 0.35) },
    uFoilColor: { value: new THREE.Color(theme.ink.foil) },
  };

  const outer = new THREE.MeshStandardMaterial({ map: kraft, roughness, metalness: 0 });
  if (!low) patchPrint(outer, uniforms);
  const inner = new THREE.MeshStandardMaterial({ map: kraft, color: "#f1e2c6", roughness: 0.95 });
  const edge = new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.kraft).multiplyScalar(0.86), roughness: 0.95 });
  // The glue face is the OUTER face of the flap: it ends up pressed against the inside of the back panel.
  const glue = new THREE.MeshStandardMaterial({ map: kraft, roughness: 0.9, emissive: glueInk, emissiveIntensity: 1 });
  glue.emissive.setScalar(0);

  const mats = Object.fromEntries(
    PANELS.map((p) => [p.id, [edge, edge, edge, edge, p.id === "glue" ? glue : outer, inner]]),
  ) as unknown as Record<PanelId, THREE.Material[]>;

  const waste = new THREE.MeshStandardMaterial({
    map: kraft, alphaMap: tx.waste, alphaTest: 0.5, transparent: true, roughness: 0.95, side: THREE.DoubleSide,
  });
  const lines = new THREE.MeshBasicMaterial({ map: tx.lines, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const stamp = new THREE.MeshStandardMaterial({
    color: theme.ink.steel, metalness: 0.9, roughness: 0.32, transparent: true, opacity: 0.38,
  });
  const shadowMap = contactShadowTexture();
  const shadow = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });

  const disposables: { dispose(): void }[] = [
    kraft, shadowMap,
    ...Object.values(tx).filter((t): t is THREE.CanvasTexture => !!t),
    ...Object.values(geo), sheetPlane, stampGeo, shadowGeo,
    outer, inner, edge, glue, waste, lines, stamp, shadow,
  ];

  return { kraft, tx, geo, sheetPlane, stampGeo, shadowGeo, uniforms, mats, m: { outer, glue, waste, lines, stamp, shadow }, accent, glueInk, look: theme.scene, disposables };
}
type Assets = ReturnType<typeof buildAssets>;

/* ---------- scene graph ---------- */

type Groups = Record<string, THREE.Group>;

type Register = (id: PanelId, node: THREE.Group | null) => void;

function Node({ id, a, register }: { id: PanelId; a: Assets; register: Register }) {
  const d = PANEL_BY_ID[id];
  return (
    <group ref={(n) => register(id, n)} position={[d.hinge[0], d.hinge[1], 0]}>
      <mesh geometry={a.geo[id]} material={a.mats[id]} />
      {CHILDREN(id).map((c) => (
        <Node key={c.id} id={c.id} a={a} register={register} />
      ))}
    </group>
  );
}

interface Props {
  low: boolean;
  reducedMotion: boolean;
}

export default function CartonModel({ low, reducedMotion }: Props) {
  const themeId = useAppStore((s) => s.themeId);
  const roughness = useAppStore((s) => s.story3d.board.roughness);
  const a = useMemo(() => buildAssets(THEMES[themeId], low, roughness), [themeId, low, roughness]);
  useEffect(() => () => a.disposables.forEach((d) => d.dispose()), [a]);

  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const yaw = useRef<THREE.Group>(null);
  const sheet = useRef<THREE.Group>(null);
  const waste = useRef<THREE.Mesh>(null);
  const lines = useRef<THREE.Mesh>(null);
  const stamp = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const groups = useRef<Groups>({});
  const st = useRef({ p: 0, spin: 0, printed: false });
  const register = useCallback<Register>((id, n) => {
    if (n) groups.current[id] = n;
  }, []);

  useFrame((state, delta) => {
    update(state, Math.min(delta, 0.05), a, st.current, { root, tilt, yaw, sheet, waste, lines, stamp, shadow, groups }, low, reducedMotion);
  });

  return (
    <>
      <group ref={root}>
        <group ref={tilt}>
          <group ref={yaw}>
          <group ref={sheet}>
            <Node id="front" a={a} register={register} />
            <mesh ref={waste} geometry={a.sheetPlane} material={a.m.waste} position={[SHEET.cx, SHEET.cy, -0.007]} />
            <mesh ref={lines} geometry={a.sheetPlane} material={a.m.lines} position={[SHEET.cx, SHEET.cy, 0.006]} visible={false} />
            {!low && <mesh ref={stamp} geometry={a.stampGeo} material={a.m.stamp} position={[SHEET.cx, SHEET.cy, 3]} visible={false} />}
          </group>
          </group>
        </group>
        <mesh ref={shadow} geometry={a.shadowGeo} material={a.m.shadow} rotation={[-Math.PI / 2, 0, 0]} />
      </group>
    </>
  );
}

interface Refs {
  root: React.RefObject<THREE.Group | null>;
  tilt: React.RefObject<THREE.Group | null>;
  yaw: React.RefObject<THREE.Group | null>;
  sheet: React.RefObject<THREE.Group | null>;
  waste: React.RefObject<THREE.Mesh | null>;
  lines: React.RefObject<THREE.Mesh | null>;
  stamp: React.RefObject<THREE.Mesh | null>;
  shadow: React.RefObject<THREE.Mesh | null>;
  groups: React.RefObject<Groups>;
}

const HALF_PI = Math.PI / 2;
const TABLE_TILT = -0.85; // sheet lies on a table, seen from above
const UPRIGHT_TILT = -0.2; // finished carton: slightly looking down on it
const YAW_LEFT = 0.62; // shows the left side swinging back while it folds
const YAW_RIGHT = -0.62; // shows the right side and the glue flap sticking out of its back edge
const YAW_FINAL = 0.45; // resting view of the finished carton

/** Per-frame: reads the scroll progress, writes transforms/uniforms. Allocates nothing. */
function update(state: RootState, dt: number, a: Assets, s: { p: number; spin: number; printed: boolean }, r: Refs, low: boolean, reduced: boolean) {
  const rootG = r.root.current;
  const sheetG = r.sheet.current;
  const tiltG = r.tilt.current;
  const yawG = r.yaw.current;
  if (!rootG || !sheetG || !tiltG || !yawG) return;

  // Pure function of the scroll progress: no smoothing, so a jump to any stage draws that stage in the first frame.
  s.p = useAppStore.getState().makingProgress;
  const p = s.p;
  const u = a.uniforms;
  const t = state.clock.elapsedTime;

  /* --- layout: model beside the text on wide screens, above it on narrow ones --- */
  const cfg = useAppStore.getState().story3d;
  const vw = state.viewport.width;
  const vh = state.viewport.height;
  const L = vw / vh > cfg.story.wideAspect ? cfg.story.wide : cfg.story.narrow;
  const availW = vw * L.widthFrac;
  const availH = vh * L.heightFrac;
  const fitFlat = Math.min(availW / SHEET.w, availH / (SHEET.h * Math.cos(TABLE_TILT)));
  // the open flaps stand ~0.9 above the carton until the lid closes, so size for that
  const fitBox = Math.min(availW / (W * 2.2), availH / ((H + 0.9) * 1.12));
  const foldAmt = seg(p, FOLD.tilt[0], 0.8);
  const fit = lerp(fitFlat, fitBox, foldAmt);
  const rise = 1; // the sheet is fully in frame from progress 0 (it used to rise in from below the screen)

  rootG.scale.setScalar(fit);
  rootG.position.x = vw * L.offsetX;
  // flaps stand above the carton while it is open: drop it a little so they stay in frame
  const flapsUp = seg(p, 0.6, 0.7) * (1 - seg(p, 0.9, 0.93));
  rootG.position.y = vh * L.offsetY - (1 - rise) * vh * 0.6 - 0.3 * fit * flapsUp;

  const tiltAmt = seg(p, FOLD.tilt[0], FOLD.tilt[1]);
  tiltG.rotation.x = lerp(TABLE_TILT, UPRIGHT_TILT, tiltAmt);

  // gentle idle spin once finished, accumulated so there is no jump when it starts
  const idle = seg(p, 0.98, 1);
  s.spin += reduced ? 0 : dt * 0.35 * idle;
  // the tilt is applied to the world x axis (outer group); the spin is about the carton's own vertical axis
  yawG.rotation.y =
    YAW_LEFT * seg(p, FOLD.tilt[0], 0.62) +
    (YAW_RIGHT - YAW_LEFT) * seg(p, 0.68, 0.73) +
    (YAW_FINAL - YAW_RIGHT) * seg(p, 0.865, 0.905) +
    Math.PI * 2 * seg(p, 0.925, 0.985) +
    s.spin;

  // sheet centred while flat, carton centred (box spans z in [-D, 0]) once folded
  const centre = seg(p, FOLD.left[0], FOLD.botMain[1]);
  sheetG.position.set(lerp(-SHEET.cx, 0, centre), lerp(-SHEET.cy, 0, centre), lerp(0, D / 2, centre));

  /* --- stage 2/3: print, gloss, foil --- */
  const print = seg(p, 0.13, 0.26);
  if (low) {
    const printed = p > 0.2;
    if (printed !== s.printed) {
      s.printed = printed;
      a.m.outer.map = printed && a.tx.baked ? a.tx.baked : a.kraft;
      a.m.outer.needsUpdate = true;
    }
  } else {
    u.uPrint.value = print * 1.03;
    u.uScanOn.value = print > 0.002 && print < 0.998 ? 1 : 0;
    u.uGloss.value = seg(p, 0.285, 0.3);
    u.uSheen.value = lerp(-0.3, 1.6, lin(p, 0.29, 0.37));
    u.uFoilAmt.value = seg(p, 0.34, 0.4);
  }

  /* --- stage 4: die-cut --- */
  const linesIn = seg(p, 0.4, 0.43);
  const flash = low ? 0 : Math.exp(-(((p - 0.4655) * 70) ** 2));
  const linesMesh = r.lines.current;
  if (linesMesh) {
    const o = linesIn * 0.5 * (1 - seg(p, 0.575, 0.62)) + flash * 0.5;
    a.m.lines.opacity = o;
    linesMesh.visible = o > 0.01;
  }
  const stampMesh = r.stamp.current;
  if (stampMesh) {
    stampMesh.visible = p > 0.42 && p < 0.51;
    stampMesh.position.z = 0.09 + 2.6 * (1 - seg(p, 0.425, 0.455)) + 2.6 * seg(p, 0.475, 0.505);
  }
  const wasteMesh = r.waste.current;
  if (wasteMesh) {
    if (low) {
      wasteMesh.visible = p < 0.5;
    } else {
      const fall = seg(p, 0.5, 0.56);
      wasteMesh.visible = fall < 1;
      wasteMesh.position.y = SHEET.cy - fall * fall * 6;
      wasteMesh.rotation.z = fall * 0.35;
      a.m.waste.opacity = 1 - seg(p, 0.53, 0.56);
    }
  }

  /* --- stages 5/6/7: folding --- */
  const open = Math.sin(Math.PI * lin(p, 0.94, 0.985)) * 0.75; // lid lifts a little, then closes
  const g = r.groups.current;
  for (const d of PANELS) {
    const node = g[d.id];
    if (!node || !d.parent) continue;
    let ang = d.sign * HALF_PI * seg(p, d.win[0], d.win[1]);
    if (d.id === "lid") ang += open;
    node.rotation[d.axis] = ang;
  }

  // glue strip lights up, then fades once pressed
  const glue = seg(p, 0.8, 0.82) * (1 - seg(p, 0.86, 0.9));
  a.m.glue.emissive.copy(a.glueInk).multiplyScalar(glue * (0.7 + 0.3 * Math.sin(t * 7)));

  /* --- ground shadow --- */
  const sh = r.shadow.current;
  if (sh) {
    const flatY = -SHEET.h * 0.5 * Math.cos(TABLE_TILT) - 0.12;
    const boxY = -(H / 2) - 0.04;
    const y = lerp(flatY, boxY, foldAmt);
    sh.position.set(0, y, 0);
    const sw = lerp(SHEET.w * 1.05, W * 2.1, foldAmt) * cfg.shadow.spread;
    sh.scale.set(sw, sw * 0.85, 1);
    a.m.shadow.opacity = Math.min(1, 0.7 * a.look.shadow * cfg.shadow.opacity) * rise;
  }
}
