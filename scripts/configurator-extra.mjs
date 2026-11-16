#!/usr/bin/env node
// More configurator checks: logo upload and its limits, labelled controls, keyboard rotation, fallbacks, rebuild leaks.
// node scripts/configurator-extra.mjs [--logos dir]  (dir needs logo.png (small), big.png (>2 MB) and notimage.txt)
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const LOGOS = arg("logos", "/private/tmp/claude-501/-Users-wasiq/277a7bf9-9ab1-4b23-846a-1fd8c6033f48/scratchpad/logos");
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const READY = "window.__film && document.querySelector('[aria-label^=\"3D preview\"]') && getComputedStyle(document.querySelector('[aria-label^=\"3D preview\"]')).opacity === '1'";

async function open(opts, url = "/configurator/") {
  const c = await launch({ width: 1440, height: 900 });
  const errors = [];
  c.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails.exception?.description?.slice(0, 200) ?? "exception"));
  if (opts.reduced) await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await c.send("Network.enable");
  // count requests that leave this origin: nothing (the logo above all) may be sent anywhere
  const external = [];
  c.on("Network.requestWillBeSent", (e) => { if (!e.request.url.startsWith(BASE) && !e.request.url.startsWith("data:") && !e.request.url.startsWith("blob:")) external.push(e.request.method + " " + e.request.url.slice(0, 80)); });
  const posts = [];
  c.on("Network.requestWillBeSent", (e) => { if (e.request.method !== "GET") posts.push(e.request.method + " " + e.request.url.slice(0, 80)); });
  await c.send("Page.navigate", { url: BASE + url });
  return { c, errors, external, posts };
}

/* 1 --- logo, a11y, keyboard, leaks (with WebGL) */
{
  const { c, errors, external, posts } = await open({});
  await c.waitFor(READY, 60000);
  await sleep(600);
  // every form control has an accessible name
  const unnamed = await c.ev(`[...document.querySelectorAll('main input, main select, main textarea, main button')].filter(el=>{ if(el.type==='hidden') return false; const n=(el.getAttribute('aria-label')||'').trim() || (el.labels&&[...el.labels].map(l=>l.innerText).join('').trim()) || el.innerText?.trim() || el.getAttribute('title'); return !n; }).map(el=>el.outerHTML.slice(0,90))`);
  ok(unnamed.length === 0, `every input, select and button has a name (${unnamed.length} without${unnamed.length ? ": " + unnamed.join(" | ") : ""})`);
  const canvasLabel = await c.ev(`document.querySelector('[aria-label^="3D preview"]').getAttribute('aria-label')`);
  ok(/Tuck box, 9 by 6 by 13 cm/.test(canvasLabel) && /arrow keys/.test(canvasLabel), "the 3D area has an aria-label with the same information as the text: " + canvasLabel.slice(0, 70));

  // keyboard: focus the preview, ArrowRight turns it
  const before = await c.ev(`(()=>{const p=__film.camera.position; return [p.x,p.y,p.z]})()`);
  await c.ev(`document.querySelector('[aria-label^="3D preview"]').focus()`);
  await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await sleep(700);
  const after = await c.ev(`(()=>{const p=__film.camera.position; return [p.x,p.y,p.z]})()`);
  ok(Math.hypot(...before.map((v, i) => v - after[i])) > 0.05, "ArrowRight on the focused preview turns the box");
  await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Home", code: "Home", windowsVirtualKeyCode: 36 });
  await sleep(900);
  const reset = await c.ev(`(()=>{const p=__film.camera.position; return [p.x,p.y,p.z]})()`);
  ok(Math.hypot(...before.map((v, i) => v - reset[i])) < 0.05, "Home resets the view");
  // drag is limited: a huge drag cannot flip the box over
  await c.ev(`(()=>{const el=document.querySelector('[aria-label^="3D preview"]'); const r=el.getBoundingClientRect(); const ev=(t,x,y)=>el.dispatchEvent(new PointerEvent(t,{pointerId:1,clientX:x,clientY:y,bubbles:true})); ev('pointerdown',r.x+100,r.y+100); for(let i=1;i<=60;i++) ev('pointermove', r.x+100+i*40, r.y+100+i*40); ev('pointerup',r.x+100,r.y+100);})()`);
  await sleep(900);
  const dragged = await c.ev(`(()=>{const p=__film.camera.position; const d=Math.hypot(p.x,p.y,p.z); return {pitch: Math.asin(p.y/d)}})()`);
  ok(dragged.pitch < 1.2 && dragged.pitch > -0.5, `a very long drag stays within the view limits (pitch ${dragged.pitch.toFixed(2)} rad)`);

  // logo: small PNG accepted, downscaled, shown; too big and wrong type refused; nothing is uploaded
  const { root } = await c.send("DOM.getDocument");
  const { nodeId } = await c.send("DOM.querySelector", { nodeId: root.nodeId, selector: "#logo" });
  const feed = async (f) => { await c.send("DOM.setFileInputFiles", { files: [`${LOGOS}/${f}`], nodeId }); await sleep(900); };
  await feed("notimage.txt");
  ok(/PNG, JPG/.test(await c.ev(`document.querySelector('[role=status]').innerText`)) && /Use a PNG/.test(await c.ev(`document.querySelector('[role=status]').innerText`)), "a text file is refused with a clear message");
  await feed("big.png");
  ok(/over 2 MB/.test(await c.ev(`document.querySelector('[role=status]').innerText`)), "a file over 2 MB is refused with a clear message");
  const posts0 = posts.length;
  await feed("logo.png");
  const shown = await c.ev(`document.querySelector('#sum-h').parentElement.innerText`);
  ok(/logo\.png \(preview only\)/.test(shown), "a small PNG is accepted and listed as preview only");
  await sleep(600);
  const dims = await c.ev(`(()=>{ let m=0; __film.scene.traverse(o=>{ const t=o.material&&o.material.map; if(t&&t.image&&t.image.width) m=Math.max(m,t.image.width,t.image.height); }); return m; })()`);
  ok(dims <= 1024, `textures stay at 1024 px or less (largest ${dims}) although the logo was 3000 px`);
  const href = await c.ev(`[...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Send to quote').getAttribute('href')`);
  ok(!/logo\.png|data:|blob:/.test(decodeURIComponent(href)), "the logo is not carried in the quote link");
  ok(external.length === 0 && posts.length === posts0, `no request leaves the site and nothing is posted (${external.length} external, ${posts.length - posts0} non-GET after the upload)`);

  // rebuild leaks: cycle all 8 types three times; geometry and texture counts of each type must be the same every pass
  const types = ["mailer", "shipping", "tuck", "pillow", "gable", "rigid", "bag", "pouch"];
  const seen = {};
  for (let pass = 0; pass < 3; pass++) for (const t of types) {
    await c.ev(`document.querySelector('input[name=type][value=${t}]').click()`);
    await sleep(900);
    await c.waitFor("window.__film && window.__film.visible()", 15000);
    await sleep(250);
    const s = await c.ev(`(()=>({g:__film.renderer.info.memory.geometries, t:__film.renderer.info.memory.textures, p:__film.renderer.info.programs.length}))()`);
    (seen[t] ??= []).push(s);
  }
  await c.send("HeapProfiler.collectGarbage");
  const grew = Object.entries(seen).filter(([, l]) => l[2].g > l[0].g || l[2].t > l[0].t);
  ok(grew.length === 0, `24 rebuilds (8 types x 3): geometries and textures identical on pass 3 vs pass 1 for every type; programs ${seen.tuck.map((s) => s.p).join("->")}`);
  console.log("   " + Object.entries(seen).map(([t, l]) => `${t} ${l.map((s) => s.g + "/" + s.t).join(" ")}`).join(" | "));
  ok(errors.length === 0, "no uncaught errors" + (errors.length ? ": " + errors[0] : ""));
  c.kill();
}

