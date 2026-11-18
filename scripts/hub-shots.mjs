#!/usr/bin/env node
// Full-page screenshots of the hub pages. node scripts/hub-shots.mjs --tag before|after [--paths /industry/,/shape-and-style/] [--widths 1440,390]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const TAG = arg("tag", "after"), OUT = "docs/screenshots/pages-v1/hubs"; mkdirSync(OUT, { recursive: true });
const PATHS = arg("paths", "/industry/,/shape-and-style/").split(","), WIDTHS = arg("widths", "1440,390").split(",").map(Number);
for (const w of WIDTHS) {
  const mobile = w < 600;
  const c = await launch(mobile ? { width: w, height: 844, dpr: 1, mobile: true, cores: 4 } : { width: w, height: 900 });
  for (const p of PATHS) {
    await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + p }); await sleep(3500);
    // scroll through once so scroll-driven reveals have played, then back to the top
    const H = await c.ev("document.documentElement.scrollHeight");
    for (let y = 0; y < H; y += 500) { await c.ev(`window.scrollTo(0,${y})`); await sleep(120); }
    // a full-page capture cannot play scroll-driven entrances (they follow the scroll position), so switch them off for the still
    await c.ev("(()=>{const st=document.createElement('style'); st.textContent='.hub-card{animation:none!important;opacity:1!important;transform:none!important}.hub-line path{animation:none!important}'; document.head.append(st)})()");
    await c.ev("window.scrollTo(0,0)"); await sleep(500);
    const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 78, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(H, 7000), scale: 1 } });
    writeFileSync(`${OUT}/${TAG}-${p.replace(/\//g, "")}-${w}.jpg`, Buffer.from(data, "base64"));
    console.log(w, p, "height", H);
  }
  c.kill();
}
process.exit(0);
