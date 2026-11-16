#!/usr/bin/env node
// Audit of the FIRST VIEWPORT (no scrolling) of every page type at 1440x900 and 390x844: screenshot, the biggest empty rectangle (as a share of
// the viewport, header excluded), whether a live canvas is on screen, and whether something is drawn while the page idles.
// node scripts/first-view.mjs [--out docs/screenshots/pages-v1/first-view]   (site on :8080)
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const OUT = arg("out", "docs/screenshots/pages-v1/first-view");
mkdirSync(OUT, { recursive: true });
const PAGES = [
  ["home", "/"], ["hub-industry", "/industry/"], ["hub-shape-and-style", "/shape-and-style/"], ["hub-material", "/material/"], ["hub-event", "/event/"],
  ["recipe-rigid", "/material/rigid-boxes/"], ["recipe-corrugated", "/material/corrugated-boxes/"], ["recipe-folding", "/shape-and-style/tuck-boxes/"], ["recipe-paper-bag", "/shape-and-style/paper-bags/"],
  ["recipe-pouch", "/industry/mylar-bags/"], ["recipe-label-tag", "/shape-and-style/hang-tags/"], ["recipe-tray-sleeve", "/shape-and-style/trays-and-sleeves/"], ["event-halloween", "/event/halloween/"],
  ["configurator", "/configurator/"], ["quote", "/quote/"], ["contact", "/contact/"], ["privacy", "/privacy/"], ["404", "/no-such-page/"],
];
// largest empty rectangle (rows x cols of 20px cells that hold no content) below the header, as % of the viewport
const ANALYSE = `(async (b64, headerPx) => {
  const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b64; });
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const W = img.width, H = img.height, S = Math.round(img.width / 72);
  const bgd = g.getImageData(Math.round(W * 0.5), Math.round(H * 0.97), 1, 1).data; // a spot of plain page background near the bottom edge, middle
  const bg = [245, 240, 230];
  const cols = Math.floor(W / S), rows = Math.floor(H / S), top = Math.ceil(headerPx * (W / innerWidth) / S);
  const px = g.getImageData(0, 0, W, H).data;
  const full = (c, r) => { for (let y = r * S; y < r * S + S; y += 2) for (let x = c * S; x < c * S + S; x += 2) { const i = (y * W + x) * 4; if (Math.abs(px[i] - bg[0]) > 14 || Math.abs(px[i + 1] - bg[1]) > 14 || Math.abs(px[i + 2] - bg[2]) > 14) return false; } return true; };
  const empty = []; for (let r = top; r < rows; r++) { const row = []; for (let c = 0; c < cols; c++) row.push(full(c, r)); empty.push(row); }
  // maximal rectangle in a binary matrix
  const h = new Array(cols).fill(0); let best = 0;
  for (const row of empty) { for (let c = 0; c < cols; c++) h[c] = row[c] ? h[c] + 1 : 0; const st = []; for (let c = 0; c <= cols; c++) { const cur = c === cols ? 0 : h[c]; while (st.length && h[st[st.length - 1]] >= cur) { const hh = h[st.pop()]; const left = st.length ? st[st.length - 1] + 1 : 0; best = Math.max(best, hh * (c - left)); } st.push(c); } }
  const total = cols * (rows - top);
  return { maxEmptyRectPct: +(100 * best / total).toFixed(1), emptyCellsPct: +(100 * empty.flat().filter(Boolean).length / total).toFixed(1) };
})`;
const rows = [];
for (const [mobile, tag] of [[false, "1440"], [true, "390"]]) {
  const c = await launch(mobile ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900 });
  for (const [name, url] of PAGES) {
    await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + url });
    await sleep(url === "/" || url === "/configurator/" ? 6500 : 5000);
    const live = await c.ev(`(()=>{ const f=window.__film, g=window.__gl; const r=(x)=>x?x.info.render.frame:-1; return {a:r(f&&f.renderer), b:r(g)}; })()`);
    await sleep(1000);
    const live2 = await c.ev(`(()=>{ const f=window.__film, g=window.__gl; const r=(x)=>x?x.info.render.frame:-1; return {a:r(f&&f.renderer), b:r(g)}; })()`);
    const canvasOnScreen = await c.ev(`[...document.querySelectorAll('canvas')].some(cv=>{const q=cv.getBoundingClientRect(); return q.width>150&&q.height>150&&q.bottom>100&&q.top<innerHeight&&getComputedStyle(cv.parentElement).opacity!=='0'})`);
    const { data } = await c.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${OUT}/${name}-${tag}.png`, Buffer.from(data, "base64"));
    const m = await c.ev(`${ANALYSE}(${JSON.stringify(data)}, ${mobile ? 100 : 100})`);
    rows.push({ page: name, viewport: tag, ...m, canvasOnScreen, framesWhileIdle: Math.max(live2.a - live.a, live2.b - live.b) });
    console.log(`${name.padEnd(22)} ${tag.padStart(4)}  empty rect ${String(m.maxEmptyRectPct).padStart(5)}%  empty cells ${String(m.emptyCellsPct).padStart(5)}%  canvas on screen ${String(canvasOnScreen).padEnd(5)}  frames drawn in 1 s idle ${Math.max(live2.a - live.a, live2.b - live.b)}`);
  }
  c.kill();
}
writeFileSync(`${OUT}/metrics.json`, JSON.stringify(rows, null, 1));
process.exit(0);
