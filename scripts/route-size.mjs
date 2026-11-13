#!/usr/bin/env node
// Initial JS (gzip) of a route = the <script src> files in its exported HTML. node scripts/route-size.mjs /industry/jewelry-boxes/ /
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
for (const r of process.argv.slice(2)) {
  const html = readFileSync(`out${r}index.html`, "utf8");
  const files = [...new Set([...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]))];
  const kb = files.reduce((n, f) => n + gzipSync(readFileSync(`out${f.split("?")[0]}`)).length, 0) / 1024;
  console.log(`${r}  ${files.length} scripts  ${kb.toFixed(1)} kB gzip`);
}
