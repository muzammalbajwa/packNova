#!/usr/bin/env node
// The frame times around a rebuild: after a size or colour change settles, how long is the longest frame, and the p99 of a 2 s window.
// node scripts/configurator-hitch.mjs [--mode desktop|mobile] [--cpu 4] [--reps 5] [--out file.json]
import { writeFileSync } from "node:fs";
import os from "node:os";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const MODE = arg("mode", "desktop");
const CPU = Number(arg("cpu", 1));
const REPS = Number(arg("reps", 5));
const load0 = os.loadavg()[0];
console.log(`load average before: ${load0.toFixed(2)}${load0 > 4 ? "  TOO HIGH" : ""}`);
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
await c.send("Page.navigate", { url: (arg("base", "http://127.0.0.1:8080")) + "/configurator/" });
await c.waitFor("window.__film && document.querySelector('[aria-label^=\"3D preview\"]') && getComputedStyle(document.querySelector('[aria-label^=\"3D preview\"]')).opacity === '1'", 60000);
await sleep(800);
if (CPU > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
const rows = [];
for (const t of arg("types", "tuck,rigid,mailer,bag,pouch").split(",")) {
  await c.ev(`document.querySelector('input[name=type][value=${t}]').click()`);
  await sleep(1500);
  const maxes = [], p99s = [];
  for (let i = 0; i < REPS; i++) {
    const r = await c.ev(`(async()=>{
      const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      const sl=document.querySelectorAll('input[type=range]')[${i % 2}]; const f=${0.25} + ${0.12}*(${i}%5);
      const ms=[]; let last=performance.now(); const t0=last;
      set.call(sl, String(+sl.min+(+sl.max-+sl.min)*f)); sl.dispatchEvent(new Event('input',{bubbles:true}));
      await new Promise(res=>{ function fr(now){ ms.push(now-last); last=now; if(now-t0<2000) requestAnimationFrame(fr); else res(); } requestAnimationFrame(fr); });
      const a=ms.slice(1).sort((x,y)=>x-y); return {max:+a[a.length-1].toFixed(1), p99:+a[Math.floor(a.length*0.99)].toFixed(1)};
    })()`);
    maxes.push(r.max); p99s.push(r.p99);
    await sleep(300);
  }
  rows.push({ type: t, maxFrameMs: Math.max(...maxes), medianMaxMs: maxes.sort((a, b) => a - b)[Math.floor(REPS / 2)], p99Ms: Math.max(...p99s), all: maxes });
  console.log(JSON.stringify(rows.at(-1)));
}
console.log(`load average after: ${os.loadavg()[0].toFixed(2)}`);
if (arg("out", "")) writeFileSync(arg("out", ""), JSON.stringify({ mode: MODE, cpu: CPU, rows }, null, 1));
c.kill(); process.exit(0);
