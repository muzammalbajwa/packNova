import * as THREE from "three";
import { VEHICLE } from "@/lib/journey";

/**
 * A stylized, clean low-poly cargo plane (no livery, no real airline or aircraft). The stage logic never touches its
 * meshes: it places `root`, and calls `setGear` and `setHatch` with plain numbers. To ship by sea instead, write
 * another builder that returns the same `Vehicle` and set the numbers in `VEHICLE` (lib/journey.ts).
 */
export interface VehiclePalette {
  body: THREE.Color;
  shade: THREE.Color;
  accent: THREE.Color;
  dark: THREE.Color;
  inner: THREE.Color;
}

export interface Vehicle {
  /** Local origin = centre of the aft hatch on the axis; nose toward +x, up toward +y. */
  root: THREE.Group;
  /** 1 = landing gear down, 0 = retracted. */
  setGear(extended: number): void;
  /** 0 = hatch swung up and open, 1 = closed. */
  setHatch(closed: number): void;
  dispose(): void;
}

const HATCH_OPEN = -1.75; // rad about the hinge at the top of the hatch (swung up and out, toward -x)

export function createCargoPlane(p: VehiclePalette, low: boolean): Vehicle {
  const R = VEHICLE.R;
  const seg = low ? 12 : 18;
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const g = <T extends THREE.BufferGeometry>(geo: T) => (geos.push(geo), geo);
  const m = (color: THREE.Color, o: THREE.MeshStandardMaterialParameters = {}) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, ...o });
    mats.push(mat);
    return mat;
  };

  const body = m(p.body);
  const shade = m(p.shade);
  const accent = m(p.accent, { roughness: 0.5 });
  const dark = m(p.dark, { roughness: 0.8 });
  const inner = m(p.inner, { roughness: 0.95, side: THREE.BackSide });

  const root = new THREE.Group();
  const add = (mesh: THREE.Object3D, parent: THREE.Object3D = root) => (parent.add(mesh), mesh);

  /* fuselage: an open tube (the hold) with a nose cone; the inside is a darker shell so the hatch looks deep */
  const L = VEHICLE.holdLen;
  const tube = new THREE.Mesh(g(new THREE.CylinderGeometry(R, R, L, seg, 1, true)), body);
  tube.rotation.z = -Math.PI / 2;
  tube.position.x = L / 2;
  add(tube);
  const hold = new THREE.Mesh(g(new THREE.CylinderGeometry(R - 0.06, R - 0.06, L, seg, 1, true)), inner);
  hold.rotation.z = -Math.PI / 2;
  hold.position.x = L / 2;
  add(hold);
  const nose = new THREE.Mesh(g(new THREE.CylinderGeometry(0.45, R, VEHICLE.len - L, seg)), body);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = L + (VEHICLE.len - L) / 2;
  add(nose);
  const bulkhead = new THREE.Mesh(g(new THREE.CircleGeometry(R - 0.05, seg)), dark);
  bulkhead.rotation.y = -Math.PI / 2; // faces the hatch (-x)
  bulkhead.position.x = L - 0.05;
  add(bulkhead);
  const floor = new THREE.Mesh(g(new THREE.BoxGeometry(L - 0.4, 0.16, 4.7)), shade);
  floor.position.set(L / 2, VEHICLE.floorY - 0.08, 0);
  add(floor);
  const stripe = new THREE.Mesh(g(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 1.9, seg, 1, true)), accent);
  stripe.rotation.z = -Math.PI / 2;
  stripe.position.x = L * 0.62;
  add(stripe);
  const cockpit = new THREE.Mesh(g(new THREE.BoxGeometry(2.2, 0.35, 3.2)), dark);
  cockpit.position.set(L + 1.4, 2.5, 0);
  cockpit.rotation.z = -0.4;
  add(cockpit);

  /* planform helper: a flat extruded outline in the xz plane (x forward, z span), thickness along y */
  const planform = (pts: [number, number][], thick: number) => {
    const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); // shape y -> world -z, extrusion z -> world +y
    geo.translate(0, -thick / 2, 0);
    return g(geo);
  };

  /* high swept wings */
  const wingGeo = planform([[8, 0], [17.5, 0], [18.2, 16], [14.6, 16]], 0.42);
  const wingY = R * 0.72;
  for (const side of [1, -1]) {
    const w = new THREE.Mesh(wingGeo, shade);
    w.position.y = wingY;
    w.scale.z = side;
    add(w);
  }
  /* engines under the wings (instanced) */
  const engGeo = g(new THREE.CylinderGeometry(0.85, 0.7, 3.6, 10));
  const engines = new THREE.InstancedMesh(engGeo, dark, 4);
  const em = new THREE.Matrix4();
  [[11.4, 5.6], [11.4, -5.6], [12.8, 10.6], [12.8, -10.6]].forEach(([x, z], i) => {
    em.compose(new THREE.Vector3(x, wingY - 1.45, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2)), new THREE.Vector3(1, 1, 1));
    engines.setMatrixAt(i, em);
  });
  engines.instanceMatrix.needsUpdate = true;
  add(engines);

  /* T-tail: fin and stabilizers */
  const fin = new THREE.Mesh(g(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0.4, 0), new THREE.Vector2(8.2, 0), new THREE.Vector2(5.6, 6.6), new THREE.Vector2(1.8, 6.6)]), { depth: 0.4, bevelEnabled: false })), body);
  fin.position.set(0, R - 0.1, -0.2);
  add(fin);
  const finTop = new THREE.Mesh(g(new THREE.BoxGeometry(3.8, 0.9, 0.46)), accent);
  finTop.position.set(3.7, R + 6.15, 0);
  add(finTop);
  const stabGeo = planform([[1.5, 0], [6.2, 0], [5.4, 5.6], [2.6, 5.6]], 0.3);
  for (const side of [1, -1]) {
    const s = new THREE.Mesh(stabGeo, shade);
    s.position.y = R + 6.6;
    s.scale.z = side;
    add(s);
  }

  /* landing gear: wheels and struts, retracted by scaling about the belly */
  const gear = new THREE.Group();
  const wheelGeo = g(new THREE.CylinderGeometry(0.8, 0.8, 0.55, 12));
  const strutGeo = g(new THREE.BoxGeometry(0.24, 0.5, 0.24));
  const spots: [number, number][] = [[10, 1.9], [10, -1.9], [13.5, 1.9], [13.5, -1.9], [22, 0]];
  const wheels = new THREE.InstancedMesh(wheelGeo, dark, spots.length);
  const struts = new THREE.InstancedMesh(strutGeo, shade, spots.length);
  spots.forEach(([x, z], i) => {
    em.compose(new THREE.Vector3(x, -R - 0.4, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), new THREE.Vector3(1, 1, 1));
    wheels.setMatrixAt(i, em);
    em.compose(new THREE.Vector3(x, -R - 0.15, z), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    struts.setMatrixAt(i, em);
  });
  wheels.instanceMatrix.needsUpdate = true;
  struts.instanceMatrix.needsUpdate = true;
  gear.add(wheels, struts);
  gear.position.y = -R; // pivot at the belly
  wheels.position.y = R;
  struts.position.y = R;
  add(gear);

  /* aft hatch: a disc hinged at the top of the opening */
  const hinge = new THREE.Group();
  hinge.position.set(0, R, 0);
  const door = new THREE.Mesh(g(new THREE.CylinderGeometry(R * 0.995, R * 0.995, 0.14, seg)), shade);
  door.rotation.z = Math.PI / 2; // disc faces x
  door.position.y = -R;
  hinge.add(door);
  const doorBand = new THREE.Mesh(g(new THREE.BoxGeometry(0.16, 0.7, R * 1.5)), accent);
  doorBand.position.set(-0.08, -R, 0);
  hinge.add(doorBand);
  add(hinge);

  return {
    root,
    setGear(e) {
      gear.scale.y = Math.max(0.001, e);
      gear.visible = e > 0.01;
    },
    setHatch(closed) {
      hinge.rotation.z = HATCH_OPEN * (1 - closed);
    },
    dispose() {
      geos.forEach((x) => x.dispose());
      mats.forEach((x) => x.dispose());
    },
  };
}
