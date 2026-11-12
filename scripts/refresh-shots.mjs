#!/usr/bin/env node
// Page walk screenshots of one template (everything except the pinned story, which scripts/journey-shots.mjs covers):
// the page is scrolled from top to bottom in viewport-sized steps, skipping the pinned story section.
// node scripts/refresh-shots.mjs --base http://127.0.0.1:8080 --template eco --out docs/screenshots/refresh/after [--modes desktop,mobile] [--settle 900]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TEMPLATE = arg("template", "eco");
const OUT = arg("out", "docs/screenshots/refresh/after");
const MODES = arg("modes", "desktop,mobile").split(",");
const SETTLE = Number(arg("settle", 900));

for (const mode of MODES) {
  const c = await launch(mode === "mobile" ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.navigate", { url: `${BASE}/t/${TEMPLATE}/?preview=0${mode === "mobile" ? "" : "&tier=mid"}` });
  await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')", 120000);
  await sleep(1500);
  const dir = `${OUT}/page`;
  mkdirSync(dir, { recursive: true });
  const m = await c.ev(`(()=>{const s=document.getElementById('making');const top=s?s.getBoundingClientRect().top+scrollY:1e9;return {vh:innerHeight,H:document.documentElement.scrollHeight,storyTop:top,storyBottom:s?top+s.offsetHeight:1e9};})()`);
  const ys = [];
  for (let y = 0; y < m.storyTop - 40; y += Math.round(m.vh * 0.9)) ys.push(y);
  for (let y = m.storyBottom - 1; y < m.H - m.vh + 40 && m.storyBottom < 1e9; y += Math.round(m.vh * 0.9)) ys.push(y);
  ys.push(m.H - m.vh);
  let n = 0;
  for (const y of [...new Set(ys)]) {
    await c.ev(`window.scrollTo(0, ${y})`);
    await sleep(SETTLE);
    const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
    writeFileSync(`${dir}/${mode}-${String(++n).padStart(2, "0")}.jpg`, Buffer.from(data, "base64"));
  }
  console.log("done", mode, n, "shots");
  c.kill();
  await sleep(400);
}
process.exit(0);
