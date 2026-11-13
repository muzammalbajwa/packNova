#!/usr/bin/env node
// node scripts/page-shots.mjs --base http://127.0.0.1:8080 --paths /industry/jewelry-boxes/,/industry/ --out docs/screenshots/pages-v1 [--mode desktop|mobile] [--full 1] [--menu 1]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const PATHS = arg("paths", "/").split(",");
const OUT = arg("out", "docs/screenshots/pages-v1");
const MODE = arg("mode", "desktop");
const FULL = arg("full", "0") === "1";
const MENU = arg("menu", "0");
mkdirSync(OUT, { recursive: true });
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
for (const p of PATHS) {
  await c.send("Page.navigate", { url: BASE + p });
  await sleep(2500);
  if (MENU === "1") {
    await c.ev(`(()=>{const b=[...document.querySelectorAll('nav button[aria-haspopup]')][0]||document.querySelector('button[aria-label="Open menu"]');b&&b.click();})()`);
    await sleep(500);
  }
  let clip;
  if (FULL) {
    const h = await c.ev("document.documentElement.scrollHeight");
    clip = { x: 0, y: 0, width: MODE === "mobile" ? 390 : 1440, height: Math.min(h, 6000), scale: 1 };
  }
  const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 80, ...(clip ? { clip, captureBeyondViewport: true } : {}) });
  const name = (p.replace(/\//g, "_").replace(/^_|_$/g, "") || "home") + `-${MODE}${MENU === "1" ? "-menu" : ""}.jpg`;
  writeFileSync(`${OUT}/${name}`, Buffer.from(data, "base64"));
  console.log(name);
}
c.kill();
process.exit(0);
