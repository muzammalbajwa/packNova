#!/usr/bin/env node
// Full-size crops of the 3D stage of a film page at given progress points (for close judging of light and material).
// node scripts/stage-crop.mjs --path /material/corrugated-boxes/ --points 0.35,0.55,0.9 --out /tmp/crops [--mode desktop|mobile]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const PATH = arg("path", "/material/corrugated-boxes/"), POINTS = arg("points", "0.55").split(",").map(Number), OUT = arg("out", "/tmp/crops"), MOBILE = arg("mode", "desktop") === "mobile";
mkdirSync(OUT, { recursive: true });
const c = await launch(MOBILE ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 2 });
await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + PATH }); await sleep(2500);
await c.waitFor("window.__film && document.querySelector('#how canvas')", 60000); await sleep(1500);
for (const p of POINTS) {
  const y = await c.ev(`(()=>{const el=document.getElementById('how');const top=el.getBoundingClientRect().top+scrollY;return top+(el.offsetHeight-innerHeight)*${p};})()`);
  await c.ev(`window.scrollTo(0, ${y})`); await sleep(1100);
  const r = JSON.parse(await c.ev("JSON.stringify((()=>{const b=document.querySelector('#how canvas').getBoundingClientRect(); return {x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height}})())"));
  const s = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 88, clip: { ...r, scale: 1 } });
  writeFileSync(`${OUT}/${PATH.replace(/\//g, "_").replace(/^_|_$/g, "")}-${Math.round(p * 100)}.jpg`, Buffer.from(s.data, "base64"));
}
c.kill(); process.exit(0);
