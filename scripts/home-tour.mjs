#!/usr/bin/env node
// Screenshots of the homepage at fixed fractions of its height, to review the whole page. node scripts/home-tour.mjs [--out dir] [--path /]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const OUT = arg("out", "/tmp/home-tour"), PATH = arg("path", "/"); mkdirSync(OUT, { recursive: true });
for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  const c = await launch(mobile ? { width: w, height: h, dpr: 2, mobile: true, cores: 4 } : { width: w, height: h });
  await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + PATH }); await sleep(6000);
  const H = await c.ev("document.documentElement.scrollHeight");
  const stops = (await c.ev("(()=>{const s=[...document.querySelectorAll('main > section, main > div, section[id], #making')].map(e=>e.id||e.tagName); return s.length})()"), 12);
  const ys = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((f) => Math.round((H - h) * f));
  let i = 0;
  for (const y of ys) {
    await c.ev(`window.scrollTo(0, ${y})`); await sleep(1400);
    const s = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
    writeFileSync(`${OUT}/${w}-${String(i++).padStart(2, "0")}.jpg`, Buffer.from(s.data, "base64"));
  }
  console.log(w, "page height", H, "px");
  c.kill();
}
process.exit(0);
