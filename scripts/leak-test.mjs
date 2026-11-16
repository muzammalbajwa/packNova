#!/usr/bin/env node
// Client-side navigation test: home -> rigid -> corrugated -> folding -> home -> rigid -> ... (10 transitions, real link clicks).
// After each page settles: film renderer geometries / textures / programs, and how many WebGL contexts are alive
// (the homepage canvases and the film renderer must never be alive together). node scripts/leak-test.mjs [--base url]
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const DEFAULT_SEQ = ["/material/rigid-boxes/", "/material/corrugated-boxes/", "/shape-and-style/folding-cartons/", "/", "/material/rigid-boxes/", "/material/corrugated-boxes/", "/shape-and-style/folding-cartons/", "/", "/material/rigid-boxes/", "/material/corrugated-boxes/"];
const SEQ = arg("seq", "") ? arg("seq", "").split(",") : DEFAULT_SEQ; // --seq /a/,/b/,/ ... to walk another set of pages
const c = await launch({ width: 1440, height: 900, dpr: 1 });
// track every WebGL context created by the page
await c.send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{ window.__ctxs=[]; const g=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(t,...a){ const r=g.call(this,t,...a); if(r && /webgl/.test(t) && !window.__ctxs.includes(r)) window.__ctxs.push(r); return r; }; })()` });
await c.send("Page.navigate", { url: BASE + "/" });
await c.waitFor("window.__r3f && document.querySelector('canvas')", 60000);
await sleep(3500);
const ctxAlive = `(()=>{ const alive = window.__ctxs.filter(g => !g.isContextLost() && g.canvas.isConnected); return alive.length; })()`;
// 'alive' counts contexts that are not lost. A canvas removed from the DOM but not lost still holds a context, so count those too.
const aliveAll = `(()=>window.__ctxs.filter(g => !g.isContextLost()).length)()`;
const stats = `(()=>{ const f=window.__film; return f ? { geos:f.renderer.info.memory.geometries, texs:f.renderer.info.memory.textures, progs:f.renderer.info.programs.length } : null; })()`;
const goTo = async (target) => {
  const found = await c.ev(`(async()=>{
    const sel = 'a[href="${target}"]';
    let a = document.querySelector(sel);
    if (!a) { for (const b of document.querySelectorAll('nav button[aria-haspopup]')) { b.click(); await new Promise(r=>setTimeout(r,120)); a = document.querySelector(sel); if (a) break; } }
    if (!a) return false;
    a.click(); return true;
  })()`);
  if (!found) throw new Error("no link to " + target);
  await c.waitFor(`location.pathname === ${JSON.stringify(target)}`, 20000);
};
let ok = true;
let prev = null;
const rows = [];
const show = (i, path, s, alive, both) => console.log(`${String(i).padStart(2)}  ${path.padEnd(38)} film geos ${s ? String(s.geos).padStart(3) : "  -"}  texs ${s ? String(s.texs).padStart(2) : " -"}  programs ${s ? String(s.progs).padStart(2) : " -"}   WebGL contexts alive: ${alive}${both ? "  <-- BOTH" : ""}`);
let maxAlive = 0;
let bothSeen = false;
for (let i = 0; i < SEQ.length; i++) {
  // watch the context count continuously during the transition
  await c.ev(`window.__maxAlive = 0; window.__watch = setInterval(()=>{ const n=window.__ctxs.filter(g=>!g.isContextLost()).length; if(n>window.__maxAlive) window.__maxAlive=n; const home = [window.__gl, window.__glMaking].some(r=>r && !r.getContext().isContextLost()); const film = window.__film && !window.__film.renderer.getContext().isContextLost(); if (home && film) window.__both = true; }, 15); 0`);
  await goTo(SEQ[i]);
  if (SEQ[i] !== "/") await c.waitFor("window.__film && document.querySelector('#how canvas') && getComputedStyle(document.querySelector('#how canvas').parentElement).opacity === '1'", 30000);
  await sleep(SEQ[i] === "/" ? 3500 : 1500);
  const s = await c.ev(stats);
  const alive = await c.ev(aliveAll);
  const mx = await c.ev("window.__maxAlive");
  const both = await c.ev("!!window.__both");
  await c.ev("clearInterval(window.__watch); 0");
  maxAlive = Math.max(maxAlive, mx);
  bothSeen ||= both;
  show(i + 1, SEQ[i], s, `${alive} (max ${mx} during the transition)`, both);
  rows.push({ path: SEQ[i], s });
}
// growth: compare film pages visited more than once
const byPath = {};
for (const r of rows) if (r.s) (byPath[r.path] ??= []).push(r.s);
for (const [p, list] of Object.entries(byPath)) {
  const g = list.map((x) => x.geos), t = list.map((x) => x.texs);
  const grew = list.length > 1 && (g[g.length - 1] > g[0] || t[t.length - 1] > t[0]);
  console.log(`${grew ? "FAIL" : "PASS"}  ${p}: geometries ${g.join(" -> ")}, textures ${t.join(" -> ")}`);
  ok &&= !grew;
}
console.log(`${bothSeen ? "FAIL" : "PASS"}  homepage engine and film renderer were never alive together`);
console.log(`${maxAlive <= 2 ? "PASS" : "FAIL"}  most WebGL contexts alive at once: ${maxAlive}`);
ok &&= !bothSeen && maxAlive <= 2;
c.kill();
process.exit(ok ? 0 : 1);
