#!/usr/bin/env node
// Scrolls fast through the story at 4 frames/s (screenshots) for each speed and writes docs/screenshots/loading/<template>-<speed>-NN.jpg
// Usage: node scripts/loading-shots.mjs --template cinematic [--base http://127.0.0.1:8080] [--mobile]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080"), T = arg("template", "cinematic"), MOBILE = process.argv.includes("--mobile");
const out = "docs/screenshots/loading"; mkdirSync(out, { recursive: true });
for (const [name, speed] of [["slow", 700], ["normal", 3500], ["fast", 12000]]) {
  const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 1, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.navigate", { url: `${BASE}/t/${T}/?${MOBILE ? "" : "tier=mid"}` });
  await c.waitFor("document.readyState==='complete' && !document.querySelector('[role=status]') && !!document.getElementById('making')", 90000);
  await sleep(800);
  await c.ev(`(()=>{const el=document.getElementById('making'); const top=el.getBoundingClientRect().top+scrollY, len=el.offsetHeight-innerHeight; const y0=top-innerHeight*0.5; const t0=performance.now();
    window.__d=0; (function f(now){ const y=Math.min(top+len, y0+${speed}*(now-t0)/1000); scrollTo(0,y); if(y<top+len) requestAnimationFrame(f); else window.__d=1; })(t0);})()`);
  let i = 0;
  const step = speed >= 3500 ? 125 : 250; // fast runs are sampled more often so the short run still gives frames
  while (!(await c.ev("window.__d")) && i < 60) {
    const r = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 60 });
    writeFileSync(`${out}/${T}${MOBILE ? "-m" : ""}-${name}-${String(i++).padStart(2, "0")}.jpg`, Buffer.from(r.data, "base64"));
    await sleep(step);
  }
  c.kill(); await sleep(300);
  console.log(name, i, "frames");
}
// jumps: scroll straight to a stage anchor on a fresh page and screenshot the very first frame after it
{
  const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 1, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.navigate", { url: `${BASE}/t/${T}/?${MOBILE ? "" : "tier=mid"}` });
  await c.waitFor("document.readyState==='complete' && !document.querySelector('[role=status]') && !!document.getElementById('making')", 90000);
  await sleep(800);
  for (const p of [0.0, 0.09, 0.26, 0.385, 0.535, 0.79, 0.915, 0.985]) {
    await c.ev(`(()=>{const el=document.getElementById('making'); scrollTo(0, el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*${p});})()`);
    await sleep(60);
    const r = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 60 });
    writeFileSync(`${out}/${T}${MOBILE ? "-m" : ""}-jump-${String(p).replace(".", "_")}.jpg`, Buffer.from(r.data, "base64"));
  }
  c.kill();
}
process.exit(0);
