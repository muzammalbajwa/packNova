#!/usr/bin/env node
// Product icon hover check. For every product card of a template: freezes the animation at 4 moments
// (start, early, peak, return) and screenshots the icon; then hovers with a real mouse and measures frame
// times, tests keyboard focus and prefers-reduced-motion, and collects console errors.
// node scripts/hover-shots.mjs --template editorial [--base http://localhost:3000]
import { writeFileSync, mkdirSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const TEMPLATE = arg("template", "eco");
const BASE = arg("base", "http://localhost:3000");
const OUT = "docs/screenshots/hover";
const DUR = 1400;
const MOMENTS = [["1-start", 0.02], ["2-early", 0.25], ["3-peak", 0.5], ["4-return", 0.9]];
mkdirSync(OUT, { recursive: true });

const c = await launch({ width: 1440, height: 900, dpr: 1 });
const errors = [];
await c.send("Log.enable");
c.on("Runtime.consoleAPICalled", (p) => { if (p.type === "error") errors.push(p.args?.map((a) => a.value ?? a.description).join(" ")); });
c.on("Runtime.exceptionThrown", (p) => errors.push(p.exceptionDetails?.exception?.description ?? "exception"));
await c.send("Page.navigate", { url: `${BASE}/?tier=none` });
await c.waitFor("document.getElementById('products')", 60000);
await sleep(2500);
await c.ev("window.scrollTo(0, document.getElementById('products').getBoundingClientRect().top + scrollY + 120)");
await sleep(1500);

const cards = await c.ev("document.querySelectorAll('#products .group').length");
console.log("cards:", cards);
const names = ["corrugated", "carton", "rigid", "pouch", "courier", "paper"];

/* 1) frozen frames: start the animation, then pause every animation at a chosen time */
for (let i = 0; i < cards; i++) {
  await c.ev(`document.querySelectorAll('#products .group')[${i}].scrollIntoView({block:'center'})`);
  await sleep(700);
  for (const [label, t] of MOMENTS) {
    await c.ev(`(() => { const s = document.querySelectorAll('#products .group .pi')[${i}]; s.removeAttribute('data-play'); void s.getBoundingClientRect(); s.dataset.play = '1'; })()`);
    await sleep(60);
    await c.ev(`(() => { const s = document.querySelectorAll('#products .group .pi')[${i}]; s.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = ${t * DUR}; }); })()`);
    await sleep(120);
    const r = JSON.parse(await c.ev(`(() => { const b = document.querySelectorAll('#products .group .pi')[${i}].getBoundingClientRect(); return JSON.stringify({ x: b.x + scrollX, y: b.y + scrollY, w: b.width, h: b.height }); })()`));
    const pad = 22;
    const { data } = await c.send("Page.captureScreenshot", { format: "png", clip: { x: r.x - pad, y: r.y - pad - 12, width: r.w + pad * 2, height: r.h + pad * 2 + 12, scale: 3 } });
    writeFileSync(`${OUT}/${TEMPLATE}-${names[i]}-${label}.png`, Buffer.from(data, "base64"));
    await c.ev(`(() => { const s = document.querySelectorAll('#products .group .pi')[${i}]; s.getAnimations({ subtree: true }).forEach((a) => a.cancel()); s.removeAttribute('data-play'); })()`);
  }
}

/* 2) real mouse hover on every card while recording frame times */
const frames = JSON.parse(await c.ev(`(async () => {
  const d = []; let last = performance.now(); let run = true;
  (function f(now) { d.push(now - last); last = now; if (run) requestAnimationFrame(f); })(last);
  window.__stop = () => { run = false; };
  return JSON.stringify([]);
})()`));
for (let i = 0; i < cards; i++) {
  const r = JSON.parse(await c.ev(`(() => { const e = document.querySelectorAll('#products .group')[${i}]; e.scrollIntoView({block:'center'}); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.x + b.width / 2, y: b.y + b.height / 2 }); })()`));
  await sleep(300);
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y });
  await sleep(500);
  // leave in the middle of the animation, re-enter, leave again: must not glitch
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  await sleep(250);
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y });
  await sleep(1700);
}
const ft = JSON.parse(await c.ev(`(() => { window.__stop(); return '[]'; })()`));
const stats = JSON.parse(await c.ev(`(async () => {
  // second pass: pure measurement of one full hover per card on the page
  const cards = [...document.querySelectorAll('#products .group')];
  const d = []; let last = performance.now();
  let go = true; (function f(now) { d.push(now - last); last = now; if (go) requestAnimationFrame(f); })(last);
  for (const el of cards) { el.scrollIntoView({ block: 'center' }); el.dispatchEvent(new PointerEvent('pointerenter')); await new Promise((r) => setTimeout(r, 1650)); }
  go = false; d.shift();
  const s = [...d].sort((a, b) => a - b); const q = (x) => s[Math.min(s.length - 1, Math.floor(s.length * x))];
  return JSON.stringify({ frames: d.length, avgFps: +(1000 / (d.reduce((a, b) => a + b, 0) / d.length)).toFixed(1), p95ms: +q(0.95).toFixed(1), p99ms: +q(0.99).toFixed(1), maxMs: +s[s.length - 1].toFixed(1), over33: d.filter((x) => x > 33.4).length });
})()`));
console.log("frame stats while hovering all cards:", JSON.stringify(stats));

/* 3) keyboard: Tab to the first product card and see whether the animation plays */
await c.ev("window.scrollTo(0, document.getElementById('products').getBoundingClientRect().top + scrollY)");
await c.ev("document.querySelectorAll('#products .group .pi').forEach((s) => s.removeAttribute('data-play')); document.activeElement.blur(); document.querySelector('#products .group').focus({ preventScroll: true });");
await sleep(300);
console.log("keyboard focus -> data-play:", await c.ev("document.querySelector('#products .group .pi').dataset.play ?? 'none'"), "| anim count:", await c.ev("document.querySelector('#products .group .pi').getAnimations({subtree:true}).length"));
await sleep(1700);
console.log("after 1.7s data-play:", await c.ev("document.querySelector('#products .group .pi').dataset.play ?? 'none'"));

/* 4) reduced motion */
await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await c.ev("document.querySelectorAll('#products .group .pi').forEach((s) => s.removeAttribute('data-play'))");
await c.ev("document.querySelector('#products .group .pi').dataset.play = '1'");
await sleep(200);
console.log("reduced motion -> running animations:", await c.ev("document.querySelector('#products .group .pi').getAnimations({subtree:true}).length"), "| svg opacity:", await c.ev("getComputedStyle(document.querySelector('#products .group .pi')).opacity"));
console.log("console errors:", errors.length ? errors : "none");
c.kill(); process.exit(0);
