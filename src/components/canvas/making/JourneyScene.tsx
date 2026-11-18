"use client";

import { warmScene } from "./warm";
import { useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "@/lib/store";
import { THEMES, type Theme } from "@/lib/palette";
import { contactShadowTexture, kraftNormal, mulberry32 } from "@/lib/textures";
import { SPLIT, seg } from "@/lib/making";
import * as J from "@/lib/journey";
import { beltTexture, boxFaceTextures, labelTexture, mapTexture } from "@/lib/journeyTextures";
import { createCargoPlane, type Vehicle } from "./CargoPlane";

/**
 * The "Shipped" chapter (count, pack, load, fly, deliver) as one scene. Everything is created once at mount and stays
 * mounted; each frame it only writes transforms, colours and visibility as pure functions of the scroll progress
 * (see lib/journey.ts). Nothing is generated, compiled or uploaded while scrolling: the shared WarmUp in MakingScene
 * compiles every material here and uploads every texture right after mount.
 */

const mixC = (a: THREE.ColorRepresentation, b: THREE.ColorRepresentation, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t);
const Q_LIE = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const Q_ID = new THREE.Quaternion();
const ONE = new THREE.Vector3(1, 1, 1);

/**
 * Builds every object of the shipped chapter. It is a generator: it yields between its sections so the caller
 * (JourneyScene) can spread the work over idle slots instead of blocking the main thread for one long task.
 */
function* buildSteps(theme: Theme, low: boolean) {
  const disposables: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const std = (color: THREE.ColorRepresentation, o: THREE.MeshStandardMaterialParameters = {}) => own(new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...o }));
  const basic = (color: THREE.ColorRepresentation, o: THREE.MeshBasicMaterialParameters = {}) => own(new THREE.MeshBasicMaterial({ color, ...o }));
  const geo = <T extends THREE.BufferGeometry>(g: T) => own(g);
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    return o;
  };
  const group = (...c: THREE.Object3D[]) => {
    const g = new THREE.Group();
    g.add(...c);
    return g;
  };
  const instanced = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], items: { p: [number, number, number]; s?: [number, number, number]; q?: THREE.Quaternion }[]) => {
    const im = new THREE.InstancedMesh(g, m, items.length);
    const mat = new THREE.Matrix4();
    items.forEach((it, i) => {
      mat.compose(new THREE.Vector3(...it.p), it.q ?? Q_ID, it.s ? new THREE.Vector3(...it.s) : ONE);
      im.setMatrixAt(i, mat);
    });
    im.instanceMatrix.needsUpdate = true;
    im.frustumCulled = false;
    return im;
  };

  const dark = theme.dark;
  const body = new THREE.Color(dark ? theme.fg : theme.surface);
  const shade = mixC(body, dark ? theme.bg : theme.fg, 0.3);
  const accent = new THREE.Color(theme.accent);
  const asphalt = mixC(theme.bg, theme.fg, dark ? 0.18 : 0.8);
  const kraft = new THREE.Color(theme.kraft);
  const N = J.boxCount(low);

  const root = new THREE.Group(); // journey space: local units, origin = the finished carton's centre
  const hud = new THREE.Group(); // follows the camera (sky, map)

  /* ------------------------------------------------------------ conveyor (count) */
  const beltLen = J.BELT.x1 - J.BELT.x0;
  const beltCx = (J.BELT.x0 + J.BELT.x1) / 2;
  const beltTex = own(beltTexture(`#${asphalt.getHexString()}`, "#ffffff"));
  beltTex.repeat.set(beltLen / 1.2, 1);
  const bedMat = std(asphalt, { roughness: 0.9 });
  const topMat = std("#ffffff", { map: beltTex, roughness: 0.85 });
  const railMat = std(shade);
  const legMat = std(shade);
  const beltTop = mesh(geo(new THREE.PlaneGeometry(beltLen, J.BELT.halfW * 2 - 0.3).rotateX(-Math.PI / 2)), topMat, beltCx, J.BELT.top + 0.004, 0);
  const legH = J.BELT.top - J.BELT.thick - J.FLOOR_Y;
  const legs: { p: [number, number, number] }[] = [];
  for (let x = -14.5; x <= 2.6; x += 2.85) for (const z of [-1, 1]) legs.push({ p: [x, J.FLOOR_Y + legH / 2, z * (J.BELT.halfW - 0.5)] });
  const scanMat = std(accent, { emissive: accent, emissiveIntensity: 0.1, roughness: 0.4 });
  const gBelt = group(
    mesh(geo(new THREE.BoxGeometry(beltLen, J.BELT.thick, J.BELT.halfW * 2)), bedMat, beltCx, J.BELT.top - J.BELT.thick / 2, 0),
    beltTop,
    instanced(geo(new THREE.BoxGeometry(beltLen, 0.3, 0.22)), railMat, [{ p: [beltCx, J.BELT.top + 0.12, J.BELT.halfW] }, { p: [beltCx, J.BELT.top + 0.12, -J.BELT.halfW] }]),
    instanced(geo(new THREE.BoxGeometry(0.3, legH, 0.3)), legMat, legs),
    instanced(geo(new THREE.BoxGeometry(0.25, 3.3, 0.25)), legMat, [{ p: [J.SCAN_X, J.BELT.top + 1.65, J.BELT.halfW + 0.1] }, { p: [J.SCAN_X, J.BELT.top + 1.65, -J.BELT.halfW - 0.1] }]),
    mesh(geo(new THREE.BoxGeometry(0.34, 0.34, J.BELT.halfW * 2 + 0.55)), scanMat, J.SCAN_X, J.BELT.top + 3.3, 0),
  );
  root.add(gBelt);

  yield;
  /* ------------------------------------------------- the batch (instanced copies of the finished carton) */
  const faces = boxFaceTextures(theme);
  disposables.push({ dispose: faces.dispose });
  const faceMat = (t: THREE.Texture) => std("#ffffff", { map: t, roughness: 0.85 });
  const plain = std(theme.kraft, { roughness: 0.92 });
  // 5 material groups instead of 6: top and bottom (faces 12..23 of a BoxGeometry) share the plain kraft material
  const boxGeo = geo(new THREE.BoxGeometry(J.BOX.w, J.BOX.h, J.BOX.d));
  boxGeo.clearGroups();
  [[0, 6], [6, 6], [12, 12], [24, 6], [30, 6]].forEach(([start, count], i) => boxGeo.addGroup(start, count, i));
  const boxMats = [faceMat(faces.faces.right), faceMat(faces.faces.left), plain, faceMat(faces.faces.front), faceMat(faces.faces.back)];
  const boxes = new THREE.InstancedMesh(boxGeo, boxMats, N - 1);
  boxes.frustumCulled = false;
  boxes.count = 0;
  root.add(boxes);

  yield;
  /* ------------------------------------------------------- corrugated master carton (pack, load) */
  const M = J.MASTER;
  const corrNormal = low ? null : own(kraftNormal());
  if (corrNormal) corrNormal.repeat.set(2, 1);
  const corr = std(mixC(theme.kraft, "#000000", 0.14), { roughness: 0.95, normalMap: corrNormal ?? undefined });
  const wallG = (w: number, h: number, d: number, x: number, y: number, z: number) => mesh(geo(new THREE.BoxGeometry(w, h, d)), corr, x, y, z);
  const flap = (w: number, d: number, px: number, py: number, pz: number, ox: number, oz: number, lift: number) => {
    const piv = new THREE.Group();
    piv.position.set(px, py, pz);
    piv.add(mesh(geo(new THREE.BoxGeometry(w, 0.03, d)), corr, ox, lift, oz)); // one material: one draw call per flap
    return piv;
  };
  const top = M.h / 2;
  const minorP = flap(M.w, M.w / 2, 0, top, M.l / 2, 0, -M.w / 4, 0.016); // +z side, closes toward -z
  const minorN = flap(M.w, M.w / 2, 0, top, -M.l / 2, 0, M.w / 4, 0.016);
  const majorP = flap(M.w / 2, M.l, M.w / 2, top, 0, -M.w / 4, 0, 0.05); // +x side, closes toward -x
  const majorN = flap(M.w / 2, M.l, -M.w / 2, top, 0, M.w / 4, 0, 0.05);
  const tapePivot = new THREE.Group();
  tapePivot.position.set(0, top + 0.1, -M.l / 2);
  const tapeMat = std(accent, { roughness: 0.4 });
  tapePivot.add(mesh(geo(new THREE.BoxGeometry(0.4, 0.025, M.l)), tapeMat, 0, 0, M.l / 2));
  const labelTex = own(labelTexture(theme));
  const labelMat = std("#ffffff", { map: labelTex, roughness: 0.6 });
  const label = mesh(geo(new THREE.PlaneGeometry(1.25, 0.83)), labelMat, 0.45, 0.34, M.l / 2 + 0.03);
  // While the carton slides through the side door, everything behind the fuselage skin plane (inside the hold) is clipped
  // away. The plane is a world-space z plane; it only moves in during loading (see apply), otherwise it clips nothing.
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e6);
  for (const mt of [corr, tapeMat, labelMat]) mt.clippingPlanes = [clipPlane];
  const gMaster = group(
    wallG(M.w, M.wall, M.l, 0, -M.h / 2 + M.wall / 2, 0),
    wallG(M.wall, M.h, M.l, M.w / 2 - M.wall / 2, 0, 0),
    wallG(M.wall, M.h, M.l, -M.w / 2 + M.wall / 2, 0, 0),
    wallG(M.w - M.wall * 2, M.h, M.wall, 0, 0, M.l / 2 - M.wall / 2),
    wallG(M.w - M.wall * 2, M.h, M.wall, 0, 0, -M.l / 2 + M.wall / 2),
    minorP, minorN, majorP, majorN, tapePivot, label,
  );
  root.add(gMaster);

  yield;
  /* -------------------------------- loading (load): roller conveyors and a scissor-lift high-loader */
  const LD = J.LOAD;
  const cTop = LD.conveyorTop;
  const rollerMat = std(mixC(asphalt, "#ffffff", 0.4), { roughness: 0.55 });
  const feedX0 = M.cx - 2.2;
  const feedX1 = LD.doorX - LD.deck.w / 2 - 0.1;
  const feedW = 4.4;
  const crossZ0 = 1.5;
  const crossZ1 = LD.liftZ - feedW / 2 + 0.2;
  const rollGeoZ = geo(new THREE.CylinderGeometry(0.14, 0.14, feedW - 0.3, 8).rotateX(Math.PI / 2));
  const rollGeoX = geo(new THREE.CylinderGeometry(0.14, 0.14, 3.4, 8).rotateZ(Math.PI / 2));
  const feedRollers: { p: [number, number, number] }[] = [];
  for (let x = feedX0 + 0.3; x < feedX1; x += 0.7) feedRollers.push({ p: [x, cTop - 0.14, LD.liftZ] });
  const crossRollers: { p: [number, number, number] }[] = [];
  for (let z = crossZ0 + 0.35; z < crossZ1; z += 0.7) crossRollers.push({ p: [M.cx, cTop - 0.14, z] });
  const gLoad = group(
    instanced(rollGeoZ, rollerMat, feedRollers),
    instanced(rollGeoX, rollerMat, crossRollers),
    mesh(geo(new THREE.BoxGeometry(feedX1 - feedX0, 0.14, feedW)), bedMat, (feedX0 + feedX1) / 2, cTop - 0.34, LD.liftZ),
    mesh(geo(new THREE.BoxGeometry(3.6, 0.14, crossZ1 - crossZ0)), bedMat, M.cx, cTop - 0.34, (crossZ0 + crossZ1) / 2),
    instanced(geo(new THREE.BoxGeometry(feedX1 - feedX0, 0.22, 0.14)), railMat, [{ p: [(feedX0 + feedX1) / 2, cTop - 0.12, LD.liftZ + feedW / 2 - 0.05] }, { p: [(feedX0 + feedX1) / 2, cTop - 0.12, LD.liftZ - feedW / 2 + 0.05] }]),
    instanced(geo(new THREE.BoxGeometry(0.14, 0.22, crossZ1 - crossZ0)), railMat, [{ p: [M.cx + 1.75, cTop - 0.12, (crossZ0 + crossZ1) / 2] }, { p: [M.cx - 1.75, cTop - 0.12, (crossZ0 + crossZ1) / 2] }]),
  );
  root.add(gLoad);

  // the high-loader: origin on the ground under the platform centre; the truck sits behind it (+z), clear of the wing
  const liftAccent = std(accent, { roughness: 0.55 });
  const liftDark = std(mixC(theme.bg, theme.fg, dark ? 0.12 : 0.78), { roughness: 0.8 });
  const deckMat = std(shade, { roughness: 0.7 });
  const deckG = new THREE.Group(); // origin = the platform's top surface
  const extG = new THREE.Group();
  const D = LD.deck;
  deckG.add(mesh(geo(new THREE.BoxGeometry(D.w, D.thick, D.d)), deckMat, 0, -D.thick / 2 - 0.01, 0));
  extG.add(mesh(geo(new THREE.BoxGeometry(D.w - 0.5, 0.18, 4.0)), deckMat, 0, -0.09, 0));
  deckG.add(extG);
  // safety rail: posts and bars on the back and the two sides (the door side stays open); one instanced box mesh
  const rail: { p: [number, number, number]; s: [number, number, number] }[] = [];
  const rw = D.w / 2 - 0.1, rd = D.d / 2 - 0.1;
  for (const [x, z] of [[-rw, rd], [rw, rd], [-rw, 0], [rw, 0], [-rw, -rd], [rw, -rd], [0, rd]] as [number, number][]) rail.push({ p: [x, 0.55, z], s: [0.1, 1.1, 0.1] });
  rail.push({ p: [0, 1.1, rd], s: [D.w - 0.1, 0.08, 0.08] }, { p: [-rw, 1.1, 0], s: [0.08, 0.08, D.d - 0.1] }, { p: [rw, 1.1, 0], s: [0.08, 0.08, D.d - 0.1] });
  rail.push({ p: [0, 0.55, rd], s: [D.w - 0.1, 0.06, 0.06] }, { p: [-rw, 0.55, 0], s: [0.06, 0.06, D.d - 0.1] }, { p: [rw, 0.55, 0], s: [0.06, 0.06, D.d - 0.1] });
  deckG.add(instanced(geo(new THREE.BoxGeometry(1, 1, 1)), liftAccent, rail));
  const barGeo = geo(new THREE.BoxGeometry(3.4, 0.2, 0.22));
  const liftBars = new THREE.InstancedMesh(barGeo, liftDark, 12);
  liftBars.frustumCulled = false;
  const truck = group(
    mesh(geo(new THREE.BoxGeometry(6.2, 0.9, 3.4)), liftAccent, -2.1, J.FLOOR_Y + 0.95, 4.1),
    mesh(geo(new THREE.BoxGeometry(2.0, 1.1, 3.0)), deckMat, 0.2, J.FLOOR_Y + 1.95, 4.1),
    mesh(geo(new THREE.BoxGeometry(1.6, 0.2, 5.6)), liftDark, -0.2, J.FLOOR_Y + 0.35, 1.8),
    instanced(geo(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 14).rotateX(Math.PI / 2)), liftDark, [-4.2, -0.1].flatMap((x) => [2.5, 5.7].map((z) => ({ p: [x, J.FLOOR_Y + 0.55, z] as [number, number, number] })))),
  );
  const gLift = group(truck, liftBars, deckG);
  root.add(gLift);

  yield;
  /* ------------------------------------------------------------------- cargo plane */
  const vehicle: Vehicle = createCargoPlane({ body, shade, accent, dark: mixC(theme.bg, theme.fg, dark ? 0.12 : 0.78), inner: mixC(theme.bg, theme.fg, dark ? 0.1 : 0.55) }, low, typeof location !== "undefined" && new URLSearchParams(location.search).get("debug") === "plane");
  const planeRoot = vehicle.root;
  root.add(planeRoot);

  yield;
  /* ----------------------------------------------- ground, runway, sky, clouds, blob shadows */
  const groundMat = std(dark ? mixC(theme.bg, theme.surface, 0.75) : mixC(theme.bg, theme.fg, 0.1), { roughness: 1, transparent: true, opacity: 0 });
  const ground = mesh(geo(new THREE.PlaneGeometry(3200, 3200).rotateX(-Math.PI / 2)), groundMat, 0, J.FLOOR_Y - 0.03, 0);
  ground.userData.bg = true;
  const runwayMat = std(asphalt, { roughness: 0.95, transparent: true, opacity: 0 });
  const runway = mesh(geo(new THREE.PlaneGeometry(300, 17).rotateX(-Math.PI / 2)), runwayMat, 120, J.FLOOR_Y - 0.02, 0);
  runway.userData.bg = true;
  const dashItems = Array.from({ length: 26 }, (_, i) => ({ p: [-10 + i * 11, J.FLOOR_Y - 0.01, 0] as [number, number, number] }));
  const dashMat = std(mixC(body, asphalt, 0.2), { roughness: 0.9, transparent: true, opacity: 0 });
  const dashes = instanced(geo(new THREE.PlaneGeometry(4.5, 0.45).rotateX(-Math.PI / 2)), dashMat, dashItems);
  dashes.userData.bg = true;
  const gGround = group(ground, runway, dashes);
  root.add(gGround);

  // clouds: puffs of low-poly spheres in one InstancedMesh; "gate" clouds on the descent path slide apart
  const rnd = mulberry32(11);
  const cloudCount = low ? 14 : 32;
  const puffs: { c: number; ox: number; oy: number; oz: number; r: number }[] = [];
  const clouds: { x: number; y: number; z: number; side: number; gate: boolean }[] = [];
  for (let c = 0; c < cloudCount; c++) {
    const gate = c < (low ? 4 : 8);
    const front = !gate && c % 8 === 0;
    const cl = gate
      ? { x: 195 + rnd() * 52, y: 4 + rnd() * 18, z: (rnd() - 0.5) * 22, side: c % 2 ? 1 : -1, gate }
      : { x: 40 + rnd() * 250, y: 3 + rnd() * 46, z: front ? 18 + rnd() * 20 : -(48 + rnd() * 40), side: 0, gate };
    if (!gate && cl.x > 190) cl.y += 24; // keep the sky over the village open
    clouds.push(cl);
    const r = front ? 2 + rnd() * 1.5 : 4 + rnd() * 5;
    const k = low ? 3 : 4;
    for (let i = 0; i < k; i++) puffs.push({ c, ox: (i - (k - 1) / 2) * r * 0.85, oy: (i % 2 ? 0.28 : -0.05) * r, oz: (rnd() - 0.5) * r * 0.5, r: r * (0.62 + rnd() * 0.42) });
  }
  const cloudMat = low ? basic("#ffffff", { fog: true }) : std("#ffffff", { roughness: 1, flatShading: true });
  const cloudMesh = new THREE.InstancedMesh(geo(new THREE.IcosahedronGeometry(1, low ? 0 : 1)), cloudMat, puffs.length);
  cloudMesh.frustumCulled = false;
  cloudMesh.userData.bg = true;
  root.add(cloudMesh);

  const shadowTex = own(contactShadowTexture());
  const blob = (sx: number, sz: number, op: number) => {
    const m = own(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: op, fog: false }));
    const o = mesh(geo(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), m, 0, J.FLOOR_Y + 0.04, 0);
    o.scale.set(sx, 1, sz);
    o.userData.bg = true;
    return { o, m, base: op };
  };
  const shBelt = blob(beltLen + 6, 12, 0.55);
  shBelt.o.position.x = beltCx;
  const shMaster = blob(5.6, 6.8, 0.6);
  const shPlane = blob(50, 17, 0.5);
  const shVan = blob(13, 7.5, 0.55);
  const shHouse = blob(20, 15, 0.5);
  shHouse.o.position.set(J.HOUSE_X, J.FLOOR_Y + 0.04, 0);
  root.add(shBelt.o, shMaster.o, shPlane.o, shVan.o, shHouse.o);

  yield;
  /* ----------------------------------------------------- village: house, road, trees, delivery van */
  const wallMat = std(kraft, { roughness: 0.9 });
  const roofMat = std(dark ? mixC(theme.surface, theme.fg, 0.22) : mixC(theme.accent, theme.fg, 0.4), { roughness: 0.8 });
  const doorMat = std(accent, { roughness: 0.6 });
  const winMat = std(mixC(theme.kraft, "#ffe3a0", 0.6), { emissive: new THREE.Color("#ffcf7a"), emissiveIntensity: 0.15, roughness: 0.4 });
  const H0 = J.FLOOR_Y;
  const hw = J.HOUSE.w;
  const hh = J.HOUSE.h;
  const hd = J.HOUSE.d;
  const roofShape = new THREE.Shape([new THREE.Vector2(-hw / 2 - 0.8, 0), new THREE.Vector2(hw / 2 + 0.8, 0), new THREE.Vector2(0, 4.2)]);
  const roofGeo = geo(new THREE.ExtrudeGeometry(roofShape, { depth: hd + 1.2, bevelEnabled: false }));
  roofGeo.translate(0, 0, -(hd + 1.2) / 2);
  const treeCone = geo(new THREE.ConeGeometry(1.9, 4.8, low ? 6 : 8));
  const treeTrunk = geo(new THREE.CylinderGeometry(0.3, 0.38, 1.5, 6));
  const treeSpots: [number, number][] = [[-12.5, -1.5], [13.5, 1.5], [18, -2.5]];
  const foliage = std(mixC(theme.accent, theme.bg, dark ? 0.4 : 0.15), { roughness: 0.9, flatShading: true });
  const trunk = std(mixC(theme.kraft, theme.fg, 0.4));
  const roadMat = std(asphalt, { roughness: 0.95 });
  const roadDashMat = std(mixC(body, asphalt, 0.2), { roughness: 0.9 });
  const gVillage = group(
    mesh(geo(new THREE.BoxGeometry(hw, hh, hd)), wallMat, J.HOUSE_X, H0 + hh / 2, 0),
    mesh(roofGeo, roofMat, J.HOUSE_X, H0 + hh, 0),
    mesh(geo(new THREE.BoxGeometry(1.5, 3.4, 1.5)), roofMat, J.HOUSE_X - 3.5, H0 + hh + 3.4, -1.2),
    mesh(geo(new THREE.BoxGeometry(2.4, 4.2, 0.3)), doorMat, J.HOUSE_X + J.HOUSE.doorX, H0 + 2.1, hd / 2 + 0.08),
    mesh(geo(new THREE.BoxGeometry(3.6, 0.3, 2)), std(mixC(asphalt, body, 0.35)), J.HOUSE_X + J.HOUSE.doorX, H0 + 0.15, hd / 2 + 1.0),
    mesh(geo(new THREE.PlaneGeometry(3, 6).rotateX(-Math.PI / 2)), std(mixC(asphalt, body, 0.35)), J.HOUSE_X + J.HOUSE.doorX, H0 + 0.02, hd / 2 + 4.2),
    instanced(geo(new THREE.PlaneGeometry(1.9, 1.9)), winMat, [{ p: [J.HOUSE_X - 4.6, H0 + 4.4, hd / 2 + 0.02] }, { p: [J.HOUSE_X - 1.1, H0 + 4.4, hd / 2 + 0.02] }, { p: [J.HOUSE_X + 5.8, H0 + 4.4, hd / 2 + 0.02] }]),
    instanced(treeCone, foliage, treeSpots.map(([x, z]) => ({ p: [J.HOUSE_X + x, H0 + 1.5 + 2.4, z] }))),
    instanced(treeTrunk, trunk, treeSpots.map(([x, z]) => ({ p: [J.HOUSE_X + x, H0 + 0.75, z] }))),
    mesh(geo(new THREE.PlaneGeometry(320, 7).rotateX(-Math.PI / 2)), roadMat, J.HOUSE_X, H0 + 0.015, J.ROAD_Z),
    instanced(geo(new THREE.PlaneGeometry(4, 0.4).rotateX(-Math.PI / 2)), roadDashMat, Array.from({ length: 16 }, (_, i) => ({ p: [J.HOUSE_X - 100 + i * 13, H0 + 0.02, J.ROAD_Z] as [number, number, number] }))),
  );
  root.add(gVillage);

  // delivery van: simple boxes, front toward -x (it drives left), rear doors toward +x, facing the doorstep
  const vanBody = std(body, { roughness: 0.6 });
  const vanCab = std(accent, { roughness: 0.55 });
  const vanDark = std(mixC(theme.bg, theme.fg, dark ? 0.12 : 0.85), { roughness: 0.7 });
  const vanY = H0 + 0.9;
  const wheelG = geo(new THREE.CylinderGeometry(0.9, 0.9, 0.7, 12).rotateX(Math.PI / 2));
  const gVan = group(
    mesh(geo(new THREE.BoxGeometry(6.4, 4.2, 4)), vanBody, 1.3, vanY + 2.1, 0),
    mesh(geo(new THREE.BoxGeometry(2.6, 3, 3.8)), vanCab, -3.2, vanY + 1.5, 0),
    mesh(geo(new THREE.BoxGeometry(0.12, 1.2, 3.2)), vanDark, -4.53, vanY + 2.0, 0),
    mesh(geo(new THREE.BoxGeometry(6.45, 0.5, 4.05)), vanCab, 1.3, vanY + 1.0, 0),
    mesh(geo(new THREE.PlaneGeometry(3.4, 3.4).rotateY(Math.PI / 2)), vanDark, 4.52, vanY + 2.1, 0),
    instanced(wheelG, vanDark, [-3, 2.8].flatMap((x) => [-1.95, 1.95].map((z) => ({ p: [x, vanY, z] as [number, number, number] })))),
  );
  root.add(gVan);

  yield;
  /* ------------------------------------------------------------------- sky + map (follow the camera) */
  const skyGeo = geo(new THREE.PlaneGeometry(1, 1));
  skyGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(12), 3));
  // opaque on purpose: three.js draws transparent objects after opaque ones, which would paint the sky over the scene.
  // While the sky fades in, the renderer's clear colour and alpha do the fade instead (see apply()).
  const skyMat = own(new THREE.MeshBasicMaterial({ vertexColors: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
  const sky = mesh(skyGeo, skyMat);
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  sky.userData.bg = true;
  hud.add(sky);

  const mapT = own(mapTexture(theme).texture);
  const hudMat = (color: THREE.ColorRepresentation, o: THREE.MeshBasicMaterialParameters = {}) => basic(color, { depthTest: false, depthWrite: false, transparent: true, fog: false, toneMapped: false, ...o });
  const cardMat = hudMat("#ffffff", { map: mapT, opacity: 0 });
  const mapG = new THREE.Group();
  const card = mesh(geo(new THREE.PlaneGeometry(1, 0.625)), cardMat);
  card.renderOrder = 100;
  const dotMat = hudMat(accent);
  const dots = new THREE.InstancedMesh(geo(new THREE.CircleGeometry(0.0125, 8)), dotMat, 44);
  const dm = new THREE.Matrix4();
  const A: [number, number] = [-0.36, -0.17];
  const B: [number, number] = [0.35, 0.115];
  const C: [number, number] = [-0.02, 0.2];
  const bez = (t: number, i: number) => (1 - t) ** 2 * A[i] + 2 * (1 - t) * t * C[i] + t * t * B[i];
  for (let i = 0; i < 44; i++) {
    const t = i / 43;
    dm.compose(new THREE.Vector3(bez(t, 0), bez(t, 1), 0.002), Q_ID, ONE);
    dots.setMatrixAt(i, dm);
  }
  dots.instanceMatrix.needsUpdate = true;
  dots.count = 0;
  dots.renderOrder = 101;
  dots.frustumCulled = false;
  const fgMat = hudMat(theme.fg);
  const origin = mesh(geo(new THREE.CircleGeometry(0.02, 12)), fgMat, A[0], A[1], 0.003);
  origin.renderOrder = 101;
  const marker = mesh(geo(new THREE.ConeGeometry(0.02, 0.058, 3)), fgMat, 0, 0, 0.004);
  marker.renderOrder = 103;
  const pin = new THREE.Group();
  pin.position.set(B[0], B[1], 0.004);
  const pinCone = mesh(geo(new THREE.ConeGeometry(0.03, 0.08, 10).rotateX(0).rotateZ(Math.PI)), hudMat(accent), 0, 0.04, 0);
  const pinHead = mesh(geo(new THREE.CircleGeometry(0.036, 14)), hudMat(accent), 0, 0.093, 0);
  const pinDot = mesh(geo(new THREE.CircleGeometry(0.014, 10)), hudMat(theme.onAccent), 0, 0.093, 0.001);
  const ringMat = hudMat(accent);
  const ring = mesh(geo(new THREE.RingGeometry(0.03, 0.04, 24)), ringMat, 0, 0, 0);
  for (const o of [pinCone, pinHead, pinDot, ring]) o.renderOrder = 104;
  pin.add(ring, pinCone, pinHead, pinDot);
  mapG.add(card, origin, dots, marker, pin);
  mapG.traverse((o) => {
    o.userData.bg = true;
  });
  hud.add(mapG);

  const colors = {
    // day: a calm sky from the template's own page colours; dusk: a warm glow low down, a deep top
    horizonDay: dark ? mixC(theme.accent, theme.fg, 0.42) : mixC(theme.bg, theme.surface, 0.6), // dark theme: a soft sage-to-cream horizon (was a flat grey)
    zenithDay: dark ? mixC(theme.bg, theme.accent, 0.5) : mixC(theme.bg, theme.accent, 0.46),
    horizonDusk: dark ? mixC(theme.accent, theme.bg, 0.55) : mixC(theme.kraft, theme.accent, 0.3),
    zenithDusk: dark ? mixC(theme.bg, "#000000", 0.3) : mixC(theme.bg, theme.fg, 0.6),
    groundDay: new THREE.Color(groundMat.color),
    groundDusk: mixC(groundMat.color, theme.bg, 0.5),
    cloudDay: mixC(body, "#ffffff", dark ? 0.1 : 0.5),
    cloudDusk: mixC(mixC(theme.kraft, theme.accent, 0.35), body, 0.45),
  };

  return {
    root, hud, vehicle, planeRoot, boxes, gBelt, beltTop, beltTex, scanMat, gMaster, gLoad, gLift, deckG, extG, liftBars, clipPlane, gGround, gVillage, gVan,
    minorP, minorN, majorP, majorN, tapePivot, label,
    groundMat, runwayMat, dashMat, cloudMat, cloudMesh, clouds, puffs, skyGeo, skyMat, sky, mapG, card, cardMat, dots, marker, pin, ring, ringMat,
    shBelt, shMaster, shPlane, shVan, shHouse, winMat, colors, N, bez, B,
    dispose: () => {
      vehicle.dispose();
      disposables.forEach((d) => d.dispose());
    },
  };
}
export type Journey = ReturnType<typeof buildSteps> extends Generator<unknown, infer R> ? R : never;

const FRAME: J.Frame = { fit: 1, x: 0, y: 0, vw: 1, vh: 1, ox: 0, oy: 0, fw: 0.8, fh: 0.8, aspect: 1, tanHalf: 0.3 };
const CAM: J.CamPose = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, dist: 1 };
const MST: J.CartonState = { x: 0, y: 0, z: 0, rotZ: 0, scale: 1, visible: true, minor: 0, major: 0, tape: 0, label: 0 };
const LIFT: J.LiftState = { x: 0, z: 0, deckTop: 0, ext: 0, visible: false };
const PL: J.PlanePose = { x: 0, y: 0, z: 0, pitch: 0, roll: 0, yaw: 0, gear: 1, visible: true };
const VAN = { x: 0, visible: false };
const V3A: J.V3 = [0, 0, 0];
const MAT4 = new THREE.Matrix4();
const VEC = new THREE.Vector3();
const TGT = new THREE.Vector3();
const CC = new THREE.Color();
const CC2 = new THREE.Color();

/** Everything the journey needs to know about the current progress, applied to its objects. */
function apply(j: Journey, P: number, state: { camera: THREE.Camera; size: { width: number; height: number }; scene: THREE.Scene; gl: THREE.WebGLRenderer }, cfg: ReturnType<typeof useAppStore.getState>["story3d"], low: boolean, cache: { cloudParted: number; legacyCam: boolean }) {
  const camera = state.camera as THREE.PerspectiveCamera;
  const camZ = cfg.camera.z;
  const f = J.frameFor(camZ, camera.fov, state.size.width, state.size.height, cfg.story.wideAspect, cfg.story.wide, cfg.story.narrow, FRAME);

  /* ---- camera rig: the legacy camera until the story ends, then a continuous move through the journey ---- */
  if (P <= SPLIT) {
    if (!cache.legacyCam) {
      camera.position.set(0, 0, camZ);
      camera.quaternion.identity();
      camera.near = camZ - 4;
      camera.far = camZ + 7;
      camera.updateProjectionMatrix();
      state.gl.setClearAlpha(0);
      cache.legacyCam = true;
    }
    j.root.visible = false;
    j.hud.visible = false;
    return;
  }
  cache.legacyCam = false;
  j.root.visible = true;
  j.root.position.set(f.x, f.y, 0);
  j.root.scale.setScalar(f.fit);

  J.cameraPose(P, f, camZ, CAM);
  camera.position.set(f.x + f.fit * CAM.px, f.y + f.fit * CAM.py, f.fit * CAM.pz);
  TGT.set(f.x + f.fit * CAM.tx, f.y + f.fit * CAM.ty, f.fit * CAM.tz);
  camera.up.set(0, 1, 0);
  camera.lookAt(TGT);
  const dW = f.fit * CAM.dist;
  const bl = seg(P, SPLIT, SPLIT + 0.02);
  const near = (camZ - 4) * (1 - bl) + Math.max(0.5, 0.22 * dW) * bl;
  const far = (camZ + 7) * (1 - bl) + (4.2 * dW + 120) * bl;
  if (Math.abs(camera.near - near) > 1e-3 || Math.abs(camera.far - far) > 1e-2) {
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  }

  const n = j.N;
  const RR = J.R;

  /* ---- environment amounts ---- */
  const sky = J.skyAmount(P);
  const dusk = J.duskAmount(P);
  const c = j.colors;

  /* ---- belt + batch (count, pack) ---- */
  const beltOn = P < RR.load[0] + 0.03;
  j.gBelt.visible = beltOn;
  if (beltOn) {
    const rise = seg(P, RR.count[0], RR.count[0] + (RR.count[1] - RR.count[0]) * 0.16);
    j.gBelt.position.y = -(1 - rise) * 3.2;
    j.beltTex.offset.x = -J.beltScroll(P);
    j.scanMat.emissiveIntensity = 0.1 + 2.2 * J.scanGlow(P, n);
  }
  const boxesOn = P < RR.pack[0] + (RR.pack[1] - RR.pack[0]) * 0.88;
  j.boxes.visible = boxesOn;
  if (boxesOn) {
    let cnt = 0;
    for (let k = 1; k < n; k++) {
      const p = J.boxPos(k, n, P, V3A);
      if (!p) continue;
      VEC.set(p[0], p[1], p[2]);
      MAT4.compose(VEC, Q_LIE, ONE);
      j.boxes.setMatrixAt(cnt++, MAT4);
    }
    j.boxes.count = cnt;
    j.boxes.instanceMatrix.needsUpdate = true;
  }

  /* ---- master carton ---- */
  J.masterState(P, MST);
  j.gMaster.visible = MST.visible;
  if (MST.visible) {
    j.gMaster.position.set(MST.x, MST.y, MST.z);
    j.gMaster.rotation.z = MST.rotZ;
    j.gMaster.scale.setScalar(MST.scale);
    j.minorP.rotation.x = MST.minor;
    j.minorN.rotation.x = -MST.minor;
    j.majorP.rotation.z = -MST.major;
    j.majorN.rotation.z = MST.major;
    j.tapePivot.scale.z = Math.max(0.001, MST.tape);
    j.tapePivot.visible = MST.tape > 0.002;
    j.label.scale.setScalar(Math.max(0.001, MST.label));
    j.label.visible = MST.label > 0.002;
  }
  j.gLoad.visible = P > RR.pack[0] + 0.05 && P < RR.fly[0] + 0.04;
  /* ---- the high-loader (platform height, reach, drive-away) and the clip plane of the carton ---- */
  J.liftState(P, LIFT);
  j.gLift.visible = LIFT.visible;
  if (LIFT.visible) {
    j.gLift.position.set(LIFT.x, 0, LIFT.z);
    j.deckG.position.y = LIFT.deckTop;
    j.extG.position.z = -J.LOAD.reach * LIFT.ext - 0.2;
    const baseY = J.FLOOR_Y;
    const gap = Math.max(0, LIFT.deckTop - J.LOAD.deck.thick - 0.01 - baseY);
    const dy = gap / 3;
    const th = Math.asin(Math.min(0.98, dy / 3.4));
    let i = 0;
    for (let set = -1; set <= 1; set += 2) {
      for (let lv = 0; lv < 3; lv++) {
        for (let b = -1; b <= 1; b += 2) {
          MAT4.makeRotationZ(b * th);
          MAT4.setPosition(0, baseY + (lv + 0.5) * dy, set * 1.7);
          j.liftBars.setMatrixAt(i++, MAT4);
        }
      }
    }
    j.liftBars.instanceMatrix.needsUpdate = true;
  }
  const loading = MST.visible && P >= RR.load[0] && P < RR.load[1];
  j.clipPlane.constant = loading ? -(f.fit * J.LOAD.clipZ) : 1e6;

  /* ---- plane ---- */
  J.planePose(P, PL);
  j.planeRoot.visible = PL.visible;
  if (PL.visible) {
    j.planeRoot.position.set(PL.x + J.VEHICLE.centerX, PL.y, PL.z);
    j.planeRoot.rotation.set(PL.roll, PL.yaw, PL.pitch, "YZX");
    j.vehicle.setGear(PL.gear);
    j.vehicle.setHatch(J.hatchClosed(P));
  }

  /* ---- ground, runway, shadows ---- */
  j.gGround.visible = sky > 0.001;
  if (sky > 0.001) {
    j.groundMat.opacity = sky;
    j.runwayMat.opacity = sky;
    j.dashMat.opacity = sky;
    j.groundMat.color.copy(c.groundDay).lerp(c.groundDusk, dusk);
  }
  const sh = (s: { o: THREE.Mesh; m: THREE.MeshBasicMaterial; base: number }, on: boolean, a = 1) => {
    s.o.visible = on && a > 0.01;
    s.m.opacity = s.base * a;
  };
  sh(j.shBelt, beltOn, 1 - seg(P, RR.pack[1], RR.load[0] + 0.03));
  sh(j.shMaster, MST.visible && P < RR.load[0] + 0.02, 1);
  j.shMaster.o.position.set(MST.x, J.FLOOR_Y + 0.04, MST.z);
  sh(j.shPlane, PL.visible, 1 - seg(PL.y, 2, 14));
  j.shPlane.o.position.set(PL.x + J.VEHICLE.centerX, J.FLOOR_Y + 0.04, PL.z);
  j.shPlane.o.scale.set(50 + PL.y * 0.4, 1, 17 + PL.y * 0.2);

  /* ---- clouds (parting) ---- */
  const cloudsOn = P > RR.load[1] - 0.01;
  j.cloudMesh.visible = cloudsOn;
  if (cloudsOn) {
    const parted = J.cloudsParted(P);
    if (parted !== cache.cloudParted || cache.cloudParted < 0) {
      cache.cloudParted = parted;
      for (let i = 0; i < j.puffs.length; i++) {
        const p = j.puffs[i];
        const cl = j.clouds[p.c];
        // gate clouds slide apart sideways (x is screen-horizontal for the descending camera)
        VEC.set(cl.x + p.ox + cl.side * parted * 44, cl.y + p.oy, cl.z + p.oz);
        TGT.set(p.r * (1 + 0.25), p.r * 0.72, p.r);
        MAT4.compose(VEC, Q_ID, TGT);
        j.cloudMesh.setMatrixAt(i, MAT4);
      }
      j.cloudMesh.instanceMatrix.needsUpdate = true;
    }
    const cm = j.cloudMat as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
    cm.color.copy(c.cloudDay).lerp(c.cloudDusk, dusk);
    // self-lit (a third of the cloud colour) so the puffs read light and warm instead of grey under the dark scene's lights
    if ((cm as THREE.MeshStandardMaterial).isMeshStandardMaterial) (cm as THREE.MeshStandardMaterial).emissive.copy(cm.color).multiplyScalar(0.38);
  }

  /* ---- village + van ---- */
  const villageOn = P > RR.fly[1] - 0.02;
  j.gVillage.visible = villageOn;
  j.shHouse.o.visible = villageOn;
  j.shHouse.m.opacity = j.shHouse.base;
  j.winMat.emissiveIntensity = 0.12 + 1.25 * dusk;
  J.vanState(P, VAN);
  j.gVan.visible = VAN.visible;
  if (VAN.visible) j.gVan.position.set(VAN.x, 0, J.ROAD_Z);
  j.shVan.o.visible = VAN.visible;
  j.shVan.o.position.set(VAN.x + 0.8, J.FLOOR_Y + 0.04, J.ROAD_Z);

  /* ---- sky, fog, map: attached to the camera ---- */
  j.hud.visible = sky > 0.001 || J.mapAmount(P) > 0.001;
  j.hud.position.copy(camera.position);
  j.hud.quaternion.copy(camera.quaternion);
  const tan = f.tanHalf;
  // sky
  const gradient = seg(P, 0.84, 0.86); // the gradient appears once the sky is fully opaque, so nothing pops
  j.sky.visible = sky >= 0.999;
  if (sky > 0.001) {
    const d = far * 0.96;
    j.sky.position.set(0, 0, -d);
    j.sky.scale.set(2 * tan * d * f.aspect * 1.04, 2 * tan * d * 1.04, 1);
    const col = j.skyGeo.attributes.color as THREE.BufferAttribute;
    CC.copy(c.zenithDay).lerp(c.zenithDusk, dusk);
    CC2.copy(c.horizonDay).lerp(c.horizonDusk, dusk);
    CC.lerp(CC2, 1 - gradient * (low ? 0.5 : 1)); // low tier: a simpler, nearly flat sky
    // plane vertices: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right
    col.setXYZ(0, CC.r, CC.g, CC.b);
    col.setXYZ(1, CC.r, CC.g, CC.b);
    col.setXYZ(2, CC2.r, CC2.g, CC2.b);
    col.setXYZ(3, CC2.r, CC2.g, CC2.b);
    col.needsUpdate = true;
    state.gl.setClearColor(CC2, sky); // fades the sky in over the page background without drawing over the scene
    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) {
      fog.color.copy(CC2);
      fog.near = 70 * f.fit;
      fog.far = 520 * f.fit;
    }
  } else {
    state.gl.setClearAlpha(0);
    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = 1e5; // off while the page background shows through
      fog.far = 2e5;
    }
  }
  // map card, top right of the view
  const mapA = J.mapAmount(P);
  j.mapG.visible = mapA > 0.001;
  if (mapA > 0.001) {
    const dH = near * 1.6;
    const vH = 2 * tan * dH;
    const vW = vH * f.aspect;
    const cw = vW * (f.aspect > 1.2 ? 0.22 : 0.4);
    const side = cfg.map.side === "left" ? -1 : 1;
    const mx = side * ((0.5 - 0.035) * vW - cw / 2);
    const my = (0.5 - 0.115) * vH - (cw * 0.625) / 2;
    j.mapG.position.set(mx, my, -dH);
    j.mapG.scale.setScalar(cw * (0.94 + 0.06 * mapA));
    j.cardMat.opacity = mapA;
    const route = J.routeAmount(P);
    const nd = Math.floor(route * 44);
    j.dots.count = nd;
    // plane marker rides the end of the route
    const t = Math.min(1, route);
    const mxl = j.bez(t, 0);
    const myl = j.bez(t, 1);
    const tx = 2 * (1 - t) * (-0.02 - -0.36) + 2 * t * (0.35 - -0.02);
    const ty = 2 * (1 - t) * (0.2 - -0.17) + 2 * t * (0.115 - 0.2);
    j.marker.position.set(mxl, myl, 0.004);
    j.marker.rotation.z = Math.atan2(ty, tx) - Math.PI / 2;
    j.marker.visible = route > 0.005 && route < 0.985;
    const pulse = J.pinPulse(P);
    const pinOn = route > 0.97;
    j.pin.visible = pinOn;
    j.pin.scale.setScalar(pinOn ? (1 + 0.35 * Math.sin(Math.PI * Math.min(1, pulse))) : 1);
    j.ring.visible = pulse > 0.001 && pulse < 0.999;
    j.ring.scale.setScalar(1 + 3 * pulse);
    j.ringMat.opacity = 1 - pulse;
  }
}

