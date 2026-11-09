// WCAG AA check for every theme. Run: node scripts/contrast.mjs  (Node 22+, imports the TS palette directly)
import { THEMES, contrast } from "../src/lib/palette.ts";

const pairs = [
  ["text on bg", "fg", "bg", 4.5],
  ["text on surface", "fg", "surface", 4.5],
  ["muted on bg", "muted", "bg", 4.5],
  ["muted on surface", "muted", "surface", 4.5],
  ["kraft-ink text on bg", "kraftInk", "bg", 4.5],
  ["kraft-ink text on surface", "kraftInk", "surface", 4.5],
  ["accent text on bg", "accent", "bg", 4.5],
  ["accent text on surface", "accent", "surface", 4.5],
  ["button label on accent", "onAccent", "accent", 4.5],
  ["button label on hover (fg)", "onAccent", "fg", 4.5],
  ["accent vs bg (UI/graphics)", "accent", "bg", 3],
];
let fail = 0;
for (const t of Object.values(THEMES)) {
  console.log(`\n${t.id.toUpperCase()}  ${t.name}`);
  for (const [label, a, b, min] of pairs) {
    const r = contrast(t[a], t[b]);
    const ok = r >= min;
    if (!ok) fail++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}  (min ${min})  ${label}`);
  }
}
console.log(fail ? `\n${fail} failing pair(s)` : "\nAll pairs pass WCAG AA");
process.exit(fail ? 1 : 0);
