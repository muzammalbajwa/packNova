#!/usr/bin/env node
// "How an order works": the heading column is pinned (CSS sticky) on desktop and released at the end of the list; the step at the middle of
// the screen is active; no layout shift; nothing pinned on mobile; reduced motion shows every step at full opacity. Screenshots of the
// four positions at 1440x900 and one at 390 go to docs/screenshots/pages-v1/how-it-works/.
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const OUT = "docs/screenshots/pages-v1/how-it-works"; mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const shot = async (c, f) => writeFileSync(`${OUT}/${f}`, Buffer.from((await c.send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
const R = `(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(); const pin=q('.process-pin'), sec=q('#process'), lis=[...document.querySelectorAll('.process-step')];
  return JSON.stringify({pinTop:Math.round(pin.top), pinBottom:Math.round(pin.bottom), secTop:Math.round(sec.top), secBottom:Math.round(sec.bottom), pos:getComputedStyle(document.querySelector('.process-pin')).position,
  states:lis.map(l=>l.dataset.state||'-').join(','), op:lis.map(l=>(+getComputedStyle(l).opacity).toFixed(2)).join(','), fill:document.querySelector('.process-list').style.getPropertyValue('--fill')})})()`;
{
  const c = await launch({ width: 1440, height: 900 });
  await c.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__cls=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) if(!e.hadRecentInput && (e.sources||[]).some(x=>x.node&&x.node.parentElement&&x.node.parentElement.closest('#process'))) window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})" });
  await c.send("Page.navigate", { url: "http://127.0.0.1:8080/" }); await sleep(6500);
  const at = async (name, y, file) => { await c.ev(`window.scrollTo(0, ${y})`); await sleep(1300); const r = JSON.parse(await c.ev(R)); if (file) await shot(c, file); console.log(name, JSON.stringify(r)); return r; };
  const top = await c.ev("(()=>{const s=document.getElementById('process'); return Math.round(s.getBoundingClientRect().top+scrollY)})()");
  const secH = await c.ev("document.getElementById('process').offsetHeight");
  console.log("section top", top, "height", secH, "(viewport 900)");
  const cls0 = await c.ev("window.__cls");
  const mid = (k) => c.ev(`(()=>{const l=document.querySelectorAll('.process-step')[${k}].getBoundingClientRect(); return Math.round(l.top+scrollY+l.height/2-450)})()`); // scroll that puts step k at the viewport middle
  const a = await at("before section   ", top - 520, "1-before-section.jpg");
  ok(a.states.split(",").every((x) => x === "active" || x === "next" || x === "-"), "before the section the first step is the active one");
  const entry = await at("pin starts      ", top - 132 + 5, null);
  const s1 = await at("step 1 active   ", await mid(0), "2-step-1-active.jpg");
  ok(s1.pos === "sticky", "heading column is position: sticky");
  ok(s1.states.startsWith("active") && /^1\.00,0\.70/.test(s1.op), "step 1 is active (full opacity), the others are at 70% opacity (AA contrast)");
  const s2 = await at("step 2          ", await mid(1), null);
  const s3 = await at("step 3 active   ", await mid(2), "3-step-3-active.jpg");
  ok(/^past,past,active,next/.test(s3.states), `step 3 is active at its position (${s3.states})`);
  ok(Math.abs(s2.pinTop - s3.pinTop) <= 1 && s2.pinTop === 132, `the heading column stays put at 132 px (header 100 px + 32 px) while the steps scroll (steps 2 and 3: ${s2.pinTop}, ${s3.pinTop})`);
  ok(s1.pinTop >= 132, `before the pin starts the column is at or below its pinned position (${s1.pinTop})`);
  ok(s2.pinTop >= 100 && s3.pinTop >= 100, `the pinned column stays below the 100 px header`);
  const s4 = await at("step 4 active   ", await mid(3), null);
  ok(/^past,past,past,active/.test(s4.states) && s4.fill === "1", `step 4 (the last) becomes active and the line is full (${s4.states}, fill ${s4.fill})`);
  const end = await at("section end     ", top + secH - 330, "4-section-end-released.jpg");
  ok(end.pinBottom <= end.secBottom, `at the end the column is released and stays inside the section (column bottom ${end.pinBottom}, section bottom ${end.secBottom})`);
  ok(end.pinTop < s1.pinTop, "the released column has started to scroll away with the section");
  await c.ev(`window.scrollTo(0, ${top + secH + 200})`); await sleep(800);
  const below = JSON.parse(await c.ev(R));
  ok(below.pinBottom <= below.secBottom, "below the section the column does not overlap the next section");
  const cls = (await c.ev("window.__cls")) - cls0; ok(cls === 0, `layout shift caused by the section while scrolling through it: CLS ${cls} (the film caption overlay has its own 0.005 on first scroll)`);
  const h = await c.ev("JSON.stringify([...document.querySelectorAll('#process h2, #process h3')].map(e=>e.tagName))"); console.log("headings", h);
  c.kill();
}
{
  const c = await launch({ width: 390, height: 844, dpr: 2, mobile: true, cores: 4 });
  await c.send("Page.navigate", { url: "http://127.0.0.1:8080/" }); await sleep(6500);
  await c.ev("(()=>{const s=document.getElementById('process'); window.scrollTo(0, s.getBoundingClientRect().top+scrollY+300)})()"); await sleep(1300);
  const r = JSON.parse(await c.ev(R)); await shot(c, "5-mobile-390.jpg");
  ok(r.pos !== "sticky", "mobile: nothing is pinned");
  ok(/active/.test(r.states), `mobile: the active-step highlight works (${r.states})`);
  c.kill();
}
{
  const c = await launch({ width: 1440, height: 900 });
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await c.send("Page.navigate", { url: "http://127.0.0.1:8080/" }); await sleep(6500);
  await c.ev("(()=>{const s=document.getElementById('process'); window.scrollTo(0, s.getBoundingClientRect().top+scrollY+300)})()"); await sleep(1000);
  const r = JSON.parse(await c.ev(R));
  ok(r.op.split(",").every((x) => x === "1.00"), `reduced motion: every step fully visible (${r.op})`);
  c.kill();
}
console.log(fails ? `${fails} FAILED` : "all passed"); process.exit(fails ? 1 : 0);