/* 2 --- no WebGL: the dieline and summary still work */
{
  const { c, errors } = await open({}, "/configurator/?tier=none");
  await sleep(2500);
  const r = await c.ev(`({canvas: !!document.querySelector('canvas'), note: /3D preview is not available/.test(document.body.innerText), svg: !!document.querySelector('svg[aria-label*="dieline"] path'), dl: [...document.querySelectorAll('button')].some(b=>/Download SVG/.test(b.innerText)), sum: /Quote after review/.test(document.body.innerText), link: !!document.querySelector('a[href^="/quote/?cfg=1"]')})`);
  ok(!r.canvas && r.note && r.svg && r.dl && r.sum && r.link, `no WebGL (?tier=none): no canvas, a plain note, dieline + download + summary + Send to quote all there ${JSON.stringify(r)}`);
  await c.ev(`document.querySelector('input[name=type][value=bag]').click()`);
  await sleep(500);
  ok(/Paper bag/.test(await c.ev(`document.querySelector('#sum-h').parentElement.innerText`)), "the form still works without 3D");
  ok(errors.length === 0, "no uncaught errors without WebGL" + (errors.length ? ": " + errors[0] : ""));
  c.kill();
}

/* 3 --- reduced motion: loads, no damping, works */
{
  const { c, errors } = await open({ reduced: true });
  await c.waitFor(READY, 60000);
  await sleep(500);
  await c.ev(`document.querySelector('[aria-label^="3D preview"]').focus()`);
  const b = await c.ev(`(()=>{const p=__film.camera.position; return p.x})()`);
  await c.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
  await sleep(150); // with damping this would still be moving a second later; reduced motion jumps at once
  const a1 = await c.ev(`__film.camera.position.x`);
  await sleep(500);
  const a2 = await c.ev(`__film.camera.position.x`);
  ok(Math.abs(a1 - b) > 0.02 && Math.abs(a2 - a1) < 0.001, "reduced motion: the view changes at once, with no easing afterwards");
  ok(errors.length === 0, "no uncaught errors with reduced motion" + (errors.length ? ": " + errors[0] : ""));
  c.kill();
}
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
