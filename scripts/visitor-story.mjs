#!/usr/bin/env node
// A phone visitor, not a test harness (no eager flag): the story canvas must NOT exist right after load (that is the speed gain),
// must appear after the first scroll, finish its sliced build, and then draw the story (a mesh in view, no empty frames).
// node scripts/visitor-story.mjs [--mode mobile|desktop]
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const MOBILE = arg("mode", "mobile") === "mobile";
let fails = 0; const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const c = await launch(MOBILE ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4, eager: false } : { width: 1440, height: 900, eager: false });
await c.send("Page.navigate", { url: "http://127.0.0.1:8080/" + (MOBILE ? "" : "?tier=mid") });
await c.waitFor("window.__appStore && window.__appStore.getState().ready", 60000);
await sleep(4000);
ok(!(await c.ev("!!window.__glMaking")), "after load, before any input: the story canvas is not created yet");
ok(await c.ev("!!document.querySelector('#top img')"), "the hero poster is on screen");
// first input: a touch-style scroll
await c.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 200, y: 400, deltaX: 0, deltaY: 120 });
await c.waitFor("!!window.__glMaking", 20000);
ok(true, "first scroll: the story canvas is created");
const t0 = Date.now();
await c.waitFor("window.__makingR3F && (()=>{let n=0; window.__makingR3F.scene.traverse(()=>n++); return n})() > 150", 60000);
console.log(`      built and mounted ${Math.round((Date.now() - t0) / 100) / 10} s after the canvas appeared`);
const scenes = await c.ev("(()=>{let n=0; window.__makingR3F.scene.traverse(()=>n++); return n})()");
ok(scenes > 150, `the whole journey is in the scene (${scenes} objects; 176 when built eagerly)`);
// jump to the first, a middle and the last stage and check something is drawn
for (const p of [0.02, 0.3, 0.64, 0.8, 0.99]) {
  await c.ev(`window.__makingSet(${p})`); await sleep(500);
  const vis = await c.ev("window.__makingVisible && window.__makingVisible()");
  ok(vis, `progress ${p}: a stage object is inside the camera frame`);
}
c.kill(); console.log(fails ? `${fails} FAILED` : "all passed"); process.exit(fails ? 1 : 0);
