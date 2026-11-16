#!/usr/bin/env node
// CPU profile of the homepage load on a phone profile (390x844, 4x CPU): long tasks over 50 ms with start time, and the heaviest functions by self time.
// node scripts/home-profile.mjs [--path /] [--cpu 4] [--secs 9]   (site on :8080; refuses nothing, but notes the load)
import os from "node:os";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const OFFSET = Number(arg("offset", 0));
const PATH = arg("path", "/"), CPU = Number(arg("cpu", 4)), SECS = Number(arg("secs", 9));
console.log(`load before ${os.loadavg()[0].toFixed(2)}`);
const c = await launch({ width: 390, height: 844, dpr: 2, mobile: true, cores: 4, eager: process.argv.includes("--eager") });
await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
await c.send("Profiler.enable"); await c.send("Profiler.setSamplingInterval", { interval: 500 });
await c.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__lt=[]; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lt.push([Math.round(e.startTime),Math.round(e.duration)])}).observe({type:'longtask',buffered:true}); window.__marks=[]; ` });
await c.send("Profiler.start");
await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + PATH });
await sleep(SECS * 1000);
const { profile } = await c.send("Profiler.stop");
const lt = await c.ev("window.__lt");
const tbt = lt.reduce((s, [, d]) => s + Math.max(0, d - 50), 0);
console.log(`long tasks (>50 ms): ${lt.length}, sum of the part over 50 ms (about TBT) = ${tbt} ms`);
console.log(lt.map(([s, d]) => `${d}ms@${s}`).join("  "));
const nodes = new Map(profile.nodes.map((n) => [n.id, n])); const self = new Map();
const dt = profile.timeDeltas; for (let i = 0; i < profile.samples.length; i++) self.set(profile.samples[i], (self.get(profile.samples[i]) ?? 0) + dt[i] / 1000);
const agg = new Map();
for (const [id, ms] of self) { const f = nodes.get(id).callFrame; const k = `${f.functionName || "(anon)"} ${f.url.split("/").pop()}:${f.lineNumber}:${f.columnNumber}`; agg.set(k, (agg.get(k) ?? 0) + ms); }
const top = [...agg].sort((a, b) => b[1] - a[1]).slice(0, 22);
console.log("heaviest functions (self ms, measured at 4x slowdown):");
for (const [k, ms] of top) console.log(`  ${ms.toFixed(0).padStart(6)}  ${k}`);
// inside each long task: inclusive time per function (the call stacks that were running), to show what the task was doing
const parent = new Map(); for (const n of profile.nodes) for (const ch of n.children ?? []) parent.set(ch, n.id);
const navStart = await c.ev("performance.timeOrigin"); const t0 = profile.startTime / 1000; // ms, same clock as timeOrigin offsets below
const stamps = []; let t = profile.startTime; for (let i = 0; i < profile.samples.length; i++) { t += dt[i]; stamps.push(t / 1000); }
const origin = stamps.length ? await c.ev("0") : 0;
const big = [...lt].sort((a, b) => b[1] - a[1]).slice(0, Number(arg("tasks", 4)));
for (const [start, dur] of big) {
  // find the sample index whose stack is in the page at that load time: the profile clock and performance.now differ by a constant, estimated from the first long task match
  const incl = new Map();
  for (let i = 0; i < profile.samples.length; i++) {
    const rel = stamps[i] - stamps[0]; // ms since the profile began (profile starts a little before navigation)
    if (rel < start + OFFSET - 5 || rel > start + OFFSET + dur + 5) continue;
    const seen = new Set(); let id = profile.samples[i];
    while (id) { const f = nodes.get(id).callFrame; const k = `${f.functionName || "(anon)"} ${f.url.split("/").pop()}:${f.lineNumber}:${f.columnNumber}`; if (!seen.has(k) && f.url) { seen.add(k); incl.set(k, (incl.get(k) ?? 0) + dt[i] / 1000); } id = parent.get(id); }
  }
  const slf = new Map();
  for (let i = 0; i < profile.samples.length; i++) { const rel = stamps[i] - stamps[0]; if (rel < start + OFFSET - 5 || rel > start + OFFSET + dur + 5) continue; const f = nodes.get(profile.samples[i]).callFrame; const k = `${f.functionName || "(anon)"} ${f.url.split("/").pop()}:${f.lineNumber}:${f.columnNumber}`; slf.set(k, (slf.get(k) ?? 0) + dt[i] / 1000); }
  console.log(`\nlong task ${dur} ms at ${start}: where the time is spent (self ms):`);
  for (const [k, ms] of [...slf].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${ms.toFixed(0).padStart(6)}  ${k}`);
  console.log(`  -- and the functions on the stack (inclusive ms):`);
  for (const [k, ms] of [...incl].sort((a, b) => b[1] - a[1]).slice(0, 9)) console.log(`  ${ms.toFixed(0).padStart(6)}  ${k}`);
}
c.kill(); process.exit(0);