/** Runs the build in idle slices (about 6 ms of work per slot) and hands the finished journey to `done`. Returns a cancel function. */
function buildInSlices(theme: Theme, low: boolean, done: (j: Journey) => void) {
  const gen = buildSteps(theme, low);
  let handle = 0;
  let cancelled = false;
  const ric = (cb: () => void) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 250 }) : window.setTimeout(cb, 16));
  const cic = (h: number) => (typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(h) : window.clearTimeout(h));
  const step = () => {
    if (cancelled) return;
    const t0 = performance.now();
    let r = gen.next();
    while (!r.done && performance.now() - t0 < 6) r = gen.next();
    if (r.done) done(r.value as Journey);
    else handle = ric(step);
  };
  handle = ric(step);
  return () => {
    cancelled = true;
    cic(handle);
  };
}

/** Builds the journey in idle time, then mounts it. Sibling of CartonModel inside the making canvas. */
export default function JourneyScene({ low }: { low: boolean }) {
  const themeId = useAppStore((s) => s.themeId);
  const invalidate = useThree((s) => s.invalidate);
  const [journey, setJourney] = useState<Journey | null>(null);
  useEffect(() => buildInSlices(THEMES[themeId], low, (j) => { setJourney(j); invalidate(); }), [themeId, low, invalidate]);
  return journey ? <MountedJourney journey={journey} low={low} /> : null;
}

/** Mounts a finished journey and drives it from the story progress. */
function MountedJourney({ journey, low }: { journey: Journey; low: boolean }) {
  const get = useThree((s) => s.get);
  useEffect(() => () => journey.dispose(), [journey]);
  // the carton's clip plane (loading) needs local clipping; set before the warm-up compiles the materials
  useEffect(() => {
    get().gl.localClippingEnabled = true;
  }, [get]);
  // fog colour follows the sky; created here so every material compiles with it in the warm-up
  useEffect(() => {
    const { scene } = get();
    const fog = new THREE.Fog(journey.colors.horizonDay, 1e5, 2e5);
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [get, journey]);
  // the objects arrive after the first warm-up, so their shaders and textures are warmed here (same routine)
  useEffect(() => {
    const { gl, scene, camera, invalidate } = get();
    warmScene(gl, scene, camera, invalidate);
  }, [get, journey]);
  const cache = useMemo(() => ({ cloudParted: -1, legacyCam: true, journey }), [journey]);
  useFrame((state) => {
    apply(journey, useAppStore.getState().makingProgress, state, useAppStore.getState().story3d, low, cache);
  });
  return (
    <>
      <primitive object={journey.root} />
      <primitive object={journey.hud} />
    </>
  );
}
