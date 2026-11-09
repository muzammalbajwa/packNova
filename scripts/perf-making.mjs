#!/usr/bin/env node
// Frame stats for the making-of section on the production export, plus initial JS size and draw calls.
// Usage: npm run build && npm run serve:out   (other terminal)
//        node scripts/perf-making.mjs [--base http://localhost:8080] [--cpu 1|4] [--seconds 24] [--mobile] [--tier low|mid|high]
// Run on a QUIET machine: it refuses to start if the 1-minute load average is above 4 (use --force to override).
import { writeFileSync, mkdirSync } from "node:fs";
import { loadavg } from "node:os";
import { gzipSync } from "node:zlib";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://localhost:8080");
const CPU = Number(arg("cpu", 1));
const SECONDS = Number(arg("seconds", 24));
const MOBILE = process.argv.includes("--mobile");
const TIER = arg("tier", MOBILE ? "" : "mid");
const load0 = +loadavg()[0].toFixed(2);
if (load0 > 4 && !process.argv.includes("--force")) {
  console.error(`Load average is ${load0} (> 4). Close heavy apps and retry, or pass --force.`);
  process.exit(2);
}

const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
await c.send("Network.enable");
await c.send("Page.navigate", { url: `${BASE}/?theme=a${TIER ? `&tier=${TIER}` : ""}` });
await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')", 90000);
await sleep(1500);

// initial JS = every script loaded before the making chunk is requested (we are still at the top of the page)
const scripts = JSON.parse(await c.ev(`JSON.stringify(performance.getEntriesByType('resource').filter(e => e.initiatorType === 'script' || /\\.js(\\?|$)/.test(e.name)).map(e => e.name))`));
let gz = 0, raw = 0;
for (const url of [...new Set(scripts)]) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  raw += buf.length; gz += gzipSync(buf, { level: 9 }).length;
}
const gpu = await c.ev(`(()=>{const g=document.createElement('canvas').getContext('webgl');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'no webgl'})()`);

// scroll to just before the section so the lazy chunk loads, then wait for it
await c.ev(`(()=>{const el=document.getElementById('making');window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight*0.6)})()`);
await c.waitFor("window.__glMaking", 60000);
await sleep(1500);
const lazy = JSON.parse(await c.ev(`JSON.stringify(performance.getEntriesByType('resource').filter(e => /\\.js(\\?|$)/.test(e.name)).map(e => e.name))`));
let lazyGz = 0;
for (const url of lazy.filter((u) => !scripts.includes(u))) lazyGz += gzipSync(Buffer.from(await (await fetch(url)).arrayBuffer()), { level: 9 }).length;

await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
const stats = JSON.parse(await c.ev(`(async () => {
  const el = document.getElementById('making');
  const top = el.getBoundingClientRect().top + scrollY;
  const len = el.offsetHeight - innerHeight;
  const d = []; let calls = 0, tris = 0, last = performance.now(); const start = last;
  const ms = ${SECONDS * 1000};
  await new Promise((res) => (function f(now) {
    d.push(now - last); last = now;
    const p = Math.min(1, (now - start) / ms);
    window.scrollTo(0, top + len * p);   // steady scroll through every stage
    const gl = window.__glMaking; if (gl) { calls = Math.max(calls, gl.info.render.calls); tris = Math.max(tris, gl.info.render.triangles); }
    if (now - start < ms) requestAnimationFrame(f); else res();
  })(last));
  d.shift();
  const s = [...d].sort((a, b) => a - b);
  const q = (x) => s[Math.min(s.length - 1, Math.floor(s.length * x))];
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  return JSON.stringify({ frames: d.length, avgFps: +(1000 / mean).toFixed(1), p95ms: +q(0.95).toFixed(1), p99ms: +q(0.99).toFixed(1), maxMs: +s[s.length - 1].toFixed(1), over33ms: d.filter((x) => x > 33.4).length, over33pct: +(100 * d.filter((x) => x > 33.4).length / d.length).toFixed(1), maxDrawCalls: calls, maxTriangles: tris });
})()`));

const out = {
  when: new Date().toISOString(), gpu, cpuThrottle: CPU, mobile: MOBILE, tier: TIER || "auto", seconds: SECONDS,
  loadAverageAtStart: load0, loadAverageAtEnd: +loadavg()[0].toFixed(2),
  initialJs: { files: new Set(scripts).size, rawKB: +(raw / 1024).toFixed(1), gzipKB: +(gz / 1024).toFixed(1), budgetKB: 300 },
  lazyMakingChunksGzipKB: +(lazyGz / 1024).toFixed(1),
  makingOf: stats,
};
mkdirSync("docs/perf", { recursive: true });
const file = `docs/perf/making-cpu${CPU}${MOBILE ? "-mobile" : ""}.json`;
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2), "\nwrote", file);
c.kill(); process.exit(0);
