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
// the six homepage categories must each open their own page (no two share one, none opens an unrelated page)
const home = readFileSync(join(OUT, "index.html"), "utf8");
const sec = home.slice(home.indexOf('id="products"'), home.indexOf("</section>", home.indexOf('id="products"')));
const cats = [...sec.matchAll(/<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<span class="font-display[^>]*>([^<]+)</g)].map((m) => [m[2], m[1]]);
const want = {
  "Corrugated Shipping Boxes": "/material/corrugated-boxes/",
  "Folding Cartons": "/shape-and-style/folding-cartons/",
  "Rigid Gift Boxes": "/material/rigid-boxes/",
  "Flexible Pouches": "/industry/mylar-bags/",
  "Poly & Courier Bags": "/shape-and-style/poly-and-courier-bags/",
  "Eco & Paper Packaging": "/shape-and-style/paper-bags/",
};
for (const [name, href] of Object.entries(want)) {
  const got = cats.find((c) => c[0].replaceAll("&amp;", "&") === name)?.[1];
  if (got !== href) bad.push(`home category "${name}" opens ${got ?? "nothing"}, expected ${href}`);
}
if (new Set(cats.map((c) => c[1])).size !== cats.length) bad.push("two homepage categories open the same page");
console.log(`${html.length} pages, ${links} internal links, ${bad.length} broken`);
for (const b of [...new Set(bad)].slice(0, 40)) console.log("  " + b);
process.exit(bad.length ? 1 : 0);
