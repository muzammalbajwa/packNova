#!/usr/bin/env node
// Cold-jump test: for each progress point, load the page cold, jump the scroll straight to that point
// and measure the time until the making-of canvas has drawn non-transparent pixels.
// Usage: node scripts/cold-jump.mjs --template cinematic [--base http://127.0.0.1:8080] [--cpu 1|4] [--mobile] [--force]
// Pass: every jump < 1000 ms. Refuses to run when the 1-minute load average is above 4 (--force overrides).
import { loadavg } from "node:os";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TEMPLATE = arg("template", "eco");
const CPU = Number(arg("cpu", 1));
const SLOW = process.argv.includes("--slow4g"); // cache off + Slow 4G + CPU throttle already during load
const MOBILE = process.argv.includes("--mobile");
const POINTS = arg("points", "0.05,0.2,0.35,0.5,0.7,0.85,1").split(",").map(Number);
const load0 = +loadavg()[0].toFixed(2);
if (load0 > 4 && !process.argv.includes("--force")) { console.error(`Load average ${load0} (> 4). Retry on a quiet machine or pass --force.`); process.exit(2); }

// Installed before any page script: patches the renderer as soon as the making canvas registers it.
const HOOK = `(()=>{
  window.__first = null; window.__t0 = null; window.__lt = []; window.__renders = 0;
  try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ entryTypes: ['longtask'] }); } catch {}
  const probe = document.createElement('canvas'); probe.width = 48; probe.height = 30;
  const pg = probe.getContext('2d', { willReadFrequently: true });
  let gl_;
  Object.defineProperty(window, '__glMaking', { configurable: true, get() { return gl_; }, set(gl) {
    gl_ = gl; const r = gl.render.bind(gl);
    gl.render = (s, c) => { r(s, c); window.__renders++;
      if (window.__t0 != null && window.__first == null) {
        pg.clearRect(0, 0, 48, 30); pg.drawImage(gl.domElement, 0, 0, 48, 30);
        const d = pg.getImageData(0, 0, 48, 30).data; let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 12) n++;
        if (n > 20) window.__first = performance.now() - window.__t0;
      } };
  } });
})();`;

const rows = [];
for (const p of POINTS) {
  const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.addScriptToEvaluateOnNewDocument", { source: HOOK });
  if (SLOW) {
    await c.send("Network.enable"); await c.send("Network.setCacheDisabled", { cacheDisabled: true });
    await c.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    if (CPU > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  }
  await c.send("Page.navigate", { url: `${BASE}/?${MOBILE ? "" : "tier=mid"}` });
  await c.waitFor("document.readyState==='complete' && !document.querySelector('[role=status]') && !!document.getElementById('making')", 180000);
  await sleep(600);
  if (CPU > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await c.ev(`(()=>{window.__lt.length=0; const el=document.getElementById('making'); const y=el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*${p};
    window.__t0=performance.now(); window.scrollTo(0,y); })()`);
  const ok = await c.waitFor("window.__first!=null", 15000);
  const first = ok ? await c.ev("Math.round(window.__first)") : null;
  const lt = JSON.parse(await c.ev("JSON.stringify(window.__lt.filter(l=>l[1]>=50))"));
  const t0 = await c.ev("Math.round(window.__t0)");
  rows.push({ progress: p, ms: first ?? "never (>15000)", longTasks: lt.map(([s, d]) => `${s - t0}+${d}`).join(" ") || "-" });
  c.kill(); await sleep(400);
}
console.log(`\n${SLOW ? "COLD + Slow 4G " : ""}${TEMPLATE} ${MOBILE ? "mobile" : "desktop"}  CPU ${CPU}x  load ${load0}`);
console.table(rows);
const nums = rows.map((r) => r.ms).filter((x) => typeof x === "number").sort((a, b) => a - b);
console.log(`median ${nums[Math.floor(nums.length / 2)]} ms, worst ${rows.some((r) => typeof r.ms !== "number") ? "never" : nums.at(-1) + " ms"}  =>  ${rows.every((r) => typeof r.ms === "number" && r.ms < 1000) ? "PASS" : "FAIL"}`);
process.exit(0);
