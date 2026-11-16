#!/usr/bin/env node
// Scene lifecycle regression test: leaving the homepage and coming back must give the SAME scene as the first load.
// For every return: visible meshes in each WebGL scene, draw calls, number of canvases, and a hero screenshot compared with the first load.
// node scripts/roundtrip-test.mjs [--rounds 10] [--out dir] [--only home|film]   (site on :8080)
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const ROUNDS = Number(arg("rounds", 10));
const OUT = arg("out", "/tmp/roundtrip");
const ONLY = arg("only", "all");
const MOBILE = arg("mode", "desktop") === "mobile";
// --reduced 1: prefers-reduced-motion, so the hero rests in a fixed pose and the pixel comparison is exact (otherwise the idle float moves the carton a few pixels)
const REDUCED = arg("reduced", "0") === "1";
mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };

const c = await launch(MOBILE ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900 });
const errs = [];
if (REDUCED) await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
c.on("Runtime.exceptionThrown", (e) => errs.push(e.exceptionDetails.exception?.description?.slice(0, 150) ?? "exception"));
const go = async (url) => { await c.send("Page.navigate", { url: BASE + url }); await sleep(500); };
const nav = async (target) => { // client-side navigation by clicking a real link
  const found = await c.ev(`(async()=>{ let a=document.querySelector('a[href="${target}"]'); if(!a){ for(const b of document.querySelectorAll('nav button[aria-haspopup], header button[aria-label*=menu i], header button[aria-expanded]')){ b.click(); await new Promise(r=>setTimeout(r,150)); a=document.querySelector('a[href="${target}"]'); if(a) break; } } if(!a) return false; a.click(); return true; })()`);
  if (!found) throw new Error("no link to " + target);
  await c.waitFor(`location.pathname === ${JSON.stringify(target)}`, 20000);
};
const back = async (expect) => { await c.ev("history.back()"); await c.waitFor(`location.pathname === ${JSON.stringify(expect)}`, 20000); };
const fwd = async (expect) => { await c.ev("history.forward()"); await c.waitFor(`location.pathname === ${JSON.stringify(expect)}`, 20000); };

/** What the homepage scenes contain right now. */
const homeState = () => c.ev(`(()=>{
  const out = { canvases: document.querySelectorAll('canvas').length, scenes: {} };
  const count = (scene) => { let meshes = 0, visible = 0, objects = 0; scene.traverse(o => { objects++; if (o.isMesh || o.isInstancedMesh) { meshes++; let v = true; for (let n = o; n; n = n.parent) if (!n.visible) v = false; if (v) visible++; } }); return { objects, meshes, visibleMeshes: visible }; };
  if (window.__r3f) out.scenes.hero = { ...count(window.__r3f.scene), calls: window.__gl.info.render.calls, tris: window.__gl.info.render.triangles };
  if (window.__glMaking) { const m = window.__makingR3F; if (m) out.scenes.making = { ...count(m.scene), calls: window.__glMaking.info.render.calls }; }
  out.poster = (()=>{const im=document.querySelector('img[fetchpriority=high]'); return im ? getComputedStyle(im).opacity : null})();
  out.glLost = window.__appStore ? window.__appStore.getState().glLost : null;
  out.store = window.__appStore ? JSON.stringify({ heroProgress: window.__appStore.getState().heroProgress, makingProgress: window.__appStore.getState().makingProgress, zones: window.__appStore.getState().zones, sceneActive: window.__appStore.getState().sceneActive }) : null;
  return JSON.stringify(out);
})()`).then(JSON.parse);

