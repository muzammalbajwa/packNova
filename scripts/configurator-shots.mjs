#!/usr/bin/env node
// Screenshots of the configurator: one per product type (folded), plus flat and half-folded for one, and console errors.
// node scripts/configurator-shots.mjs [--types tuck,rigid,...] [--mode desktop|mobile] [--out dir] [--full 1]
import { mkdirSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TYPES = arg("types", "mailer,shipping,tuck,pillow,gable,rigid,bag,pouch").split(",");
const MODE = arg("mode", "desktop");
const OUT = arg("out", "docs/screenshots/pages-v1/phase4");
mkdirSync(OUT, { recursive: true });
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
const errors = [];
c.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails.exception?.description?.slice(0, 300) ?? "exception"));
c.on("Runtime.consoleAPICalled", (e) => { if (e.type === "error") errors.push(e.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300)); });
await c.send("Page.navigate", { url: BASE + "/configurator/" });
await c.waitFor("window.__film && document.querySelector('[aria-label^=\"3D preview\"]') && getComputedStyle(document.querySelector('[aria-label^=\"3D preview\"]')).opacity === '1'", 60000);
const shot = async (name, clip = true) => {
  const el = await c.ev(`(()=>{const r=document.querySelector('section[aria-label=\"Preview\"]').getBoundingClientRect();return {x:r.x,y:r.y+scrollY,w:r.width,h:r.height}})()`);
  const full = arg("full", "0") === "1";
  const { data } = await c.send("Page.captureScreenshot", full ? { format: "png", captureBeyondViewport: true } : { format: "png", clip: { x: 0, y: Math.max(0, el.y - 90), width: MODE === "mobile" ? 390 : 1440, height: MODE === "mobile" ? 720 : 760, scale: 1 } });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(data, "base64"));
  console.log(`${OUT}/${name}.png`);
};
const pick = async (type) => {
  await c.ev(`document.querySelector('input[name=type][value=${type}]').click()`);
  await sleep(900);
  await c.waitFor("window.__film && document.querySelector('[aria-label^=\"3D preview\"]')", 20000);
  await sleep(800);
};
const scrollToPreview = () => c.ev(`document.querySelector('section[aria-label="Preview"]').scrollIntoView({block:'center'})`);
for (const t of TYPES) {
  await pick(t);
  if (MODE === "desktop") await c.ev("window.scrollTo(0, 0)"); else await scrollToPreview();
  await sleep(300);
  await shot(`${MODE}-${t}`);
}
if (arg("states", "1") === "1") {
  const t = TYPES.includes("tuck") ? "tuck" : TYPES[0];
  await pick(t);
  for (const [name, v] of [["flat", 0], ["half", 0.55]]) {
    await c.ev(`(()=>{const el=document.getElementById('fold'); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(el,'${v}'); el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await sleep(700);
    if (MODE === "desktop") await c.ev("window.scrollTo(0, 0)"); else await scrollToPreview();
    await shot(`${MODE}-${t}-${name}`);
  }
}
console.log(errors.length ? "CONSOLE ERRORS:\n" + errors.join("\n") : "no console errors");
c.kill();
process.exit(errors.length ? 1 : 0);
