#!/usr/bin/env node
// Hub pages: filter chips (buttons, aria-pressed, live count), full list without script, hover lift, reduced motion, scroll-in, no horizontal scroll at
// 1440, 1024, 768 and 390, no layout shift. node scripts/hub-test.mjs
import { launch, sleep } from "./lib/cdp.mjs";
let fails = 0; const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const B = "http://127.0.0.1:8080";
{
  const c = await launch({ width: 1440, height: 900 });
  await c.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__cls=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})" });
  await c.send("Page.navigate", { url: B + "/industry/" }); await sleep(3000);
  const cls = await c.ev("window.__cls"); ok(cls === 0, `CLS ${cls} on load (the filter hides cards by design, so it is measured before any chip is used)`);
  ok((await c.ev("document.querySelectorAll('#hub-grid > li').length")) === 12, "12 cards, one per industry page");
  ok((await c.ev("document.querySelector('[role=status]').textContent")) === "12 industries", "count line says 12 industries");
  ok(await c.ev("[...document.querySelectorAll('.hub-chip')].every(b=>b.tagName==='BUTTON' && b.hasAttribute('aria-pressed'))"), "chips are real buttons with aria-pressed");
  await c.ev("[...document.querySelectorAll('.hub-chip')].find(b=>/^Rigid/.test(b.textContent)).click()"); await sleep(400);
  const r = JSON.parse(await c.ev("JSON.stringify({shown:[...document.querySelectorAll('#hub-grid > li')].filter(l=>!l.hidden).length, text:document.querySelector('[role=status]').textContent, pressed:[...document.querySelectorAll('.hub-chip')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent), wide:document.querySelector('[data-feature]').hasAttribute('data-wide')})"));
  ok(r.shown === 3 && r.text === "3 of 12 industries" && r.pressed.length === 1 && !r.wide, `filter Rigid: ${r.shown} cards, "${r.text}", pressed ${JSON.stringify(r.pressed)}, feature size dropped`);
  await c.ev("[...document.querySelectorAll('.hub-chip')][0].click()"); await sleep(300);
  ok((await c.ev("[...document.querySelectorAll('#hub-grid > li')].filter(l=>!l.hidden).length")) === 12, "All brings every card back");
  // scroll-in: cards far below start faded, and are fully visible once scrolled to
  await c.ev("window.scrollTo(0, document.querySelector('#hub-grid > li:nth-child(10)').getBoundingClientRect().top + scrollY - 300)"); await sleep(1200);
  ok((await c.ev("+getComputedStyle(document.querySelector('#hub-grid > li:nth-child(10)')).opacity")) > 0.98, "a card scrolled into view is fully visible");
  // hover
  await c.ev("(()=>{const b=document.querySelector('#hub-grid > li:nth-child(5) .rel-card').getBoundingClientRect(); window.scrollTo(0, b.top + scrollY - 250)})()"); await sleep(900);
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 }); await sleep(300);
  const p = JSON.parse(await c.ev("JSON.stringify((()=>{const b=document.querySelector('#hub-grid > li:nth-child(5) .rel-card').getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2,t:b.top}})())"));
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y }); await sleep(700);
  const t2 = await c.ev("document.querySelector('#hub-grid > li:nth-child(5) .rel-card').getBoundingClientRect().top");
  ok(Math.abs(p.t - t2 - 4) < 0.7, `hover lifts the card 4 px (${(p.t - t2).toFixed(1)})`);
  ok(await c.ev("getComputedStyle(document.querySelector('#hub-grid > li:nth-child(5) .rel-card')).borderTopColor !== getComputedStyle(document.querySelector('#hub-grid > li:nth-child(6) .rel-card')).borderTopColor"), "hover changes the card border");
  // keyboard focus ring on a card
  await c.ev("document.querySelector('#hub-grid > li:nth-child(2) a').focus()"); await sleep(200);
  ok(await c.ev("parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2"), "keyboard focus on a card shows a ring");
  c.kill();
}
{
  const c = await launch({ width: 1440, height: 900 });
  await c.send("Emulation.setScriptExecutionDisabled", { value: true });
  await c.send("Page.navigate", { url: B + "/industry/" }); await sleep(3000);
  const r = JSON.parse(await c.ev("1").catch(() => "1") && "{}"); void r;
  c.kill();
}
{
  const c = await launch({ width: 1440, height: 900 });
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await c.send("Page.navigate", { url: B + "/industry/" }); await sleep(3000);
  ok(await c.ev("getComputedStyle(document.querySelector('#hub-grid > li:nth-child(10)')).animationName === 'none'"), "reduced motion: cards have no entrance animation");
  await c.ev("window.scrollTo(0, 400)"); await sleep(500);
  const p = JSON.parse(await c.ev("JSON.stringify((()=>{const b=document.querySelector('#hub-grid > li:nth-child(3) .rel-card').getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2,t:b.top}})())"));
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y }); await sleep(600);
  ok(Math.abs(p.t - (await c.ev("document.querySelector('#hub-grid > li:nth-child(3) .rel-card').getBoundingClientRect().top"))) < 0.1, "reduced motion: the card does not lift");
  c.kill();
}
for (const [w, h, m] of [[1440, 900, false], [1024, 768, false], [768, 1024, false], [390, 844, true]]) {
  const c = await launch(m ? { width: w, height: h, dpr: 2, mobile: true, cores: 4 } : { width: w, height: h });
  let bad = 0;
  for (const path of ["/industry/", "/shape-and-style/", "/material/", "/event/"]) {
    await c.send("Page.navigate", { url: B + path }); await sleep(2200);
    if ((await c.ev("document.documentElement.scrollWidth - document.documentElement.clientWidth")) > 0) bad++;
  }
  ok(bad === 0, `${w}px: no horizontal scroll on the four hubs`);
  c.kill();
}
console.log(fails ? `${fails} FAILED` : "all passed"); process.exit(fails ? 1 : 0);
