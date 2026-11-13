#!/usr/bin/env node
// Checks every internal link (a[href]) in the static export: node scripts/link-check.mjs [outDir]
// A link is fine when its path exists in `out` as a file or as a folder with index.html. Hash-only links need the id on the same page.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] ?? "out";
const html = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (f !== "_next") walk(p); } else if (f.endsWith(".html")) html.push(p);
  }
})(OUT);

const exists = (path) => {
  const p = join(OUT, decodeURIComponent(path));
  return existsSync(p) && (statSync(p).isFile() || existsSync(join(p, "index.html")));
};
let links = 0;
const bad = [];
for (const file of html) {
  const src = readFileSync(file, "utf8");
  const page = "/" + file.slice(OUT.length + 1).replace(/index\.html$/, "");
  const ids = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of src.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
    const href = m[1].replaceAll("&amp;", "&");
    if (/^(https?:|mailto:|tel:|javascript:)/.test(href)) continue;
    links++;
    const [pathPart, hash] = href.split("#");
    const path = (pathPart.split("?")[0]) || page;
    if (pathPart && !exists(path)) { bad.push(`${page} -> ${href} (missing page)`); continue; }
    if (hash && !pathPart && !ids.has(hash)) bad.push(`${page} -> ${href} (missing id)`);
  }
}
console.log(`${html.length} pages, ${links} internal links, ${bad.length} broken`);
for (const b of [...new Set(bad)].slice(0, 40)) console.log("  " + b);
process.exit(bad.length ? 1 : 0);
