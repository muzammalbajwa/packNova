#!/usr/bin/env node
// Geometry checks for the cargo plane (Node 22, no browser): builds the real plane and asserts its layout.
// node scripts/plane-test.mjs        exits 1 when any check fails
import * as THREE from "three";
import { PLANE_SPEC, createCargoPlane, planeLayout } from "../src/components/canvas/making/CargoPlane.ts";

const C = (h) => new THREE.Color(h);
const v = createCargoPlane({ body: C("#eee"), shade: C("#bbb"), accent: C("#393"), dark: C("#222"), inner: C("#444") }, false);
const Ly = planeLayout();
const S = PLANE_SPEC;
v.root.updateMatrixWorld(true);
const box = (o) => new THREE.Box3().setFromObject(o);
const TOL = 1e-6;
let fail = 0;
const check = (name, ok, detail = "") => {
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
};
const near = (a, b, t = TOL) => Math.abs(a - b) <= t;

// (a) every left/right pair is mirrored across z = 0
for (const h of v.halves) {
  const r = box(h.right), l = box(h.left);
  const ok = near(l.min.x, r.min.x) && near(l.max.x, r.max.x) && near(l.min.y, r.min.y) && near(l.max.y, r.max.y) && near(l.min.z, -r.max.z) && near(l.max.z, -r.min.z);
  check(`(a) ${h.name}: left is the mirror of right`, ok, `right z ${r.min.z.toFixed(2)}..${r.max.z.toFixed(2)}, left z ${l.min.z.toFixed(2)}..${l.max.z.toFixed(2)}`);
}
for (const [a, b] of [["wingRootAnchorRight", "wingRootAnchorLeft"], ["mainGearAnchorRight", "mainGearAnchorLeft"], ["enginePylonAnchorRight0", "enginePylonAnchorLeft0"], ["enginePylonAnchorRight1", "enginePylonAnchorLeft1"]]) {
  const p = v.anchors[a].position, q = v.anchors[b].position;
  check(`(a) anchors ${a} / ${b} mirrored`, near(p.x, q.x) && near(p.y, q.y) && near(p.z, -q.z));
}

// (b) the stabilizer group is centred on z = 0 and attached at the fin tip
{
  const s = v.halves.find((h) => h.name === "stab");
  const r = box(s.right), l = box(s.left);
  const u = r.clone().union(l);
  check("(b) stabilizers centred on z = 0", near((u.min.z + u.max.z) / 2, 0), `span ${(u.max.z - u.min.z).toFixed(2)} = ${((u.max.z - u.min.z) / S.L).toFixed(2)} L`);
  const tip = v.anchors.stabilizerAnchor.position;
  check("(b) stabilizer root at the fin tip height", r.min.y <= tip.y + 0.05 && r.min.y >= tip.y - 0.6, `root bottom ${r.min.y.toFixed(2)}, fin tip ${tip.y.toFixed(2)}`);
  const rootLE = Ly.st.rootLE, rootTE = rootLE - S.stab.rootChord;
  check("(b) stabilizer root chord sits on the fin tip chord", rootLE <= Ly.fin.tipLE + 0.3 && rootTE >= Ly.fin.tipTE - 0.3, `root ${rootTE.toFixed(2)}..${rootLE.toFixed(2)}, fin tip ${Ly.fin.tipTE.toFixed(2)}..${Ly.fin.tipLE.toFixed(2)}`);
}

// (c) the fin root is on the rear cone and nothing extends past the tail tip
{
  const tail = v.anchors.tailTipAnchor.position.x;
  const coneStart = Ly.xAt(S.rear.start);
  check("(c) fin root lies within the rear cone", Ly.fin.te >= tail - TOL && Ly.fin.le <= coneStart + 0.1, `root ${Ly.fin.te.toFixed(2)}..${Ly.fin.le.toFixed(2)}, cone ${tail.toFixed(2)}..${coneStart.toFixed(2)}`);
  const all = new THREE.Box3();
  v.root.traverse((o) => { if (o.isMesh) all.union(new THREE.Box3().setFromObject(o)); });
  check("(c) no part extends past the tail tip", all.min.x >= tail - 0.05, `rearmost point ${all.min.x.toFixed(2)}, tail tip ${tail.toFixed(2)}`);
  check("(c) the tail tip is the end of the fuselage", near(tail, -S.L / 2) && Ly.tail.r < S.R * 0.2);
}

// (d) engine pylon tops touch the wing's lower surface, intakes sit ahead of the wing leading edge
{
  const e = box(v.halves.find((h) => h.name === "engines").right);
  let topWant = -Infinity;
  Ly.nacelles.forEach((n) => {
    const cf = (n.front + 2.0 - Ly.wing.le(n.u)) / Ly.wing.c(n.u);
    topWant = Math.max(topWant, Ly.wing.under(n.u, cf) + 0.06);
    check(`(d) nacelle at span ${n.u.toFixed(1)}: intake ahead of the wing leading edge`, n.front > Ly.wing.le(n.u), `${(n.front - Ly.wing.le(n.u)).toFixed(2)} ahead`);
  });
  check("(d) pylon tops touch the wing underside", near(e.max.y, topWant, 1e-3), `pylon top ${e.max.y.toFixed(3)}, wing underside + 0.06 = ${topWant.toFixed(3)}`);
  const wingSide = box(v.halves.find((h) => h.name === "wing").right);
  check("(d) engines are under the wing (inside its span and below its surface)", e.min.z >= wingSide.min.z && e.max.z <= wingSide.max.z && e.max.y <= wingSide.max.y);
}

// (e) the wing root is between 0.40 L and 0.55 L from the nose
{
  const f = (S.L / 2 - v.anchors.wingRootAnchorRight.position.x) / S.L;
  check("(e) wing root between 0.40 L and 0.55 L", f >= 0.4 && f <= 0.55, `${f.toFixed(3)} L`);
  const span = box(v.halves.find((h) => h.name === "wing").right);
  check("(e) wing span 0.9 to 1.0 L", (span.max.z * 2) / S.L >= 0.85 && (span.max.z * 2) / S.L <= 1.0, `${((span.max.z * 2) / S.L).toFixed(2)} L`);
}

// (f) the side door lies on the fuselage surface (and clear of the wing root)
{
  const d = v.anchors.sideDoorAnchor.position;
  check("(f) side door anchor on the fuselage skin", near(Math.hypot(d.y, d.z), S.R, 1e-9), `r = ${Math.hypot(d.y, d.z).toFixed(4)}, R = ${S.R}`);
  const f = (S.L / 2 - d.x) / S.L;
  check("(f) side door at 0.55 to 0.65 L from the nose", f >= 0.55 && f <= 0.65 + 1e-9, `${f.toFixed(3)} L`);
  check("(f) side door sits in the straight section of the fuselage", Ly.door.x1 < Ly.xAt(S.nose.len) && Ly.door.x0 > Ly.xAt(S.rear.start));
  const wingTE = Ly.wing.le0 - S.wing.rootChord;
  check("(f) the door is behind the wing root", Ly.door.x1 < wingTE - 0.3, `door front ${Ly.door.x1.toFixed(2)}, wing root trailing edge ${wingTE.toFixed(2)}`);
}

console.log(`\nplane: ${v.stats.triangles} triangles drawn, ${v.stats.meshes} meshes`);
console.log(fail ? `${fail} check(s) FAILED` : "all checks passed");
process.exit(fail ? 1 : 0);
