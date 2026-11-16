#!/usr/bin/env node
// Forces a WebGL context loss (and later a restore) on a film page, the configurator and the homepage, and checks that the poster
// comes back, nothing throws, and the 3D draws again. Also checks that device tiers lower the load.
// node scripts/context-loss-test.mjs
import { launch, sleep } from "./lib/cdp.mjs";
const BASE = "http://127.0.0.1:8080";
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const lose = (expr) => `(()=>{ const gl=${expr}.getContext(); const x=gl.getExtension('WEBGL_lose_context'); window.__x=x; x.loseContext(); return gl.isContextLost(); })()`;

async function film(path, hostSel, label) {
  const c = await launch({ width: 1440, height: 900 });
  const errs = [];
  c.on("Runtime.exceptionThrown", (e) => errs.push(e.exceptionDetails.exception?.description?.slice(0, 150) ?? "exception"));
  await c.send("Page.navigate", { url: BASE + path });
  await c.waitFor(`window.__film && document.querySelector('${hostSel}') && getComputedStyle(document.querySelector('${hostSel}')).opacity === '1'`, 60000);
  await sleep(600);
  const before = await c.ev("window.__film.renderer.info.render.calls");
  await c.ev(lose("window.__film.renderer"));
  await sleep(700);
  ok(await c.ev(`getComputedStyle(document.querySelector('${hostSel}')).opacity === '0'`), `${label}: context lost -> the poster is shown again (3D area hidden)`);
  await c.ev("window.__film.set(0.5)"); // scrolling while the context is gone must not throw
  await sleep(300);
  await c.ev("window.__x.restoreContext()");
  await c.waitFor(`getComputedStyle(document.querySelector('${hostSel}')).opacity === '1'`, 10000);
  await sleep(500);
  const r = await c.ev("({calls: window.__film.renderer.info.render.calls, visible: window.__film.visible(), lost: window.__film.renderer.getContext().isContextLost()})");
  ok(!r.lost && r.calls > 0 && r.visible, `${label}: context restored -> 3D drawn again (${r.calls} draw calls, something in view)`);
  ok(errs.length === 0, `${label}: no uncaught errors` + (errs.length ? ": " + errs[0] : ""));
  c.kill();
  void before;
}
await film("/material/rigid-boxes/", "#how div.absolute.inset-0:last-child", "film page");
await film("/configurator/", "[aria-label^=\"3D preview\"]", "configurator");

// homepage hero canvas
{
  const c = await launch({ width: 1440, height: 900 });
  const errs = [];
  c.on("Runtime.exceptionThrown", (e) => errs.push(e.exceptionDetails.exception?.description?.slice(0, 150) ?? "exception"));
  await c.send("Page.navigate", { url: BASE + "/" });
  await c.waitFor("window.__gl", 60000);
  await sleep(5000);
  const poster = "(()=>{const im=document.querySelector('img[fetchpriority=high]'); return im ? getComputedStyle(im).opacity : null})()";
  const hidden0 = await c.ev(poster);
  await c.ev(lose("window.__gl"));
  await sleep(900);
  const shown = await c.ev(poster);
  ok(hidden0 === "0" && shown === "1", `homepage: context lost -> the hero poster fades back in (opacity ${hidden0} -> ${shown})`);
  await c.ev("window.__x.restoreContext()");
  await sleep(2500);
  const after = await c.ev(`({opacity: ${poster}, lost: window.__gl.getContext().isContextLost(), calls: window.__gl.info.render.calls})`);
  ok(after.opacity === "0" && !after.lost, `homepage: context restored -> the poster hides again and the canvas is live (${JSON.stringify(after)})`);
  await c.ev(lose("window.__glMaking")).catch(() => {});
  ok(errs.length === 0, "homepage: no uncaught errors" + (errs.length ? ": " + errs[0] : ""));
  c.kill();
}

// device tiers: lower pixel ratio on low, and a film page with ?tier=none has no canvas at all
{
  const probe = async (tier, path, expr) => {
    const c = await launch({ width: 1440, height: 900, dpr: 2 });
    await c.send("Page.navigate", { url: BASE + path + (tier ? `?tier=${tier}` : "") });
    await sleep(5000);
    const v = await c.ev(expr);
    c.kill();
    return v;
  };
  const dpr = async (tier) => probe(tier, "/material/rigid-boxes/", "window.__film ? window.__film.renderer.getPixelRatio() : null");
  const hi = await dpr("high"), lo = await dpr("low"), none = await probe("none", "/material/rigid-boxes/", "!!document.querySelector('#how canvas')");
  ok(lo !== null && hi !== null && lo < hi && lo <= 1.25, `tiers: pixel ratio on a 2x screen: high ${hi}, low ${lo}`);
  ok(none === false, "tiers: ?tier=none (no WebGL) shows no canvas, the step list instead");
  const homeDpr = async (tier) => probe(tier, "/", "window.__gl ? window.__gl.getPixelRatio() : null");
  const [hh, hl] = [await homeDpr("high"), await homeDpr("low")];
  ok(hl !== null && hh !== null && hl < hh, `tiers: homepage pixel ratio high ${hh}, low ${hl}`);
  const conf = async (tier) => probe(tier, "/event/halloween/", "(()=>{ let n=0; window.__film?.scene.traverse(o=>{ if(o.isInstancedMesh) n+=o.count }); return n })()");
  const [ph, pl] = [await conf("high"), await conf("low")];
  ok(pl < ph, `tiers: instanced seasonal props on Halloween: high ${ph}, low ${pl}`);
}
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
