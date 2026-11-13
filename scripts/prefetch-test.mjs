#!/usr/bin/env node
// Is the film (engine + recipe chunk) already downloaded when the page opens? For each trigger (hover, focus, touch start)
// on each kind of link: load the start page, trigger, wait, then click and check that the film chunks were fetched BEFORE the click
// and that no film chunk is fetched after it. Also reports time from click to the first live frame, with and without prefetch.
// node scripts/prefetch-test.mjs [--base http://127.0.0.1:8080]
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const MARK = ["film-recipe:", "renderLists.dispose"];

const cases = [
  { name: "homepage category card, hover", start: "/", link: 'a[href="/material/rigid-boxes/"]', how: "hover", mode: "desktop", target: "/material/rigid-boxes/" },
  { name: "homepage category card, keyboard focus", start: "/", link: 'a[href="/shape-and-style/folding-cartons/"]', how: "focus", mode: "desktop", target: "/shape-and-style/folding-cartons/" },
  { name: "nav dropdown item, hover", start: "/industry/", menu: "desktop", link: 'nav a[href="/industry/pizza-boxes/"]', how: "hover", mode: "desktop", target: "/industry/pizza-boxes/" },
  { name: "hub card, hover", start: "/event/", link: 'main a[href="/event/christmas/"]', how: "hover", mode: "desktop", target: "/event/christmas/" },
  { name: "mobile menu item, touch start", start: "/", menu: "mobile", link: '#eco-mobile-menu a[href="/industry/jewelry-boxes/"]', how: "touch", mode: "mobile", target: "/industry/jewelry-boxes/" },
  { name: "no prefetch (control): click only", start: "/", link: 'a[href="/material/rigid-boxes/"]', how: "none", mode: "desktop", target: "/material/rigid-boxes/" },
];
const results = [];
for (const k of cases) {
  const c = await launch(k.mode === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  await c.send("Network.enable");
  await c.send("Emulation.setFocusEmulationEnabled", { enabled: true }); // headless pages are not focused by default
  await c.send("Page.navigate", { url: BASE + k.start });
  await c.waitFor("document.readyState === 'complete'", 30000);
  await sleep(2500);
  if (k.menu === "desktop") { await c.ev(`(()=>{const b=[...document.querySelectorAll('nav button[aria-haspopup]')][0]; b&&b.click();})()`); await sleep(300); }
  if (k.menu === "mobile") { await c.ev(`document.querySelector('button[aria-label="Open menu"]').click()`); await sleep(300); await c.ev(`(()=>{const bs=document.querySelectorAll('#eco-mobile-menu button[aria-expanded]'); bs[0].click();})()`); await sleep(300); }
  const pt = await c.ev(`(()=>{const el=document.querySelector(${JSON.stringify(k.link)}); if(!el) return null; el.scrollIntoView({block:'center'}); const b=el.getBoundingClientRect(); return [b.x+b.width/2,b.y+b.height/2];})()`);
  if (!pt) { console.log("FAIL", k.name, "link not found"); results.push(false); c.kill(); continue; }
  await sleep(200);
  const listJs = `performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.js')).map(e=>e.name)`;
  const before = new Set(await c.ev(listJs));
  if (k.how === "hover") { await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pt[0], y: pt[1] }); }
  if (k.how === "focus") { await c.ev(`document.querySelector(${JSON.stringify(k.link)}).focus()`); }
  if (k.how === "touch") { await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pt[0], y: pt[1] }] }); await c.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); }
  await sleep(2000);
  const pre = (await c.ev(listJs)).filter((u) => !before.has(u));
  // which of the chunks fetched so far hold film code
  const filmUrls = await c.ev(`(async()=>{const out=[]; for (const u of ${listJs}) { const t = await (await fetch(u)).text(); if (${JSON.stringify(MARK)}.some(m=>t.includes(m))) out.push(u);} return out;})()`);
  const loadedBeforeClick = new Set(filmUrls);
  const tClick = await c.ev("performance.now()");
  // click: a real (mouse) click on the link
  const pt2 = await c.ev(`(()=>{const el=document.querySelector(${JSON.stringify(k.link)}); const b=el.getBoundingClientRect(); return [b.x+b.width/2,b.y+b.height/2];})()`);
  if (k.mode === "mobile") { await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pt2[0], y: pt2[1] }] }); await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
  else { await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt2[0], y: pt2[1], button: "left", clickCount: 1 }); await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt2[0], y: pt2[1], button: "left", clickCount: 1 }); }
  await c.waitFor(`location.pathname === ${JSON.stringify(k.target)}`, 15000);
  await c.waitFor("window.__film && document.querySelector('#how canvas') && getComputedStyle(document.querySelector('#how canvas').parentElement).opacity === '1'", 30000);
  const tReady = await c.ev("performance.now()");
  const after = (await c.ev(listJs)).filter((u) => !before.has(u) && !pre.includes(u));
  const lateFilm = await c.ev(`(async()=>{const out=[]; for (const u of ${JSON.stringify(after)}) { const t = await (await fetch(u)).text(); if (${JSON.stringify(MARK)}.some(m=>t.includes(m))) out.push(u);} return out;})()`);
  const ok = k.how === "none" ? true : loadedBeforeClick.size >= 2 && lateFilm.length === 0;
  const info = `film chunks before click: ${loadedBeforeClick.size}, film chunks fetched after click: ${lateFilm.length}, click to live frame: ${Math.round(tReady - tClick)} ms`;
  console.log(`${ok ? "PASS" : "FAIL"}  ${k.name}: ${info}`);
  results.push(ok);
  c.kill();
  await sleep(300);
}
process.exit(results.every(Boolean) ? 0 : 1);
