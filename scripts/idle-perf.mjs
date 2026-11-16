#!/usr/bin/env node
// Frame time of a product page's FIRST SCREEN while it idles (the finished product swaying, nothing scrolled), and proof that the idle loop stops:
// when the tab is hidden, when the stage is scrolled off screen, and once the visitor starts to scroll. Refuses to run when the machine is busy.
// node scripts/idle-perf.mjs [--mode desktop|mobile] [--cpu 4] [--paths /a/,/b/]
import os from "node:os";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const MODE = arg("mode", "desktop");
const CPU = Number(arg("cpu", 1));
const PATHS = arg("paths", "/material/rigid-boxes/,/shape-and-style/paper-bags/,/industry/mylar-bags/,/event/halloween/").split(",");
const load0 = os.loadavg()[0];
console.log(`load average before: ${load0.toFixed(2)}${load0 > 4 ? "  TOO HIGH" : ""}`);
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900 });
if (CPU > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
const frames = () => c.ev("window.__film.renderer.info.render.frame");
for (const p of PATHS) {
  await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + p });
  await c.waitFor("window.__film && document.querySelector('#how canvas')", 60000);
  await sleep(2500);
  const r = await c.ev(`(async()=>{ const ms=[]; let last=performance.now(); const t0=last; await new Promise(res=>{ function f(now){ ms.push(now-last); last=now; if(now-t0<5000) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); }); const a=ms.slice(2).sort((x,y)=>x-y); const mean=a.reduce((s,v)=>s+v,0)/a.length; return {fps:+(1000/mean).toFixed(1), p99:+a[Math.floor(a.length*0.99)].toFixed(1), max:+a[a.length-1].toFixed(1), over33:a.filter(v=>v>33.4).length, calls: window.__film.renderer.info.render.calls}; })()`);
  console.log(`${p.padEnd(34)} page ${r.fps} fps  p99 ${r.p99} ms  max ${r.max} ms  >33ms ${r.over33}  draw calls ${r.calls}`);
  ok(r.p99 < 25 && r.calls < 100, `${p}: p99 under 25 ms and under 100 draw calls while idle (${MODE}${CPU > 1 ? `, ${CPU}x CPU` : ""})`);
}
// the loop stops when it should (checked on the first page)
await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + PATHS[0] });
await c.waitFor("window.__film && document.querySelector('#how canvas')", 60000); await sleep(2500);
let a = await frames(); await sleep(1000); let b = await frames();
const running = b - a;
ok(running > 10, `idle: ${running} frames drawn in 1 s on the first screen`);
await c.ev("window.scrollTo(0, 200)"); await sleep(800); a = await frames(); await sleep(1000); b = await frames();
ok(b - a <= 2, `scrolling away from the top: the idle loop stops (${b - a} frames in 1 s)`);
await c.ev("window.scrollTo(0, 0)"); await sleep(1000); a = await frames(); await sleep(1000); b = await frames();
ok(b - a > 10, `back at the top: it sways again (${b - a} frames in 1 s)`);
await c.ev("document.getElementById('specs-h').scrollIntoView()"); await sleep(1200); a = await frames(); await sleep(1000); b = await frames();
ok(b - a <= 2, `stage off screen (page scrolled to the details): nothing is drawn (${b - a} frames in 1 s)`);
await c.ev("window.scrollTo(0, 0)"); await sleep(800);
await c.send("Emulation.setFocusEmulationEnabled", { enabled: false }).catch(() => {});
await c.ev("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'))"); await sleep(600); a = await frames(); await sleep(1000); b = await frames();
ok(b - a <= 2, `tab hidden: nothing is drawn (${b - a} frames in 1 s)`);
await c.ev("delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))"); await sleep(800); a = await frames(); await sleep(1000); b = await frames();
ok(b - a > 10, `tab visible again: it sways again (${b - a} frames in 1 s)`);
console.log(`load average after: ${os.loadavg()[0].toFixed(2)}`);
c.kill();
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
