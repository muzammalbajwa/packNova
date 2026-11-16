#!/usr/bin/env node
// Sizes of the lazy chunks a film page downloads (three.js, the film engine, the recipe), by loading the page in Chrome.
// node scripts/film-chunks.mjs [/shape-and-style/tuck-boxes/]   (the site must be served on :8080)
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { launch, sleep } from "./lib/cdp.mjs";
const path = process.argv[2] ?? "/shape-and-style/tuck-boxes/";
const c = await launch({ width: 1440, height: 900 });
await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + path });
await c.waitFor("window.__film && document.querySelector('#how canvas')", 60000);
await sleep(1000);
const names = JSON.parse(await c.ev("JSON.stringify(performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.js')).map(r=>new URL(r.name).pathname))"));
const html = readFileSync(`out${path}index.html`, "utf8");
const initial = new Set([...html.matchAll(/<script([^>]*)\ssrc="([^"]+)"([^>]*)>/g)].filter((m) => !/noModule/i.test(m[1] + m[3])).map((m) => m[2].split("?")[0]));
let lazy = 0;
for (const n of names) {
  if (initial.has(n)) continue;
  const b = readFileSync("out" + n);
  const kb = gzipSync(b).length / 1024;
  lazy += kb;
  if (kb > 5) console.log(`  ${kb.toFixed(1).padStart(6)} kB gzip  ${(b.length / 1024).toFixed(0).padStart(4)} kB raw  ${n.split("/").pop()}`);
}
console.log(`  ${lazy.toFixed(1).padStart(6)} kB gzip  lazy JS a film page downloads in total (three.js + engine + recipe + gsap)`);
c.kill();
process.exit(0);
