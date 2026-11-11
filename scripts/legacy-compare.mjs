#!/usr/bin/env node
// Regression check: the first 7 stages ("Made") must look exactly as they did before the shipping journey was added.
// Captures the story canvas at the same legacy progress points in two builds and diffs the pixels.
// Usage: node scripts/legacy-compare.mjs --before http://127.0.0.1:8081 --after http://127.0.0.1:8080 --out <dir>
//        [--template eco] [--split 0.58] [--mobile]
// "before" maps progress p straight to the scroll position, "after" maps it to p * split (the Made part of the longer film).
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BEFORE = arg("before", "http://127.0.0.1:8081");
const AFTER = arg("after", "http://127.0.0.1:8080");
const OUT = arg("out", "docs/compare");
const TEMPLATE = arg("template", "eco");
const SPLIT = Number(arg("split", 0.58));
const MOBILE = process.argv.includes("--mobile");
// avoid the glue stage (0.8 to 0.9): its strip pulses with the clock, and p >= 0.98 where the idle spin is time based
const POINTS = [0.03, 0.08, 0.19, 0.27, 0.325, 0.395, 0.465, 0.525, 0.63, 0.69, 0.79, 0.94, 0.97];

mkdirSync(OUT, { recursive: true });

async function capture(base, mapP, tag) {
  const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.navigate", { url: `${base}/t/${TEMPLATE}/?preview=0&tier=mid` });
  await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')", 90000);
  await sleep(1500);
  await c.waitFor("document.getElementById('making') && document.getElementById('making').offsetHeight > window.innerHeight * 3", 60000);
  await sleep(800);
  // pin the section on screen once, then inject the exact progress (a scroll step is ~1e-4 of progress, which is
  // visible on edges while the carton spins) through the test hook
  await c.ev(`(()=>{const el=document.getElementById('making'); window.scrollTo(0, el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*0.3);})()`);
  await sleep(1200);
  await c.waitFor("window.__makingSet", 30000);
  // compare the 3D only: hide the template's overlay (captions, step indicator), which changed on purpose
  await c.ev(`(()=>{const f=document.querySelector('#making > div'); for (const el of f.children) if (!el.querySelector('canvas')) el.style.visibility='hidden'; return 1;})()`);
  for (const p of POINTS) {
    await c.ev(`window.__makingSet(${mapP(p)})`);
    await sleep(1600);
    // CDP clips in page coordinates, getBoundingClientRect is viewport-relative: add the scroll offset
    const r = JSON.parse(await c.ev(`(()=>{const r=document.querySelector('#making canvas').getBoundingClientRect(); return JSON.stringify({x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height})})()`));
    const shot = await c.send("Page.captureScreenshot", { format: "png", clip: { ...r, scale: 1 } });
    writeFileSync(`${OUT}/${tag}-${String(p).replace(".", "_")}.png`, Buffer.from(shot.data, "base64"));
  }
  c.kill();
  await sleep(300);
}

await capture(BEFORE, (p) => p, "before");
await capture(AFTER, (p) => p * SPLIT, "after");

const py = `
import sys, glob, os
from PIL import Image, ImageChops
out = sys.argv[1]
pts = sys.argv[2].split(",")
print(f"{'p':>6} {'mean diff':>10} {'max diff':>9} {'% px > 8':>9}")
worst = 0
for p in pts:
    k = p.replace(".", "_")
    a = Image.open(f"{out}/before-{k}.png").convert("RGB"); b = Image.open(f"{out}/after-{k}.png").convert("RGB")
    if a.size != b.size: print(p, "SIZE MISMATCH", a.size, b.size); continue
    d = ImageChops.difference(a, b).convert("L")
    px = list(d.getdata()); n = len(px)
    mean = sum(px) / n; mx = max(px); frac = 100 * sum(1 for v in px if v > 8) / n
    worst = max(worst, frac)
    print(f"{p:>6} {mean:10.3f} {mx:9d} {frac:9.3f}")
print("WORST % px > 8:", round(worst, 3))
`;
const res = spawnSync("python3", ["-c", py, OUT, POINTS.join(",")], { encoding: "utf-8" });
console.log(res.stdout + res.stderr);
process.exit(0);
