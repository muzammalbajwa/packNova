#!/usr/bin/env node
// Screenshots of all 12 story stages (7 "Made" + 5 "Shipped") per template and viewport.
// node scripts/journey-shots.mjs --base http://127.0.0.1:8080 [--templates editorial,cinematic,industrial,eco] [--modes desktop,mobile]
//        [--stages 1-12] [--out docs/screenshots/journey] [--settle 2200]
// Each stage is captured at its anchor progress (the moment the step indicator scrolls to), by scrolling there.
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TEMPLATES = arg("templates", "eco").split(",");
const MODES = arg("modes", "desktop,mobile").split(",");
const OUT = arg("out", "docs/screenshots/journey");
const SETTLE = Number(arg("settle", 2200));
const [s0, s1] = arg("stages", "1-12").split("-").map(Number);
const SPLIT = 0.58;
// anchors of lib/making.ts (legacy anchors are rescaled by SPLIT)
const STAGES = [
  ["board", 0.09 * SPLIT], ["print", 0.26 * SPLIT], ["finish", 0.385 * SPLIT], ["diecut", 0.535 * SPLIT], ["fold", 0.79 * SPLIT], ["glue", 0.915 * SPLIT], ["ship", 0.985 * SPLIT],
  ["count", 0.655], ["pack", 0.725], ["load", 0.825], ["fly", 0.915], ["deliver", 0.99],
];

for (const template of TEMPLATES) {
  for (const mode of MODES) {
    const c = await launch(mode === "mobile" ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
    await c.send("Page.navigate", { url: `${BASE}/?preview=0${mode === "mobile" ? "" : "&tier=mid"}` });
    await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')", 120000);
    await sleep(1500);
    await c.waitFor("document.getElementById('making') && document.getElementById('making').offsetHeight > window.innerHeight * 3", 60000);
    await sleep(800);
    const dir = `${OUT}/${template}`;
    mkdirSync(dir, { recursive: true });
    for (let i = s0 - 1; i <= s1 - 1; i++) {
      const [id, p] = STAGES[i];
      const y = await c.ev(`(()=>{const el=document.getElementById('making');const top=el.getBoundingClientRect().top+scrollY;return top+(el.offsetHeight-innerHeight)*${p};})()`);
      await c.ev(`window.scrollTo(0, ${y})`);
      await sleep(SETTLE);
      const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
      const file = `${dir}/${mode}-${String(i + 1).padStart(2, "0")}-${id}.jpg`;
      writeFileSync(file, Buffer.from(data, "base64"));
    }
    console.log("done", template, mode);
    c.kill();
    await sleep(400);
  }
}
process.exit(0);
