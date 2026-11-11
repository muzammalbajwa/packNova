#!/usr/bin/env node
// Draw calls and triangles of the story canvas at every stage (and at 3 points inside each), load independent.
// node scripts/journey-calls.mjs --base http://127.0.0.1:8080 --template cinematic [--tier low] [--mobile]
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TEMPLATE = arg("template", "cinematic");
const TIER = arg("tier", "mid");
const MOBILE = process.argv.includes("--mobile");
const SPLIT = 0.58;
const IDS = ["board", "print", "finish", "diecut", "fold", "glue", "ship", "count", "pack", "load", "fly", "deliver"];
const FROM = [0, 0.12, 0.28, 0.4, 0.55, 0.8, 0.92].map((v) => v * SPLIT).concat([SPLIT, 0.665, 0.77, 0.835, 0.93]);
const TO = [0.12, 0.28, 0.4, 0.55, 0.8, 0.92, 1].map((v) => v * SPLIT).concat([0.665, 0.77, 0.835, 0.93, 1]);
const c = await launch(MOBILE ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
await c.send("Page.navigate", { url: `${BASE}/t/${TEMPLATE}/?preview=0&tier=${TIER}` });
await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && window.__makingSet", 120000);
await sleep(1500);
await c.ev(`(()=>{const el=document.getElementById('making'); window.scrollTo(0, el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*0.3);})()`);
await sleep(1200);
const rows = [];
let worst = 0;
for (let i = 0; i < 12; i++) {
  let max = 0, tri = 0;
  for (const t of [0.1, 0.5, 0.9]) {
    const p = FROM[i] + (TO[i] - FROM[i]) * t;
    await c.ev(`window.__makingSet(${p})`);
    await sleep(500);
    const r = JSON.parse(await c.ev(`JSON.stringify({calls: __glMaking.info.render.calls, tris: __glMaking.info.render.triangles})`));
    max = Math.max(max, r.calls); tri = Math.max(tri, r.tris);
  }
  worst = Math.max(worst, max);
  rows.push({ stage: `${String(i + 1).padStart(2, "0")} ${IDS[i]}`, drawCalls: max, triangles: tri });
}
console.log(`\n${TEMPLATE} ${MOBILE ? "mobile" : "desktop"} tier=${TIER}`);
console.table(rows);
console.log(`max draw calls ${worst} (budget < 100): ${worst < 100 ? "PASS" : "FAIL"}`);
c.kill(); process.exit(0);
