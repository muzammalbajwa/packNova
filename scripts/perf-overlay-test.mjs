#!/usr/bin/env node
// ?perf=1 overlay: present with the flag (production build), absent and inert without it.
import { launch, sleep } from "./lib/cdp.mjs";
const BASE = process.argv[2] ?? "http://127.0.0.1:8080";
const c = await launch({ width: 1440, height: 900, dpr: 1 });
let ok = true;
const check = (n, v, e = "") => { ok &&= v; console.log(`${v ? "PASS" : "FAIL"}  ${n}${e ? "  (" + e + ")" : ""}`); };
await c.send("Page.navigate", { url: BASE + "/industry/jewelry-boxes/" });
await c.waitFor("window.__film && document.querySelector('#how canvas')", 30000);
await sleep(1000);
check("no overlay without the flag", await c.ev("document.querySelector('pre.fixed') === null && !window.__perfOn"));
await c.send("Page.navigate", { url: BASE + "/industry/jewelry-boxes/?perf=1" });
await c.waitFor("window.__film && document.querySelector('#how canvas')", 30000);
await c.ev(`(()=>{const el=document.getElementById('how');const top=el.getBoundingClientRect().top+scrollY;window.scrollTo(0, top+(el.offsetHeight-innerHeight)*0.3)})()`);
await sleep(1500);
for (let i = 0; i < 12; i++) { await c.ev(`window.scrollBy(0, 40)`); await sleep(40); }
await sleep(900);
const t = await c.ev("document.querySelector('pre.fixed')?.textContent ?? ''");
console.log(t);
check("overlay shows with ?perf=1", t.includes("fps") && t.includes("film") && t.includes("memory"));
check("shows draw calls and triangles of the film renderer", /gl\s+film: calls \d+\s+tris \d+/.test(t));
check("shows geometries, textures and heap", /geometries \d+\s+textures \d+\s+heap/.test(t));
c.kill();
process.exit(ok ? 0 : 1);
