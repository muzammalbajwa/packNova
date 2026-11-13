#!/usr/bin/env node
// Screenshots of the Load stage (stage 10) at fixed points through the stage, by injecting the exact progress.
// node scripts/load-shots.mjs --base http://127.0.0.1:8080 --templates eco,cinematic --modes desktop,mobile --out docs/screenshots/plane-v2
// u = fraction of the Load stage: conveyor, platform rising, platform at the door, carton entering, inside, door closing, lift leaving.
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const TEMPLATES = arg("templates", "editorial,cinematic,industrial,eco").split(",");
const MODES = arg("modes", "desktop,mobile").split(",");
const OUT = arg("out", "docs/screenshots/plane-v2");
const POINTS = arg("points", "0.06,0.25,0.45,0.58,0.7,0.8,0.9,0.99").split(",").map(Number);
const FROM = Number(arg("from", 0.77)), TO = Number(arg("to", 0.835));

for (const template of TEMPLATES) {
  for (const mode of MODES) {
    const c = await launch(mode === "mobile" ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
    await c.send("Page.navigate", { url: `${BASE}/t/${template}/?preview=0${mode === "mobile" ? "" : "&tier=mid"}` });
    await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && window.__makingSet", 120000);
    await sleep(1500);
    await c.waitFor("document.getElementById('making') && document.getElementById('making').offsetHeight > window.innerHeight * 3", 60000);
    // pin the story on screen once, then inject the exact progress
    await c.ev(`(()=>{const el=document.getElementById('making');window.scrollTo(0, el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*0.5);})()`);
    await sleep(1500);
    const dir = `${OUT}/${template}/load`;
    mkdirSync(dir, { recursive: true });
    let i = 0;
    for (const u of POINTS) {
      await c.ev(`window.__makingSet(${FROM + u * (TO - FROM)})`);
      await sleep(900);
      const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
      writeFileSync(`${dir}/${mode}-${String(++i).padStart(2, "0")}-u${String(Math.round(u * 100)).padStart(3, "0")}.jpg`, Buffer.from(data, "base64"));
    }
    console.log("done", template, mode);
    c.kill();
    await sleep(300);
  }
}
process.exit(0);
