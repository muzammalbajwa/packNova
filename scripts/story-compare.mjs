#!/usr/bin/env node
// Pixel compare of the story canvas between two builds (before on :8081, after on :8080) at the same progress values,
// the glue stage is avoided (its strip pulses with the clock). Mobile or desktop.
// node scripts/story-compare.mjs [--mobile] [--before http://127.0.0.1:8081] [--after http://127.0.0.1:8080]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BEFORE = arg("before", "http://127.0.0.1:8081"), AFTER = arg("after", "http://127.0.0.1:8080");
const MOBILE = process.argv.includes("--mobile");
const OUT = arg("out", "/tmp/story-compare"); mkdirSync(OUT, { recursive: true });
// total progress: the Made chapter (0.58 of it) at the legacy points that do not animate with the clock, then the shipped stages
const POINTS = [0.03, 0.08, 0.19, 0.27, 0.325, 0.395, 0.465, 0.525, 0.63, 0.69, 0.79, 0.94, 0.97].map((v) => +(v * 0.58).toFixed(4)).concat([0.62, 0.7, 0.8, 0.9, 0.97]);
async function capture(base, tag) {
  const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.navigate", { url: `${base}/?tier=mid` });
  await c.waitFor("window.__glMaking && window.__makingSet", 90000);
  await sleep(4000);
  await c.ev(`(()=>{const el=document.getElementById('making'); window.scrollTo(0, el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*0.3);})()`);
  await sleep(1500);
  await c.ev(`(()=>{const f=document.querySelector('#making > div'); for (const el of f.children) if (!el.querySelector('canvas')) el.style.visibility='hidden'; return 1;})()`);
  const shots = [];
  for (const p of POINTS) {
    await c.ev(`window.__makingSet(${p})`); await sleep(1500);
    const r = JSON.parse(await c.ev(`(()=>{const r=document.querySelector('#making canvas').getBoundingClientRect(); return JSON.stringify({x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height})})()`));
    const s = await c.send("Page.captureScreenshot", { format: "png", clip: { ...r, scale: 1 } });
    writeFileSync(`${OUT}/${tag}-${p}.png`, Buffer.from(s.data, "base64")); shots.push(p);
  }
  c.kill(); await sleep(300);
}
await capture(BEFORE, "before"); await capture(AFTER, "after");
console.log("saved", OUT);
