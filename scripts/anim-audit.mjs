#!/usr/bin/env node
// Animation-quality audit: for the homepage film, one page per recipe, an event page and the configurator, at 1440x900 and 390x844:
//  - a contact sheet of 12 progress points (stills),
//  - frame sequences across transitions (motion): 10 frames between two close progress values.
// Frames are written to a temp dir and assembled into sheets with Python (PIL). node scripts/anim-audit.mjs --tag before|after [--only home,rigid] [--widths 1440,390]
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const TAG = arg("tag", "before"), OUT = `docs/screenshots/pages-v1/animation-quality/${TAG}`, TMP = `/tmp/anim-audit-${TAG}`;
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });
const ONLY = (arg("only", "")).split(",").filter(Boolean), WIDTHS = arg("widths", "1440,390").split(",").map(Number);
const TARGETS = [
  { id: "home", path: "/", sec: "#making", ready: "window.__glMaking && window.__makingSet", stills: [0.03, 0.1, 0.2, 0.3, 0.4, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9, 0.98], trans: [[0.19, 0.27], [0.5, 0.58], [0.72, 0.8]] },
  { id: "rigid", path: "/material/rigid-boxes/", film: 1 }, { id: "corrugated", path: "/material/corrugated-boxes/", film: 1 }, { id: "folding", path: "/shape-and-style/tuck-boxes/", film: 1 },
  { id: "paper-bag", path: "/shape-and-style/paper-bags/", film: 1 }, { id: "pouch", path: "/industry/mylar-bags/", film: 1 }, { id: "label-tag", path: "/shape-and-style/hang-tags/", film: 1 },
  { id: "tray-sleeve", path: "/shape-and-style/trays-and-sleeves/", film: 1 }, { id: "event", path: "/event/halloween/", film: 1 },
  { id: "configurator", path: "/configurator/", cfg: 1 },
];
for (const t of TARGETS) if (t.film) Object.assign(t, { sec: "#how", ready: "window.__film && document.querySelector('#how canvas')", stills: [0.03, 0.1, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81, 0.9, 0.98], trans: [[0.2, 0.3], [0.52, 0.62]] });
const sheet = (name, files, cols, w) => execFileSync("python3", ["-c", `
import sys
from PIL import Image
fs=sys.argv[3:]; cols=int(sys.argv[1]); w=int(sys.argv[2])
ims=[Image.open(f).convert('RGB') for f in fs]; h=int(w*ims[0].height/ims[0].width); rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(cols*w+(cols+1)*3,rows*h+(rows+1)*3),(30,30,30))
for i,im in enumerate(ims): s.paste(im.resize((w,h)),(3+(i%cols)*(w+3),3+(i//cols)*(h+3)))
s.save('${name}')`, String(cols), String(w), ...files]);
for (const w of WIDTHS) {
  const mobile = w < 600;
  const c = await launch(mobile ? { width: 390, height: 844, dpr: 1, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
  for (const t of TARGETS) {
    if (ONLY.length && !ONLY.includes(t.id)) continue;
    await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + t.path }); await sleep(2500);
    const shot = async (f, clip) => writeFileSync(f, Buffer.from((await c.send("Page.captureScreenshot", { format: "jpeg", quality: 72, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })).data, "base64"));
    const tag = `${t.id}-${w}`;
    if (t.cfg) {
      await c.waitFor("document.getElementById('fold')", 30000); await sleep(2500);
      await c.ev("window.scrollTo(0, 0)");
      const set = (v) => c.ev(`(()=>{const el=document.getElementById('fold'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el, ${v}); el.dispatchEvent(new Event('input',{bubbles:true}))})()`);
      const clip = JSON.parse(await c.ev(`JSON.stringify((()=>{const b=document.querySelector('.cfg-panel').getBoundingClientRect(); return {x:b.x,y:b.y+scrollY,width:b.width,height:b.height}})())`));
      const files = [];
      for (let i = 0; i < 12; i++) { await set(i / 11); await sleep(550); const f = `${TMP}/${tag}-s${i}.jpg`; await shot(f, clip); files.push(f); }
      sheet(`${OUT}/${tag}-stills.png`, files, 4, mobile ? 200 : 360);
      const tf = [];
      for (let i = 0; i < 10; i++) { await set(0.3 + (0.4 * i) / 9); await sleep(260); const f = `${TMP}/${tag}-t${i}.jpg`; await shot(f, clip); tf.push(f); }
      sheet(`${OUT}/${tag}-transition-fold.png`, tf, 5, mobile ? 160 : 300);
      continue;
    }
    await c.waitFor(t.ready, 60000); await sleep(1500);
    const at = async (p) => { const y = await c.ev(`(()=>{const el=document.querySelector('${t.sec}');const top=el.getBoundingClientRect().top+scrollY;return top+(el.offsetHeight-innerHeight)*${p};})()`); await c.ev(`window.scrollTo(0, ${y})`); };
    const files = [];
    for (let i = 0; i < t.stills.length; i++) { await at(t.stills[i]); await sleep(750); const f = `${TMP}/${tag}-s${i}.jpg`; await shot(f); files.push(f); }
    sheet(`${OUT}/${tag}-stills.png`, files, 4, mobile ? 230 : 470);
    for (const [k, [a, b]] of t.trans.entries()) {
      const tf = [];
      for (let i = 0; i < 10; i++) { await at(a + ((b - a) * i) / 9); await sleep(i === 0 ? 900 : 330); const f = `${TMP}/${tag}-t${k}-${i}.jpg`; await shot(f); tf.push(f); }
      sheet(`${OUT}/${tag}-transition-${k + 1}-${a}-${b}.png`, tf, 5, mobile ? 150 : 290);
    }
    console.log("done", tag);
  }
  c.kill();
}
process.exit(0);
