#!/usr/bin/env node
// Configurator layout: scroll from top to bottom at 1440x900, 1024x768 and 390x844. At every step the sticky preview must not overlap the
// dieline section, the summary or the footer, must not sit under the header, and must be released when the options row ends.
// Saves frames (top, mid options, end of options row, dieline start, summary, footer) to docs/screenshots/pages-v1/configurator-fix/.
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const OUT = "docs/screenshots/pages-v1/configurator-fix"; mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const R = `JSON.stringify((()=>{const r=s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {t:b.top,b:b.bottom,l:b.left,r:b.right}};
  return {pv:r('.cfg-preview'), die:r('#die-h'), spec:r('.cfg-spec'), foot:r('footer'), form:r('form[aria-label="Box options"]'), sy:scrollY, H:innerHeight, W:innerWidth, over:document.documentElement.scrollWidth-document.documentElement.clientWidth, stuck:getComputedStyle(document.querySelector('.cfg-preview')).position}})())`;
const hit = (a, b) => a && b && a.t < b.b - 1 && a.b > b.t + 1 && a.l < b.r && a.r > b.l;
for (const [w, h, mobile] of [[1440, 900, false], [1024, 768, false], [390, 844, true]]) {
  const c = await launch(mobile ? { width: w, height: h, dpr: 2, mobile: true, cores: 4 } : { width: w, height: h });
  await c.send("Page.navigate", { url: "http://127.0.0.1:8080/configurator/" }); await sleep(5500);
  const tag = `${w}`;
  const total = await c.ev("document.documentElement.scrollHeight");
  const marks = JSON.parse(await c.ev(`JSON.stringify({form:(()=>{const b=document.querySelector('form[aria-label="Box options"]').getBoundingClientRect(); return [b.top+scrollY,b.bottom+scrollY]})(), die:document.getElementById('die-h').getBoundingClientRect().top+scrollY, spec:document.querySelector('.cfg-spec').getBoundingClientRect().top+scrollY})`));
  let overlap = 0, underHeader = 0, maxOver = 0, samples = 0;
  for (let y = 0; y <= total - h; y += 70) {
    await c.ev(`window.scrollTo(0,${y})`); await sleep(90);
    const s = JSON.parse(await c.ev(R)); samples++;
    maxOver = Math.max(maxOver, s.over);
    if (hit(s.pv, s.die) || hit(s.pv, s.spec) || hit(s.pv, s.foot)) overlap++;
    if (s.pv && s.form && s.form.b >= s.pv.b + 8 && s.pv.t > -5 && s.pv.t < 99) underHeader++; // pinned (the options row still extends below it) but too high
  }
  ok(overlap === 0, `${w}px: the preview never overlaps the dieline, the summary or the footer (${samples} scroll steps)`);
  ok(underHeader === 0, `${w}px: the preview never sits under the 100 px header`);
  ok(maxOver <= 0, `${w}px: no horizontal scroll`);
  const frames = [["1-top", 0], ["2-mid-options", (marks.form[0] + marks.form[1]) / 2 - h / 2], ["3-end-of-options-row", marks.form[1] - h + 120], ["4-dieline-start", marks.die - 130], ["5-summary", marks.spec - 120], ["6-footer", total - h]];
  for (const [name, y] of frames) {
    await c.ev(`window.scrollTo(0,${Math.max(0, Math.round(y))})`); await sleep(900);
    writeFileSync(`${OUT}/${tag}-${name}.jpg`, Buffer.from((await c.send("Page.captureScreenshot", { format: "jpeg", quality: 80 })).data, "base64"));
  }
  // released: once the form row has ended, the preview has scrolled away with it
  await c.ev(`window.scrollTo(0,${Math.round(marks.die - 60)})`); await sleep(700);
  const e = JSON.parse(await c.ev(R));
  ok(e.pv.b <= e.die.t, `${w}px: at the dieline the preview has been released and sits above it (preview bottom ${Math.round(e.pv.b)}, dieline top ${Math.round(e.die.t)})`);
  c.kill();
}
console.log(fails ? `${fails} FAILED` : "all passed"); process.exit(fails ? 1 : 0);
