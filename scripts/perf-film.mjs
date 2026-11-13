#!/usr/bin/env node
// Frame rate of a product film while scrolling through it (down then back up). Refuses to run when the machine is busy.
// node scripts/perf-film.mjs --paths /a/,/b/ [--mode desktop|mobile] [--cpu 1|4] [--dur 12000] [--force 1] [--out file.json]
import os from "node:os";
import { writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const PATHS = arg("paths", "/industry/jewelry-boxes/").split(",");
const MODE = arg("mode", "desktop");
const CPU = Number(arg("cpu", 1));
const DUR = Number(arg("dur", 12000));
const load0 = os.loadavg()[0];
console.log(`load average (1 min) before: ${load0.toFixed(2)}${load0 > 4 ? "  TOO HIGH" : ""}`);
if (load0 > 4 && arg("force", "0") !== "1") { console.log("machine is busy: timings would be wrong. Wait, or pass --force 1 (results are then labelled)."); process.exit(2); }
const rows = [];
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
if (CPU > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
for (const path of PATHS) {
  await c.send("Page.navigate", { url: BASE + path });
  await c.waitFor("window.__film && document.querySelector('#how canvas')", 60000);
  await sleep(2500);
  const r = await c.ev(`(async()=>{
    const el=document.getElementById('how'); const top=el.getBoundingClientRect().top+scrollY; const max=el.offsetHeight-innerHeight;
    window.__perfOn=true; window.__filmMs={buf:new Float32Array(30000),n:0};
    const ms=[]; let last=performance.now(); const t0=last; const dur=${DUR};
    await new Promise(res=>{ function f(now){ ms.push(now-last); last=now; const e=(now-t0)/dur; const ph=e<0.5?e*2:2-e*2; window.scrollTo(0, top+max*Math.min(1,Math.max(0,ph))); if(e<1) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
    window.__perfOn=false;
    const a=ms.slice(2); const sorted=[...a].sort((x,y)=>x-y); const mean=a.reduce((s,v)=>s+v,0)/a.length;
    const fm=window.__filmMs; const fa=[...fm.buf.subarray(0,Math.min(fm.n,30000))].sort((x,y)=>x-y);
    const info=window.__film.renderer.info;
    return { frames:a.length, fps:+(1000/mean).toFixed(1), p99ms:+sorted[Math.floor(a.length*0.99)].toFixed(1), maxms:+sorted[a.length-1].toFixed(1), over33:a.filter(v=>v>33.4).length,
      filmDraws:fa.length, drawAvgMs: fa.length? +(fa.reduce((s,v)=>s+v,0)/fa.length).toFixed(2):0, drawP99Ms: fa.length? +fa[Math.floor(fa.length*0.99)].toFixed(2):0, calls:info.render.calls, tris:info.render.triangles };
  })()`);
  const row = { path, mode: MODE, cpu: CPU, ...r };
  rows.push(row);
  console.log(JSON.stringify(row));
}
const load1 = os.loadavg()[0];
console.log(`load average (1 min) after: ${load1.toFixed(2)}`);
if (arg("out", "")) writeFileSync(arg("out", ""), JSON.stringify({ load0, load1, rows }, null, 1));
c.kill();
process.exit(0);
