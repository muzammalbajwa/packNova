#!/usr/bin/env node
// For each page: sweep the film progress 0..1 and check that something is in view at every step (no empty frames),
// and report draw calls and triangles (max over the sweep). node scripts/film-sweep.mjs --paths /a/,/b/ [--n 100] [--mode desktop|mobile]
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const PATHS = arg("paths", "/industry/jewelry-boxes/").split(",");
const N = Number(arg("n", 100));
const MODE = arg("mode", "desktop");
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
let bad = 0;
for (const path of PATHS) {
  await c.send("Page.navigate", { url: BASE + path });
  await c.waitFor("window.__film && document.querySelector('#how canvas')", 30000);
  await sleep(1200);
  const r = await c.ev(`(async()=>{
    const f = window.__film; const info = f.renderer.info;
    let empty = [], maxCalls = 0, maxTris = 0, minCalls = 1e9;
    const el = document.getElementById('how'); const top = el.getBoundingClientRect().top + scrollY;
    for (let i = 0; i <= ${N}; i++) {
      const p = i / ${N};
      window.scrollTo(0, top + (el.offsetHeight - innerHeight) * p);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise(r => requestAnimationFrame(r));
      const calls = info.render.calls, tris = info.render.triangles;
      if (!f.visible() || calls < 3) empty.push(p.toFixed(2));
      maxCalls = Math.max(maxCalls, calls); minCalls = Math.min(minCalls, calls); maxTris = Math.max(maxTris, tris);
    }
    return { empty, maxCalls, minCalls, maxTris, geos: info.memory.geometries, texs: info.memory.textures };
  })()`);
  bad += r.empty.length;
  console.log(path, MODE, JSON.stringify(r));
}
c.kill();
process.exit(bad ? 1 : 0);