const heroShot = async (name) => {
  await c.ev("window.scrollTo(0,0)"); await sleep(1500);
  const { data } = await c.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: MOBILE ? 390 : 1440, height: MOBILE ? 844 : 900, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64"));
  return Buffer.from(data, "base64");
};
const pixelDiff = async (a, b) => { // mean abs difference 0..255 between two PNGs, computed in the page (no extra deps)
  const f = (buf) => buf.toString("base64");
  return c.ev(`(async()=>{ const load=(s)=>new Promise(r=>{const i=new Image(); i.onload=()=>r(i); i.src='data:image/png;base64,'+s}); const [A,B]=await Promise.all([load(${JSON.stringify(f(a))}),load(${JSON.stringify(f(b))})]); const cv=(i)=>{const c=document.createElement('canvas'); c.width=i.width; c.height=i.height; const x=c.getContext('2d'); x.drawImage(i,0,0); return x.getImageData(0,0,c.width,c.height).data}; const da=cv(A), db=cv(B); let s=0; for(let i=0;i<da.length;i+=4){ s+=Math.abs(da[i]-db[i])+Math.abs(da[i+1]-db[i+1])+Math.abs(da[i+2]-db[i+2]); } return s/(da.length/4)/3; })()`);
};

const settle = async () => { await c.waitFor("window.__r3f && window.__gl", 60000); await sleep(3500); };

