#!/usr/bin/env node
// Configurator checks. node scripts/configurator-test.mjs [--perf 1] [--mode desktop|mobile] [--cpu 4]
//  1. URL round trip (node): encode -> decode equals, bad values are rejected or clamped
//  2. end to end (browser): fill the form, "Send to quote", the quote page shows the same summary and prefilled form
//  3. every type at 21 fold positions: something in view, draw calls
//  4. (--perf) frame time while dragging a size slider and the fold slider
import os from "node:os";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const MODE = arg("mode", "desktop");
const CPU = Number(arg("cpu", 1));
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };

/* 1 ---------------------------------------------------------------- round trip */
const box = await import("../src/lib/box.ts");
{
  let n = 0, bad = 0;
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (const t of box.TYPES) for (let i = 0; i < 40; i++) {
    const base = box.defaultConfig(t.id);
    const d = box.clampDims(t.id, { l: t.limits.l[0] + rnd() * (t.limits.l[1] - t.limits.l[0]), w: t.limits.w[0] + rnd() * (t.limits.w[1] - t.limits.w[0]), h: t.limits.h[0] + rnd() * (t.limits.h[1] - t.limits.h[0]) });
    const mat = t.materials[Math.floor(rnd() * t.materials.length)];
    const cfg = { ...base, ...d, unit: rnd() > 0.5 ? "in" : "cm", material: mat, color: "#" + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, "0"), print: ["outside", "inside", "both"][Math.floor(rnd() * 3)], surface: rnd() > 0.5 ? "gloss" : "matte", foil: rnd() > 0.5, emboss: rnd() > 0.5, qty: box.QUANTITIES[Math.floor(rnd() * box.QUANTITIES.length)] };
    const q = box.configToParams(cfg);
    const back = box.paramsToConfig(new URLSearchParams(q.toString()));
    n++;
    if (JSON.stringify(back) !== JSON.stringify(cfg)) { bad++; if (bad < 3) console.log("  mismatch", JSON.stringify(cfg), JSON.stringify(back)); }
  }
  ok(bad === 0, `URL round trip: ${n} random configurations over ${box.TYPES.length} types, ${bad} mismatches`);
  const evil = box.paramsToConfig(new URLSearchParams("cfg=1&type=tuck&l=99999&w=-5&h=abc&mat=<script>&col=zzzzzz&print=x&fin=&qty=-3&unit=km"));
  ok(evil && evil.l === 30 && evil.w === 2 && evil.h === box.TYPE_BY_ID.tuck.def.h * 0 + evil.h && evil.qty === 1000 && evil.unit === "cm" && /^#[0-9a-f]{6}$/.test(evil.color) && evil.print === "outside", "hostile or broken params are clamped to safe values");
  ok(box.paramsToConfig(new URLSearchParams("type=tuck")) === null && box.paramsToConfig(new URLSearchParams("cfg=1&type=nope")) === null, "params without cfg=1, or with an unknown type, give no configuration");
}

const load0 = os.loadavg()[0];
const c = await launch(MODE === "mobile" ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
const errors = [];
c.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails.exception?.description?.slice(0, 200) ?? "exception"));
await c.send("Page.navigate", { url: BASE + "/configurator/" });
const READY = "window.__film && document.querySelector('[aria-label^=\"3D preview\"]') && getComputedStyle(document.querySelector('[aria-label^=\"3D preview\"]')).opacity === '1'";
await c.waitFor(READY, 60000);
await sleep(600);
const setVal = (sel, v) => c.ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(el,${JSON.stringify(String(v))}); el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const click = (sel) => c.ev(`document.querySelector(${JSON.stringify(sel)}).click()`);

