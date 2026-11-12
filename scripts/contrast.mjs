// WCAG AA check per template (Node 22). Also verifies that each template's tokens.css colors equal its palette
// (src/lib/palette.ts), because the 3D scene reads the palette and the page reads the CSS.
// Run: node scripts/contrast.mjs
import { readFileSync } from "node:fs";
import { THEMES, ECO_PAGE, contrast } from "../src/lib/palette.ts";

const TEMPLATES = { editorial: "a", cinematic: "b", industrial: "d", eco: "c" };
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
const tokenKeys = { "--bg": "bg", "--surface": "surface", "--fg": "fg", "--muted": "muted", "--kraft": "kraft", "--kraft-ink": "kraftInk", "--accent": "accent", "--on-accent": "onAccent" };

let fail = 0;

/** Run every pair against a palette and compare the palette with the matching block of tokens.css. */
function check(label, t, css, extraPairs = []) {
  console.log(`\n${label}`);
  for (const [name, a, b, min] of [...pairs, ...extraPairs]) {
    const r = contrast(t[a], t[b]);
    const ok = r >= min;
    if (!ok) fail++;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}  (min ${min})  ${name}`);
  }
  for (const [v, key] of Object.entries(tokenKeys)) {
    const m = css.match(new RegExp(`${v}:\\s*(#[0-9a-fA-F]{6})`));
    const same = m && m[1].toLowerCase() === t[key].toLowerCase();
    if (!same) { fail++; console.log(`  FAIL  tokens.css ${v} = ${m?.[1]} but palette ${key} = ${t[key]}`); }
  }
  console.log("  tokens.css matches palette");
}

for (const [name, id] of Object.entries(TEMPLATES)) {
  const css = readFileSync(`src/templates/${name}/tokens.css`, "utf8");
  if (name === "eco") {
    // eco has a light page (ECO_PAGE) and a dark pinned story (THEMES.c, the `.tone-dark` block)
    const [page, story] = css.split(".tone-dark");
    check("eco page  (ECO_PAGE: cream, forest, kraft)", ECO_PAGE, page, [
      ["text on sand", "fg", "sand", 4.5],
      ["muted on sand", "muted", "sand", 4.5],
      ["kraft-ink text on sand", "kraftInk", "sand", 4.5],
      ["button label on accent", "onAccent", "accent", 4.5],
      ["accent text on sand", "accent", "sand", 4.5],
    ]);
    check("eco story (THEMES.c: deep forest)", THEMES[id], story);
    continue;
  }
  check(`${name}  (palette ${id.toUpperCase()}: ${THEMES[id].name})`, THEMES[id], css);
}
console.log(fail ? `\n${fail} failing check(s)` : "\nAll templates pass WCAG AA and match their palettes");
process.exit(fail ? 1 : 0);
