#!/usr/bin/env node
// Screenshots of a product page's film at several progress points, plus a contact sheet.
// node scripts/film-shots.mjs --paths /industry/bakery-and-cake/ [--points 0.05,0.2,...] [--mode desktop|mobile] [--out dir] [--sheet 1]
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const PATHS = arg("paths", "/industry/bakery-and-cake/").split(",");
const POINTS = arg("points", "0.06,0.2,0.3,0.42,0.55,0.68,0.82,0.96").split(",").map(Number);
const MODE = arg("mode", "desktop");
const OUT = arg("out", "docs/screenshots/pages-v1/film");
mkdirSync(OUT, { recursive: true });
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
for (const path of PATHS) {
  await c.send("Page.navigate", { url: BASE + path });
  await c.waitFor("document.getElementById('how') && document.getElementById('how').offsetHeight > innerHeight * 3", 30000);
  await c.waitFor("window.__film && document.querySelector('#how canvas')", 30000);
  await sleep(1500);
  const name = path.replace(/\//g, "_").replace(/^_|_$/g, "");
  const files = [];
  for (const p of POINTS) {
    const y = await c.ev(`(()=>{const el=document.getElementById('how');const top=el.getBoundingClientRect().top+scrollY;return top+(el.offsetHeight-innerHeight)*${p};})()`);
    await c.ev(`window.scrollTo(0, ${y})`);
    await sleep(700);
    const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 78 });
    const f = `${OUT}/${name}-${MODE}-${String(Math.round(p * 100)).padStart(2, "0")}.jpg`;
    writeFileSync(f, Buffer.from(data, "base64"));
    files.push(f);
  }
  if (arg("sheet", "1") === "1") {
    const sheet = `${OUT}/${name}-${MODE}-sheet.png`;
    execFileSync("montage", [...files, "-tile", "4x2", "-geometry", MODE === "mobile" ? "230x498+3+3" : "470x294+3+3", "-background", "#222", sheet]);
    console.log(sheet);
  }
}
c.kill();
process.exit(0);