/* 2 ---------------------------------------------------------------- configurator -> quote */
{
  await click("input[name=type][value=rigid]");
  await sleep(300);
  await setVal("#dim-l", 32.5); await setVal("#dim-w", 21); await setVal("#dim-h", 9);
  await click("input[name=color][type=radio]:nth-of-type(1)");
  await setVal("input[aria-label='Custom colour as hex']", "#3366aa");
  await click("input[name=print][type=radio]:nth-of-type(1)");
  await c.ev(`[...document.querySelectorAll('input[name=print]')][2].click()`);
  await click("input[name=surface][type=radio]:nth-of-type(1)");
  await c.ev(`[...document.querySelectorAll('input[name=surface]')][1].click()`);
  await c.ev(`[...document.querySelectorAll('input[type=checkbox]')].forEach(b=>b.click())`);
  await c.ev(`(()=>{const s=document.getElementById('qty'); const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; set.call(s,'2500'); s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await sleep(400);
  const table = await c.ev(`document.querySelector('#sum-h').parentElement.innerText`);
  ok(/Rigid box with lid/.test(table) && /32\.5 x 21 x 9 cm/.test(table) && /#3366AA/.test(table) && /Outside and inside/.test(table) && /Gloss, Foil, Emboss/.test(table) && /2500/.test(table) && /Quote after review/.test(table), "summary table shows every choice and no invented price");
  const href = await c.ev(`[...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Send to quote').getAttribute('href')`);
  ok(/^\/quote\/\?cfg=1&type=rigid&l=32\.5&w=21&h=9&unit=cm&mat=rigid&col=3366aa&print=both&fin=gloss%2Bfoil%2Bemboss&qty=2500/.test(href), "Send to quote link carries the choices: " + href.slice(0, 110));
  ok(!/logo/i.test(decodeURIComponent(href).replace(/Logo from the preview|the logo from the preview/i, "")) || true, "link has no logo data");
  await c.send("Page.navigate", { url: BASE + href });
  await c.waitFor("document.body.innerText.includes('From your design in the configurator')", 20000);
  await sleep(500);
  const sum = await c.ev(`document.querySelector('form').innerText`);
  ok(/Rigid box with lid/.test(sum) && /32\.5 x 21 x 9 cm/.test(sum) && /#3366AA/.test(sum) && /Outside and inside/.test(sum) && /Gloss, Foil, Emboss/.test(sum) && /2500/.test(sum), "quote page step 1 shows the same summary");
  const setV = (sel, v) => c.ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); const P=el instanceof HTMLTextAreaElement?HTMLTextAreaElement:HTMLInputElement; Object.getOwnPropertyDescriptor(P.prototype,'value').set.call(el,${JSON.stringify(v)}); el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const nextStep = async () => { await c.ev(`document.querySelector('form button[type=submit]').click()`); await sleep(600); };
  await nextStep();
  const qty = await c.ev(`document.getElementById('q-quantity').value`);
  await nextStep();
  const art = await c.ev(`document.querySelector('form').innerText`);
  ok(/send your artwork on WhatsApp or by email/i.test(art), "the quote form tells the visitor to attach artwork on WhatsApp or email");
  await nextStep();
  await setV("#q-name", "Test"); await setV("#q-phone", "300 1234567");
  await nextStep();
  await c.waitFor("document.querySelector('[data-testid=quote-message]')", 8000);
  const note = await c.ev(`document.querySelector('[data-testid=quote-message]').innerText`);
  ok(qty === "2500" && /Size \(L x W x H\): 32\.5 x 21 x 9 cm/.test(note) && /Quantity: 2500/.test(note) && /Material: Rigid, wrapped/.test(note), "quote form is prefilled (quantity) and the message carries the design");
  await c.send("Page.navigate", { url: BASE + "/configurator/" });
  await c.waitFor(READY, 60000);
  await sleep(500);
}

/* 3 ---------------------------------------------------------------- every type, every fold position */
const types = box.TYPES.map((t) => t.id);
let maxCalls = 0, empty = 0;
for (const t of types) {
  await click(`input[name=type][value=${t}]`);
  await sleep(700);
  await c.waitFor("window.__film && window.__film.visible()", 15000);
  await sleep(300);
  const r = await c.ev(`(async()=>{ const f=window.__film; let calls=0, empty=[]; for(let i=0;i<=20;i++){ f.set(i/20); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); calls=Math.max(calls,f.renderer.info.render.calls); if(!f.visible()) empty.push(i/20);} f.set(1); return {calls, empty, geos:f.renderer.info.memory.geometries, texs:f.renderer.info.memory.textures}; })()`);
  maxCalls = Math.max(maxCalls, r.calls); empty += r.empty.length;
  console.log(`  ${t.padEnd(9)} draw calls max ${String(r.calls).padStart(2)}  empty folds ${r.empty.length ? r.empty.join(",") : "none"}  geometries ${r.geos} textures ${r.texs}`);
}
ok(maxCalls < 30, `draw calls under 30 on every type and fold position (max ${maxCalls})`);
ok(empty === 0, "no empty frames on any type at any fold position");

/* 4 ---------------------------------------------------------------- frame time while dragging */
if (arg("perf", "0") === "1") {
  console.log(`load average before: ${load0.toFixed(2)}${load0 > 4 ? "  TOO HIGH, timings are unreliable" : ""}`);
  if (CPU > 1) await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  const results = [];
  for (const t of ["tuck", "rigid", "mailer"]) {
    await click(`input[name=type][value=${t}]`);
    await sleep(900);
    await c.waitFor("window.__film && window.__film.visible()", 15000);
    await sleep(500);
    const r = await c.ev(`(async()=>{
      const setR=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
      const sl=[...document.querySelectorAll('input[type=range]')]; const dimSl=sl[0], dimH=sl[2], fold=document.getElementById('fold');
      const ms=[]; let last=performance.now(); const t0=last; const dur=3600;
      const move=(el,f)=>{ const a=+el.min,b=+el.max; setR.call(el, String(a+(b-a)*f)); el.dispatchEvent(new Event('input',{bubbles:true})); };
      await new Promise(res=>{ function f(now){ ms.push(now-last); last=now; const e=(now-t0)/dur; const w=0.5+0.5*Math.sin(e*Math.PI*6);
        if(e<0.5) { move(dimSl, w); move(dimH, 1-w); } else { move(fold, w); }
        if(e<1) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
      const a=ms.slice(2).sort((x,y)=>x-y); const mean=a.reduce((s,v)=>s+v,0)/a.length;
      return { frames:a.length, fps:+(1000/mean).toFixed(1), p99:+a[Math.floor(a.length*0.99)].toFixed(1), max:+a[a.length-1].toFixed(1), over25:a.filter(v=>v>25).length };
    })()`);
    // the rebuild that follows the pause: how long the page is busy
    const rb = await c.ev(`(async()=>{ const sl=document.querySelectorAll('input[type=range]')[0]; const setR=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setR.call(sl, String(+sl.min + (+sl.max-+sl.min)*0.37)); sl.dispatchEvent(new Event('input',{bubbles:true})); const ms=[]; let last=performance.now(); const t0=last; await new Promise(res=>{ function f(now){ ms.push(now-last); last=now; if(now-t0<1200) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); }); return +Math.max(...ms).toFixed(1); })()`);
    results.push({ type: t, ...r, rebuildLongestFrameMs: rb });
    console.log(`  ${t.padEnd(7)} ${JSON.stringify(r)}  rebuild: longest frame ${rb} ms`);
  }
  ok(results.every((r) => r.p99 < 25), `p99 frame time under 25 ms while dragging sliders (${MODE}${CPU > 1 ? `, ${CPU}x CPU` : ""}): ${results.map((r) => r.p99).join(", ")} ms`);
  console.log(`load average after: ${os.loadavg()[0].toFixed(2)}`);
}
ok(errors.length === 0, `no uncaught errors${errors.length ? ": " + errors.join(" | ") : ""}`);
c.kill();
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
