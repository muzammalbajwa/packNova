#!/usr/bin/env node
// Mobile menu test at 390 px: open, accordion, scroll lock, close (button and Escape), link tap. Screenshots into --out.
// node scripts/menu-test.mjs [--base http://127.0.0.1:8080] [--out docs/screenshots/pages-v1]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const OUT = arg("out", "docs/screenshots/pages-v1");
mkdirSync(OUT, { recursive: true });
const c = await launch({ width: 390, height: 844, dpr: 2, mobile: true, cores: 4 });
const results = [];
const check = (name, ok, extra = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`); };
const tap = async (sel, nth = 0) => {
  const r = await c.ev(`(()=>{const el=document.querySelectorAll(${JSON.stringify(sel)})[${nth}]; if(!el) return null; el.scrollIntoView({block:'center'}); const b=el.getBoundingClientRect(); return [b.x+b.width/2,b.y+b.height/2]})()`);
  if (!r) throw new Error("no element " + sel);
  await sleep(120);
  const pt = await c.ev(`(()=>{const el=document.querySelectorAll(${JSON.stringify(sel)})[${nth}]; const b=el.getBoundingClientRect(); return [b.x+b.width/2,b.y+b.height/2]})()`);
  await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pt[0], y: pt[1] }] });
  await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(450);
};
const shot = async (name) => { const { data } = await c.send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${OUT}/${name}`, Buffer.from(data, "base64")); };

await c.send("Page.navigate", { url: BASE + "/industry/jewelry-boxes/" });
await c.waitFor("document.querySelector('button[aria-label=\"Open menu\"]')", 30000);
await sleep(1500);
await c.ev("window.scrollTo(0, 1260)");
await sleep(600);
await c.ev("window.scrollTo(0, 1200)"); // scrolling up brings the header back
await sleep(600);
const y0 = await c.ev("scrollY");

await tap('button[aria-label="Open menu"]');
check("menu opens (aria-expanded true, panel visible)", await c.ev(`document.querySelector('#eco-mobile-menu') !== null && document.querySelector('button[aria-controls="eco-mobile-menu"]').getAttribute('aria-expanded') === 'true'`));
check("header is visible when the menu opens", await c.ev(`document.querySelector('header').getBoundingClientRect().top >= -1`));
check("page scroll is locked (html overflow hidden)", await c.ev(`getComputedStyle(document.documentElement).overflow === 'hidden'`));
await c.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 195, y: 700, deltaX: 0, deltaY: 600 });
await sleep(500);
check("scrolling over the page behind does not move it", (await c.ev("scrollY")) === y0, `scrollY ${y0} -> ${await c.ev("scrollY")}`);

await tap('#eco-mobile-menu button[aria-expanded]', 0);
check("accordion 1 opens and shows its links", await c.ev(`(()=>{const b=document.querySelectorAll('#eco-mobile-menu button[aria-expanded]')[0]; return b.getAttribute('aria-expanded')==='true' && b.parentElement.querySelectorAll('a').length>=12})()`));
await tap('#eco-mobile-menu button[aria-expanded]', 1);
check("opening accordion 2 closes accordion 1", await c.ev(`(()=>{const b=document.querySelectorAll('#eco-mobile-menu button[aria-expanded]'); return b[0].getAttribute('aria-expanded')==='false' && b[1].getAttribute('aria-expanded')==='true'})()`));
await shot("mobile-menu-open.png");
check("menu panel fits the screen (no overflow past the viewport)", await c.ev(`document.querySelector('#eco-mobile-menu').getBoundingClientRect().bottom <= innerHeight + 1`));

await tap('button[aria-label="Close menu"]');
check("close button closes the menu", await c.ev(`document.querySelector('#eco-mobile-menu') === null`));
check("scroll lock released", await c.ev(`getComputedStyle(document.documentElement).overflow !== 'hidden'`));
await tap('button[aria-label="Open menu"]');
await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await sleep(300);
check("Escape closes the menu", await c.ev(`document.querySelector('#eco-mobile-menu') === null`));

await tap('button[aria-label="Open menu"]');
await tap('#eco-mobile-menu button[aria-expanded]', 3); // Event
const href = await c.ev(`document.querySelectorAll('#eco-mobile-menu button[aria-expanded]')[3].parentElement.querySelector('a').getAttribute('href')`);
await tap('#eco-mobile-menu button[aria-expanded="true"] + ul a', 0);
await sleep(1200);
const path = await c.ev("location.pathname");
check("tapping a link opens that page", path === href, `${path} (expected ${href})`);
check("menu is closed and scroll works after navigating", await c.ev(`document.querySelector('#eco-mobile-menu') === null && getComputedStyle(document.documentElement).overflow !== 'hidden'`));
c.kill();
process.exit(results.every(Boolean) ? 0 : 1);
