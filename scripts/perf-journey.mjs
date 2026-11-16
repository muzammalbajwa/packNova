#!/usr/bin/env node
// Frame stats while scrolling steadily through the "Shipped" chapter (count, pack, load, fly, deliver), overall and per stage.
// node scripts/perf-journey.mjs --template cinematic [--base http://127.0.0.1:8080] [--cpu 1|4] [--seconds 30] [--mobile] [--tier mid|low]
// Refuses to run when the 1-minute load average is above 4 (--force overrides): frame times mean nothing on a busy machine.
import { writeFileSync, mkdirSync } from "node:fs";
import { loadavg } from "node:os";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TEMPLATE = arg("template", "eco");
const CPU = Number(arg("cpu", 1));
const SECONDS = Number(arg("seconds", 30));
const MOBILE = process.argv.includes("--mobile");
const TIER = arg("tier", MOBILE ? "" : "mid");
const load0 = +loadavg()[0].toFixed(2);
if (load0 > 4 && !process.argv.includes("--force")) { console.error(`Load average is ${load0} (> 4). Retry on a quiet machine or pass --force.`); process.exit(2); }

const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
await c.send("Page.navigate", { url: `${BASE}/?preview=0${TIER ? `&tier=${TIER}` : ""}` });
await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && window.__makingSet", 120000);
await sleep(2500);
await c.ev(`(()=>{const el=document.getElementById('making'); window.scrollTo(0, el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*0.55);})()`);
await sleep(2500);
await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
const res = JSON.parse(await c.ev(`(async () => {
  const el = document.getElementById('making');
  const top = el.getBoundingClientRect().top + scrollY, len = el.offsetHeight - innerHeight;
  const P0 = 0.58, ms = ${SECONDS * 1000};
  const STAGES = [['count',0.58,0.665],['pack',0.665,0.77],['load',0.77,0.835],['fly',0.835,0.93],['deliver',0.93,1]];
  const rows = Object.fromEntries(STAGES.map(s => [s[0], []])); const all = [];
  let last = performance.now(); const start = last; let calls = 0;
  await new Promise((res) => (function f(now) {
    const dt = now - last; last = now;
    const p = P0 + (1 - P0) * Math.min(1, (now - start) / ms);
    window.scrollTo(0, top + len * p);
    const st = STAGES.find(s => p >= s[1] && p <= s[2]) || STAGES[4];
    if (now > start + 50) { rows[st[0]].push(dt); all.push(dt); }
    const gl = window.__glMaking; if (gl) calls = Math.max(calls, gl.info.render.calls);
    if (now - start < ms) requestAnimationFrame(f); else res();
  })(last));
  const stat = (d) => { const s = [...d].sort((a, b) => a - b); const q = (x) => s[Math.min(s.length - 1, Math.floor(s.length * x))]; const mean = d.reduce((a, b) => a + b, 0) / d.length;
    return { frames: d.length, avgFps: +(1000 / mean).toFixed(1), p95ms: +q(0.95).toFixed(1), p99ms: +q(0.99).toFixed(1), over33ms: d.filter((x) => x > 33.4).length, over33pct: +(100 * d.filter((x) => x > 33.4).length / d.length).toFixed(1) }; };
  return JSON.stringify({ calls, overall: stat(all), perStage: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, stat(v)])) });
})()`));
const out = { when: new Date().toISOString(), template: TEMPLATE, cpuThrottle: CPU, mobile: MOBILE, tier: TIER || "auto", seconds: SECONDS, loadAverageAtStart: load0, loadAverageAtEnd: +loadavg()[0].toFixed(2), ...res };
mkdirSync("docs/perf", { recursive: true });
const file = `docs/perf/journey-${TEMPLATE}-cpu${CPU}${MOBILE ? "-mobile" : ""}.json`;
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`\n${TEMPLATE} ${MOBILE ? "mobile" : "desktop"} CPU ${CPU}x tier ${out.tier}  load ${load0} -> ${out.loadAverageAtEnd}   max draw calls ${res.calls}`);
console.table({ overall: res.overall, ...res.perStage });
c.kill(); process.exit(0);
