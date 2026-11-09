#!/usr/bin/env node
// Screenshots of the making-of section at given scroll progress values.
// node scripts/making-shots.mjs --base http://localhost:3000 --template editorial --mode desktop --out docs/screenshots/making [--p 0.1,0.5,0.9] [--tier mid]
import { writeFileSync, mkdirSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://localhost:3000");
const TEMPLATE = arg("template", "editorial");
const MODE = arg("mode", "desktop");
const OUT = arg("out", `docs/screenshots/${TEMPLATE}`);
const TIER = arg("tier", MODE === "mobile" ? "" : "mid");
const SETTLE = Number(arg("settle", "2200"));
const STAGES = [["01-board", 0.08], ["02-print-mid", 0.19], ["02-print-done", 0.27], ["03-finish-sheen", 0.325], ["03-finish-foil", 0.395], ["04-diecut-press", 0.465], ["04-diecut-waste", 0.525], ["05-fold-start", 0.63], ["05-fold-mid", 0.69], ["05-fold-end", 0.79], ["06-glue", 0.84], ["06-close", 0.905], ["07-lid-open", 0.96], ["07-cta", 0.995]];
const custom = arg("p", "");
const list = custom ? custom.split(",").map((v) => [`p${v}`, Number(v)]) : STAGES;

const c = await launch(MODE === "mobile" ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
const q = `preview=0${TIER ? `&tier=${TIER}` : ""}`;
await c.send("Page.navigate", { url: `${BASE}/t/${TEMPLATE}/?${q}` });
await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')");
await sleep(1500);
await c.waitFor("document.getElementById('making') && document.getElementById('making').offsetHeight > window.innerHeight * 3");
await sleep(800);
mkdirSync(OUT, { recursive: true });
for (const [name, p] of list) {
  const y = await c.ev(`(()=>{const el=document.getElementById('making');const top=el.getBoundingClientRect().top+scrollY;return top+(el.offsetHeight-innerHeight)*${p};})()`);
  await c.ev(`window.scrollTo(0, ${y})`);
  await sleep(SETTLE);
  const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 80 });
  const file = `${OUT}/${MODE}-${name}.jpg`;
  writeFileSync(file, Buffer.from(data, "base64"));
  console.log("saved", file);
}
c.kill(); process.exit(0);
