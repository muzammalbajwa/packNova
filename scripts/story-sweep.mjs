#!/usr/bin/env node
// Test A (fast sweep, empty-frame detector) and Test C (visibility invariant) for the making-of canvas.
// Usage: node scripts/story-sweep.mjs --template cinematic [--base http://127.0.0.1:8080] [--cpu 1|4] [--mobile] [--force]
// A frame is "empty" when, while the story is pinned, the last drawn canvas frame has no non-transparent pixels
// (or nothing has been drawn yet). Pass = zero empty frames and first non-empty frame < 1000 ms after the scroll.
import { loadavg } from "node:os";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TEMPLATE = arg("template", "cinematic");
const CPU = Number(arg("cpu", 1));
const MOBILE = process.argv.includes("--mobile");
const ONLY_C = process.argv.includes("--only-c"); // invariant test only (load independent: no timing involved)
const N_C = Number(arg("n", 300)); // progress values for the invariant test
const load0 = +loadavg()[0].toFixed(2);
if (!ONLY_C && load0 > 4 && !process.argv.includes("--force")) { console.error(`Load average ${load0} (> 4). Retry on a quiet machine or pass --force.`); process.exit(2); }

const HOOK = `(()=>{
  window.__n = null; window.__renders = 0;
  const probe = document.createElement('canvas'); probe.width = 48; probe.height = 30;
  const pg = probe.getContext('2d', { willReadFrequently: true });
  let gl_;
  Object.defineProperty(window, '__glMaking', { configurable: true, get() { return gl_; }, set(gl) {
    gl_ = gl; const r = gl.render.bind(gl);
    gl.render = (s, c) => { r(s, c); window.__renders++;
      pg.clearRect(0, 0, 48, 30); pg.drawImage(gl.domElement, 0, 0, 48, 30);
      const d = pg.getImageData(0, 0, 48, 30).data; let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 12) n++;
      window.__n = n; window.__nAt = performance.now(); };
  } });
})();`;

const SWEEP = `(async (speed, from, to) => {
  const el = document.getElementById('making');
  const top = el.getBoundingClientRect().top + scrollY, len = el.offsetHeight - innerHeight;
  const y0 = top + len * from, y1 = top + len * to;
  const empty = []; let frames = 0, pinned = 0, run = 0, longest = 0, firstOk = null;
  const t0 = performance.now(); let last = t0;
  await new Promise((res) => (function f(now) {
    const dt = (now - t0) / 1000;
    const y = Math.min(y1, y0 + speed * dt);
    window.scrollTo(0, y);
    const inPin = y >= top && y <= top + len;
    frames++;
    if (inPin) { pinned++;
      const bad = window.__n == null || window.__n <= 20;
      if (!bad && firstOk == null) firstOk = now - t0;
      if (bad) { empty.push(Math.round(y)); run += now - last; longest = Math.max(longest, run); } else run = 0;
    }
    last = now;
    if (y < y1) requestAnimationFrame(f); else res();
  })(t0));
  return JSON.stringify({ renders: window.__renders, n: window.__n, frames, pinned, empty: empty.length, longest: Math.round(longest), firstOk: firstOk == null ? null : Math.round(firstOk), at: empty.slice(0, 5) });
})`;

async function fresh() {
  const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.addScriptToEvaluateOnNewDocument", { source: HOOK });
  await c.send("Page.navigate", { url: `${BASE}/t/${TEMPLATE}/?${MOBILE ? "" : "tier=mid"}` });
  console.error("navigated");
  const dbg = setInterval(async () => console.error("state", await c.ev("JSON.stringify([document.readyState, !!document.querySelector('[role=status]'), !!document.getElementById('making')])").catch((e) => String(e))), 4000);
  c.dbg = dbg;
  await c.waitFor("document.readyState==='complete' && !document.querySelector('[role=status]') && !!document.getElementById('making')", 90000);
  clearInterval(dbg);
  await sleep(600);
  if (CPU > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  return c;
}

console.log(`\nTest A  ${TEMPLATE} ${MOBILE ? "mobile" : "desktop"}  CPU ${CPU}x  load ${load0}`);
const rowsA = [];
if (!ONLY_C) {
// top of the page -> end of the story (through the hero), fresh load per speed. Speeds in px/s.
for (const [name, speed] of [["slow", 700], ["normal", 3500], ["very fast", 20000]]) {
  const c = await fresh();
  console.error('loaded', name);
  const start = await c.ev(`(()=>{const el=document.getElementById('making'); return (-innerHeight*0.5)/(el.offsetHeight-innerHeight)})()`);
  console.error('start', start);
  const r = JSON.parse(await c.ev(`${SWEEP}(${speed}, ${start}, 1)`));
  rowsA.push({ run: `sweep ${name}`, renders: r.renders, lastN: r.n, pinnedFrames: r.pinned, emptyFrames: r.empty, longestEmptyMs: r.longest, firstNonEmptyMs: r.firstOk, emptyAtScrollY: r.at.join(",") || "-" });
  c.kill(); await sleep(300);
}
// warm jumps in one load: hold each jump for 400 ms of frames
{
  const c = await fresh();
  for (const p of [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9, 1]) {
    const r = JSON.parse(await c.ev(`(async()=>{ const el=document.getElementById('making'); const top=el.getBoundingClientRect().top+scrollY, len=el.offsetHeight-innerHeight;
      window.__n=null; const t0=performance.now(); window.scrollTo(0, top+len*${p}); let bad=0, first=null, frames=0;
      await new Promise(res=>(function f(now){ frames++; const e=window.__n==null||window.__n<=20; if(e) bad++; else if(first==null) first=now-t0; if(now-t0<400) requestAnimationFrame(f); else res(); })(t0));
      return JSON.stringify({bad, first: first==null?null:Math.round(first), frames}); })()`));
    rowsA.push({ run: `jump ${p}`, pinnedFrames: r.frames, emptyFrames: r.bad, longestEmptyMs: "-", firstNonEmptyMs: r.first, emptyAtScrollY: "-" });
  }
  c.kill(); await sleep(300);
}
console.table(rowsA);
const passA = rowsA.every((r) => r.firstNonEmptyMs != null && r.firstNonEmptyMs < 1000) && rowsA.filter((r) => r.run.startsWith("sweep")).every((r) => r.emptyFrames === 0);
console.log(`Test A: ${passA ? "PASS" : "FAIL"} (sweeps: zero empty pinned frames; every run: first non-empty < 1000 ms; warm jumps list empty frames inside the 400 ms window, incl. the first frame after the scroll)`);
}

// Test C: 300 progress values, is at least one opaque stage mesh inside the frustum?
{
  const c = await fresh();
  await c.waitFor("window.__makingSet && window.__makingVisible", 30000);
  const bad = JSON.parse(await c.ev(`(async()=>{ const bad=[]; for(let i=0;i<${N_C};i++){ const p=i/${N_C - 1}; window.__makingSet(p);
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); if(!window.__makingVisible()) bad.push(+p.toFixed(3)); } return JSON.stringify(bad); })()`));
  console.log(`\nTest C: ${bad.length === 0 ? "PASS" : "FAIL"}  ${N_C} progress values, failing: ${bad.length ? bad.join(",") : "none"}`);
  c.kill();
}
process.exit(0);
