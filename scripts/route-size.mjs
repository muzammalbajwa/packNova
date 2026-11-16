#!/usr/bin/env node
// Initial JS (gzip) of a route = the <script src> files in its exported HTML.
// Scripts marked noModule (core-js polyfills for old browsers) are listed separately: modern browsers never download them.
// node scripts/route-size.mjs /industry/jewelry-boxes/ /
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
for (const r of process.argv.slice(2)) {
  const html = readFileSync(`out${r}index.html`, "utf8");
  const tags = [...html.matchAll(/<script([^>]*)\ssrc="([^"]+)"([^>]*)>/g)];
  const seen = new Set();
  let modern = 0, legacy = 0, n = 0;
  for (const [, a, src, b] of tags) {
    const f = src.split("?")[0];
    if (seen.has(f)) continue;
    seen.add(f);
    const kb = gzipSync(readFileSync(`out${f}`)).length / 1024;
    if (/noModule/i.test(a + b)) legacy += kb;
    else { modern += kb; n++; }
  }
  console.log(`${r}  ${n} scripts  ${modern.toFixed(1)} kB gzip  (+ ${legacy.toFixed(1)} kB nomodule polyfills that modern browsers skip)`);
}
