#!/usr/bin/env node
// Lists the files in src/ that no page, layout or route reaches by imports (static or dynamic): candidates for deletion.
// node scripts/dead-code.mjs [--assets]   (--assets also lists files in public/ that no source file or stylesheet mentions)
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(SRC);
const isEntry = (f) => /src\/app\/.*\/?(page|layout|route|robots|sitemap|not-found|loading|error|global-error|manifest|icon|opengraph-image)\.[tj]sx?$/.test(f);
const EXT = ["", ".ts", ".tsx", ".js", ".jsx", ".css", ".json", "/index.ts", "/index.tsx"];
const resolveImp = (from, spec) => {
  let base = null;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  for (const e of EXT) if (existsSync(base + e) && statSync(base + e).isFile()) return base + e;
  return null;
};
const imports = (f) => {
  const t = readFileSync(f, "utf8");
  const out = [];
  for (const m of t.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1] ?? m[2] ?? m[3] ?? m[4]);
  return out;
};
const seen = new Set();
const queue = files.filter(isEntry);
while (queue.length) {
  const f = queue.pop();
  if (seen.has(f)) continue;
  seen.add(f);
  if (!/\.(tsx?|jsx?)$/.test(f)) continue;
  for (const s of imports(f)) { const r = resolveImp(f, s); if (r && !seen.has(r)) queue.push(r); }
}
const dead = files.filter((f) => !seen.has(f) && !isEntry(f));
console.log(`${files.length} files in src, ${seen.size} reached from the pages, ${dead.length} unreachable:`);
for (const f of dead.sort()) console.log("  " + relative(ROOT, f));
if (process.argv.includes("--assets")) {
  const text = [...seen].map((f) => readFileSync(f, "utf8")).join("\n") + readdirSync(join(ROOT, "scripts")).map((f) => { try { return readFileSync(join(ROOT, "scripts", f), "utf8"); } catch { return ""; } }).join("\n");
  const pub = walk(join(ROOT, "public")).map((f) => relative(join(ROOT, "public"), f));
  console.log("\npublic/ files no reachable source mentions:");
  for (const p of pub) if (!text.includes(p) && !text.includes(p.replace(/\.[a-z0-9]+$/, ""))) console.log("  public/" + p);
}
