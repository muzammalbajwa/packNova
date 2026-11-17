#!/usr/bin/env node
// Screenshots of the BOTTOM of pages (related products, quote band, footer), plus layout-shift and horizontal-overflow checks.
// node scripts/page-end-shots.mjs --tag before|after [--widths 1440,390] [--paths /a/,/b/] [--out docs/screenshots/pages-v1/page-end]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const TAG = arg("tag", "after"), OUT = arg("out", "docs/screenshots/pages-v1/page-end");
const WIDTHS = arg("widths", "1440,390").split(",").map(Number);
const PATHS = arg("paths", "/material/rigid-boxes/,/shape-and-style/paper-bags/,/industry/mylar-bags/,/configurator/").split(",");
mkdirSync(OUT, { recursive: true });
for (const w of WIDTHS) {
  const mobile = w < 600;
  const c = await launch(mobile ? { width: w, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: w, height: w >= 1400 ? 900 : 800 });
  for (const p of PATHS) {
    await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + p });
    await sleep(3500);
    await c.ev("window.scrollTo(0, document.documentElement.scrollHeight)");
    await sleep(1200);
    const over = await c.ev("document.documentElement.scrollWidth - document.documentElement.clientWidth");
    // the section is taller than one screen: take the last ~2 screens as two shots (end, and the part above it)
    const name = p.replace(/\//g, "_").replace(/^_|_$/g, "");
    const { data } = await c.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${OUT}/${TAG}-${name}-${w}.png`, Buffer.from(data, "base64"));
    await c.ev("window.scrollBy(0, -innerHeight * 0.85)"); await sleep(700);
    const up = await c.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${OUT}/${TAG}-${name}-${w}-above.png`, Buffer.from(up.data, "base64"));
    console.log(`${String(w).padStart(5)} ${p.padEnd(34)} horizontal overflow ${over}px`);
  }
  c.kill();
}
process.exit(0);
