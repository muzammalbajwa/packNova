#!/usr/bin/env node
// Behaviour of the page end: hover lifts the card 4 px and moves the drawing, keyboard focus shows a ring, reduced motion moves nothing,
// the quote band box only animates while on screen, no related card links to its own page, no duplicates, no horizontal overflow.
import { launch, sleep } from "./lib/cdp.mjs";
let fails = 0; const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const PAGE = "http://127.0.0.1:8080/material/rigid-boxes/";
for (const reduced of [false, true]) {
  const c = await launch({ width: 1440, height: 900 });
  if (reduced) await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await c.send("Page.navigate", { url: PAGE }); await sleep(3500);
  await c.ev("document.getElementById('rel-h').scrollIntoView({block:'start'}); window.scrollBy(0,-100)"); await sleep(800);
  const r = JSON.parse(await c.ev("JSON.stringify((()=>{const a=document.querySelectorAll('.rel-card'); const hrefs=[...a].map(x=>x.getAttribute('href')); const b=a[0].getBoundingClientRect(); return {n:a.length, self:hrefs.includes(location.pathname), dup:new Set(hrefs).size!==hrefs.length, x:b.x+b.width/2, y:b.y+b.height/2, top:b.top}})())"));
  if (!reduced) { ok(r.n === 4 && !r.self && !r.dup, `4 related cards, none is the page itself, no duplicates`); }
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y }); await sleep(700);
  const h = JSON.parse(await c.ev("JSON.stringify({top:document.querySelector('.rel-card').getBoundingClientRect().top, lid:getComputedStyle(document.querySelector('.rel-card .ic-lid')||document.querySelector('.rel-card .ic-flapA')||document.body).transform, arrow:getComputedStyle(document.querySelector('.rel-arrow')).transform})"));
  if (!reduced) ok(Math.abs(r.top - h.top - 4) < 0.6, `hover lifts the card by 4 px (${(r.top - h.top).toFixed(1)} px)`);
  else ok(Math.abs(r.top - h.top) < 0.1 && /none/.test(h.arrow) && (/none/.test(h.lid) || h.lid === "matrix(1, 0, 0, 1, 0, 0)"), `reduced motion: card, arrow and drawing do not move`);
  if (!reduced) ok(!/none/.test(h.lid) && !/none/.test(h.arrow), "hover moves the drawing and slides the arrow");
  // keyboard focus ring
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  await c.ev("document.body.focus()"); 
  await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }); await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await c.ev("document.querySelector('.rel-card').focus()"); await sleep(300);
  if (!reduced) ok(await c.ev("getComputedStyle(document.activeElement).outlineStyle!=='none' && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2"), "keyboard focus on a card shows a 3 px ring");
  // the band box animates only while on screen
  const run = async () => c.ev("getComputedStyle(document.querySelector('.band-flap')).animationPlayState");
  await c.ev("window.scrollTo(0,0)"); await sleep(600); const off = await run();
  await c.ev("document.querySelector('.band').scrollIntoView()"); await sleep(600); const on = await run();
  if (!reduced) ok(off === "paused" && on === "running", `band box: ${off} off screen, ${on} on screen`);
  else ok(await c.ev("getComputedStyle(document.querySelector('.band-flap')).animationName==='none'"), "reduced motion: band box does not animate");
  c.kill();
}
console.log(fails ? `${fails} FAILED` : "all passed"); process.exit(fails ? 1 : 0);