if (ONLY !== "film") {
  await go("/"); await settle();
  const first = await homeState();
  const firstShot = await heroShot("home-first");
  console.log("first load:", JSON.stringify(first.scenes), `canvases ${first.canvases}`);
  const seq = [];
  const check = async (label) => {
    await settle();
    const s = await homeState();
    const shot = await heroShot(`home-${label.replace(/\W+/g, "_")}`);
    const d = await pixelDiff(firstShot, shot);
    const same = JSON.stringify(Object.fromEntries(Object.entries(s.scenes).map(([k, v]) => [k, [v.visibleMeshes, v.meshes, v.objects]]))) === JSON.stringify(Object.fromEntries(Object.entries(first.scenes).map(([k, v]) => [k, [v.visibleMeshes, v.meshes, v.objects]])));
    seq.push({ label, same, d: +d.toFixed(2) });
    ok(same && s.canvases === first.canvases && (!REDUCED || d < 1) && s.poster === "0" && s.glLost === false, `${label}: scenes ${JSON.stringify(Object.fromEntries(Object.entries(s.scenes).map(([k, v]) => [k, `${v.visibleMeshes}/${v.meshes} meshes ${v.objects} objects ${v.calls} calls`])))}, canvases ${s.canvases}, poster opacity ${s.poster}, glLost ${s.glLost}, hero pixel diff ${d.toFixed(2)}/255${REDUCED ? "" : " (not asserted: the idle float moves the box)"}`);
  };
  const via = ["/industry/chocolate-boxes/", "/quote/", "/configurator/", "/material/rigid-boxes/", "/contact/"];
  for (let r = 0; r < ROUNDS; r++) {
    const p = via[r % via.length];
    await nav(p); await sleep(1500);
    await nav("/"); await check(`round ${r + 1} via ${p} (nav link)`);
  }
  // browser Back / Forward
  for (let r = 0; r < 4; r++) {
    await nav("/industry/chocolate-boxes/"); await sleep(1200);
    await back("/"); await check(`Back ${r + 1}`);
    await fwd("/industry/chocolate-boxes/"); await sleep(1200);
    await back("/"); await check(`Forward then Back ${r + 1}`);
  }
}
/* ---------------------------------------------------------------- film pages: leave and come back, and page A -> page B */
if (ONLY !== "home") {
  const PAGES = ["/material/rigid-boxes/", "/material/corrugated-boxes/", "/shape-and-style/tuck-boxes/", "/shape-and-style/paper-bags/", "/industry/mylar-bags/", "/shape-and-style/hang-tags/", "/shape-and-style/trays-and-sleeves/", "/event/halloween/", "/configurator/"];
  const filmState = async () => { // fixed film progress, so states are comparable
    await c.waitFor("window.__film && document.querySelector('#how canvas, [aria-label^=\"3D preview\"] canvas')", 60000);
    await sleep(1800);
    // the film's progress comes from the scroll position, as for a visitor (the configurator has no scroll film: it uses the fold slider position)
    await c.ev("(()=>{ if (location.pathname === '/configurator/') { window.__film.set(0.6); return; } const el=document.getElementById('how'); const top=el.getBoundingClientRect().top+scrollY; window.scrollTo(0, top+(el.offsetHeight-innerHeight)*0.5); })()");
    await sleep(500);
    return c.ev(`(()=>{ const f=window.__film; let objects=0, meshes=0, visible=0; f.scene.traverse(o=>{ objects++; if(o.isMesh||o.isInstancedMesh){ meshes++; let v=true; for(let n=o;n;n=n.parent) if(!n.visible) v=false; if(v) visible++; } }); const host=document.querySelector('#how canvas, [aria-label^="3D preview"] canvas'); let op=1; for(let p=host;p;p=p.parentElement) op*=+getComputedStyle(p).opacity; return {objects, meshes, visible, calls:f.renderer.info.render.calls, canvases:document.querySelectorAll('canvas').length, hostOpacity:+op.toFixed(2), geos:f.renderer.info.memory.geometries, texs:f.renderer.info.memory.textures}; })()`);
  };
  const stageShot = async (name) => {
    const r = await c.ev(`(()=>{ const cv=document.querySelector('#how canvas, [aria-label^="3D preview"] canvas'); cv.scrollIntoView({block:'center'}); const q=cv.getBoundingClientRect(); return {x:q.x,y:q.y,w:q.width,h:q.height}; })()`);
    await sleep(500);
    const { data } = await c.send("Page.captureScreenshot", { format: "png", clip: { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.w, 700), height: Math.min(r.h, 500), scale: 1 } });
    writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64"));
    return Buffer.from(data, "base64");
  };
  const cold = {};
  for (const p of PAGES) { await go(p); const s = await filmState(); cold[p] = { s, shot: await stageShot("film-cold-" + p.replace(/\W+/g, "_")) }; }
  console.log("cold states:", PAGES.map((p) => `${p.split("/").filter(Boolean).pop()} ${cold[p].s.visible}/${cold[p].s.meshes} meshes ${cold[p].s.objects} objects ${cold[p].s.calls} calls`).join(" | "));
  // scene contents must be identical; GPU geometries and textures may be fewer (which parts were drawn so far differs) but never MORE than a cold load: that would be a leftover
  const same = (a, b) => ["objects", "meshes", "visible", "calls", "canvases"].every((k) => a[k] === b[k]) && b.geos <= a.geos && b.texs <= a.texs && b.hostOpacity === 1;
  await go(PAGES[0]); await filmState();
  const arrive = async (p, label) => {
    const s = await filmState();
    const d = await pixelDiff(cold[p].shot, await stageShot("film-" + label.replace(/\W+/g, "_")));
    ok(same(cold[p].s, s) && d < 4, `${label}: ${s.visible}/${s.meshes} meshes ${s.objects} objects ${s.calls} calls ${s.geos} geometries ${s.texs} textures (cold ${cold[p].s.visible}/${cold[p].s.meshes} ${cold[p].s.objects} ${cold[p].s.calls}), stage opacity ${s.hostOpacity}, pixel diff ${d.toFixed(2)}/255`);
  };
  // A -> home -> A, for every page
  for (const p of PAGES) { await nav("/"); await sleep(2500); await nav(p); await arrive(p, `leave to the homepage and come back to ${p}`); }
  // A -> B chains (through the menu), twice around
  for (let r = 0; r < 2; r++) for (const p of PAGES.slice(1)) { await nav(p); await arrive(p, `go to ${p} from the previous film page (lap ${r + 1})`); }
  // Back / Forward between film pages
  for (let r = 0; r < 3; r++) { await back(PAGES.at(-2)); await arrive(PAGES.at(-2), `Back to ${PAGES.at(-2)} (${r + 1})`); await fwd(PAGES.at(-1)); await arrive(PAGES.at(-1), `Forward to ${PAGES.at(-1)} (${r + 1})`); await back(PAGES.at(-2)); await arrive(PAGES.at(-2), `Back again (${r + 1})`); await fwd(PAGES.at(-1)); await arrive(PAGES.at(-1), `Forward again (${r + 1})`); }
}
ok(errs.length === 0, "no uncaught errors" + (errs.length ? ": " + errs[0] : ""));
c.kill();
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
