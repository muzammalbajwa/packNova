#!/usr/bin/env node
// What is in the initial JS of a route: every <script src> of its exported HTML, gzip size, and which libraries it contains.
// node scripts/bundle-breakdown.mjs /quote/ /contact/ ...   (run after npm run build)
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const MARK = {
  "react-dom": /react-dom|scheduler|reconciler/i, "next runtime": /__next_|next\/dist|AppRouter|useRouter/, gsap: /gsap\.|ScrollTrigger|GreenSock/, lenis: /lenis|Lenis/, zustand: /zustand/i,
  three: /WebGLRenderer|BufferGeometry|MeshStandardMaterial/, r3f: /__r3f|reconciler.*three|createRoot.*canvas/i, drei: /@react-three\/drei|useGLTF|Environment/, "film engine": /forceContextLoss|film-recipe/,
  "forms (quote)": /packnova\.quote|submitQuote|validateStep/, configurator: /Design your box|createPreview/, "site copy": /Custom boxes, cartons and pouches/,
};
const kb = (b) => gzipSync(b).length / 1024;
for (const r of process.argv.slice(2)) {
  const html = readFileSync(`out${r}index.html`, "utf8");
  const files = [...new Set([...html.matchAll(/<script([^>]*)\ssrc="([^"]+)"([^>]*)>/g)].filter((m) => !/noModule/i.test(m[1] + m[3])).map((m) => m[2].split("?")[0]))]; // noModule polyfills are not downloaded by modern browsers
  let tot = 0;
  console.log(`\n${r}`);
  for (const f of files) {
    const b = readFileSync("out" + f);
    const t = b.toString();
    const tags = Object.entries(MARK).filter(([, re]) => re.test(t)).map(([k]) => k);
    tot += kb(b);
    console.log(`  ${kb(b).toFixed(1).padStart(6)} kB  ${f.split("/").pop().padEnd(22)} raw ${(b.length / 1024).toFixed(0).padStart(4)} kB  ${tags.join(", ")}`);
  }
  console.log(`  ${tot.toFixed(1).padStart(6)} kB  total initial JS (gzip)`);
}
