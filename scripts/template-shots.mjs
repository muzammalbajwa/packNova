#!/usr/bin/env node
// Screenshots of one template: hero, every making-of stage, products and quote, desktop + mobile.
// node scripts/template-shots.mjs --template eco [--base http://127.0.0.1:8080] [--settle 2800] [--modes desktop,mobile]
import { writeFileSync, mkdirSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const TEMPLATE = arg("template", "eco");
const BASE = arg("base", "http://127.0.0.1:8080");
const SETTLE = Number(arg("settle", "2800"));
const MODES = arg("modes", "desktop,mobile").split(",");
const OUT = `docs/screenshots/${TEMPLATE}`;
const STAGES = [["01-board", 0.08], ["02-print-mid", 0.19], ["02-print-done", 0.27], ["03-finish-sheen", 0.325], ["03-finish-foil", 0.395], ["04-diecut-press", 0.465], ["04-diecut-waste", 0.525], ["05-fold-start", 0.63], ["05-fold-mid", 0.69], ["05-fold-end", 0.79], ["06-glue", 0.84], ["06-close", 0.905], ["07-lid-open", 0.96], ["07-cta", 0.995]];
mkdirSync(OUT, { recursive: true });

for (const mode of MODES) {
  const c = await launch(mode === "mobile" ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Page.navigate", { url: `${BASE}/?${mode === "mobile" ? "" : "tier=mid"}` });
  await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')", 90000);
  await sleep(1500);
  await c.waitFor("document.getElementById('making') && document.getElementById('making').offsetHeight > window.innerHeight * 3", 30000);
  await sleep(600);
  const shot = async (name) => {
    const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 80 });
    writeFileSync(`${OUT}/${mode}-${name}.jpg`, Buffer.from(data, "base64"));
    console.log("saved", TEMPLATE, mode, name);
  };
  await c.ev("window.scrollTo(0,0)"); await sleep(SETTLE); await shot("00-hero");
  for (const [name, p] of STAGES) {
    const y = await c.ev(`(()=>{const el=document.getElementById('making');const top=el.getBoundingClientRect().top+scrollY;return top+(el.offsetHeight-innerHeight)*${p};})()`);
    await c.ev(`window.scrollTo(0, ${y})`); await sleep(SETTLE); await shot(name);
  }
  for (const id of ["products", "quote"]) {
    await c.ev(`window.scrollTo(0, document.getElementById('${id}').getBoundingClientRect().top + scrollY)`);
    await sleep(SETTLE + 600); await shot(`90-${id}`);
  }
  c.kill();
}
process.exit(0);
