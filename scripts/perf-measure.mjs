#!/usr/bin/env node
// Measures the production export in a real Chrome via the DevTools protocol (no extra packages).
// Usage: node scripts/perf-measure.mjs --base http://localhost:8080 [--cpu 1|4|6] [--net none|slow4g]
//                                       [--mobile] [--tier low|mid|high|none] [--label name]
// Run `npm run build && npm run serve:out` first, and run it on a QUIET machine (load average < 4).
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir, loadavg } from "node:os";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : (process.argv[i + 1]?.startsWith("--") || i + 1 >= process.argv.length ? true : process.argv[i + 1]); };
const BASE = arg("base", "http://localhost:8080");
const CPU = Number(arg("cpu", 1));
const NET = arg("net", "none");
const MOBILE = arg("mobile", false) === true;
const TIER = arg("tier", null);
const LABEL = arg("label", `cpu${CPU}-${NET}${MOBILE ? "-mobile" : ""}`);
const PORT = 9333 + Math.floor(Math.random() * 500);
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "perf-chrome-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run",
  "--no-default-browser-check", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
  "--disable-backgrounding-occluded-windows", "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });
const cleanup = () => { try { chrome.kill(); } catch {} };
process.on("exit", cleanup);

async function jsonGet(path, method = "GET") {
  for (let i = 0; i < 60; i++) {
    try { return await (await fetch(`http://127.0.0.1:${PORT}${path}`, { method })).json(); } catch { await sleep(250); }
  }
  throw new Error("Chrome did not start");
}

async function connect() {
  const target = await jsonGet("/json/new?about:blank", "PUT");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const { r, j } = pending.get(d.id); pending.delete(d.id); d.error ? j(new Error(d.error.message)) : r(d.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "eval failed"); return r.result.value; };
  return { send, evaluate };
}

const INIT = `
window.__perf = { paints: {}, lcp: 0, seenLoader: false };
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__perf.paints[e.name] = e.startTime; }).observe({ type: 'paint', buffered: true });
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
(function poll() {
  const p = window.__perf;
  const loader = document.querySelector('[role=status]');
  if (loader) p.seenLoader = true;
  if (window.__r3f && !p.r3f) p.r3f = performance.now();
  if (p.seenLoader && !loader && !p.loaderGone) p.loaderGone = performance.now();
  if (window.__r3f && p.loaderGone && document.querySelector('canvas') && !p.scene) p.scene = performance.now();
  requestAnimationFrame(poll);
})();`;

const STATS = `
window.__stats = (d) => { d = d.slice(3).sort((a, b) => a - b); const q = p => d[Math.min(d.length - 1, Math.floor(d.length * p))]; const mean = d.reduce((a, b) => a + b, 0) / d.length;
  return { frames: d.length, avgFps: +(1000 / mean).toFixed(1), p50: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), p99: +q(.99).toFixed(1), max: +d[d.length - 1].toFixed(1), over33ms: d.filter(x => x > 33.4).length }; };
window.__scrollRun = (from, to, ms) => new Promise(res => { const d = []; let last = performance.now(); const start = last; let calls = 0;
  (function f(now) { d.push(now - last); last = now; const t = Math.min(1, (now - start) / ms); window.scrollTo(0, from + (to - from) * t);
    const gl = window.__gl; if (gl) calls = Math.max(calls, gl.info.render.calls);
    if (t < 1) requestAnimationFrame(f); else res({ ...window.__stats(d), maxDrawCalls: calls }); })(last); });`;

async function newPage(cdp, url) {
  await cdp.send("Page.navigate", { url });
}

async function waitFor(cdp, expr, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (await cdp.evaluate(expr)) return true; } catch {} await sleep(300); }
  return false;
}

const result = { label: LABEL, base: BASE, cpuSlowdown: CPU, network: NET, mobile: MOBILE, forcedTier: TIER, loadAvgAtStart: +loadavg()[0].toFixed(2) };

try {
  const cdp = await connect();
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: INIT + STATS });
  if (CPU > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  if (NET === "slow4g") await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  if (MOBILE) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await cdp.send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36" });
    await cdp.send("Emulation.setHardwareConcurrencyOverride", { hardwareConcurrency: 4 });
  } else {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  }
  const q = TIER ? `?tier=${TIER}` : "";

  /* ---- home: load timing ---- */
  await newPage(cdp, `${BASE}/${q}`);
  const ok = await waitFor(cdp, "window.__perf && (window.__perf.scene || (window.__perf.loaderGone && !document.querySelector('canvas')))", 90000);
  const perf = await cdp.evaluate("JSON.stringify(window.__perf)");
  const p = JSON.parse(perf);
  const r1 = (v) => (v == null ? null : Math.round(v));
  result.gpu = await cdp.evaluate("(()=>{const c=document.createElement('canvas');const g=c.getContext('webgl');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'no webgl'})()");
  result.tier = await cdp.evaluate("document.querySelector('#top') ? 'n/a' : 'n/a'");
  result.load = { firstPaintMs: r1(p.paints["first-paint"]), firstContentfulPaintMs: r1(p.paints["first-contentful-paint"]), lcpMs: r1(p.lcp), threeInitMs: r1(p.r3f), loaderGoneMs: r1(p.loaderGone), sceneVisibleMs: r1(p.scene), completed: ok };
  result.transferKB = await cdp.evaluate("Math.round(performance.getEntriesByType('resource').reduce((a,e)=>a+(e.transferSize||0),0)/1024) + (Math.round((performance.getEntriesByType('navigation')[0]||{}).transferSize/1024)||0)");

  /* ---- home: frame stats per scene ---- */
  await sleep(800);
  const geo = JSON.parse(await cdp.evaluate(`JSON.stringify((()=>{ const vh = innerHeight; const hero = document.getElementById('top'); const story = document.getElementById('story');
    const heroEnd = hero.offsetHeight - vh; const sTop = story.offsetTop; const sLen = story.offsetHeight - vh; return { heroEnd, sTop, sLen }; })())`));
  const run = (a, b, ms) => cdp.evaluate(`window.__scrollRun(${a}, ${b}, ${ms})`);
  result.hero = await run(0, geo.heroEnd, 5000);
  await sleep(300);
  result.storyDesign = await run(geo.sTop, geo.sTop + geo.sLen * 0.33, 4000);
  result.storyPrint = await run(geo.sTop + geo.sLen * 0.34, geo.sTop + geo.sLen * 0.66, 4000);
  result.storyDeliver = await run(geo.sTop + geo.sLen * 0.67, geo.sTop + geo.sLen, 4000);

  /* ---- configurator ---- */
  await newPage(cdp, `${BASE}/configurator/?type=carton${TIER ? `&tier=${TIER}` : ""}`);
  await waitFor(cdp, "window.__r3f && document.querySelector('canvas')", 90000);
  await sleep(1500);
  result.configurator = JSON.parse(await cdp.evaluate(`(async () => {
    const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    const ranges = [...document.querySelectorAll('input[type=range]')];
    const d = []; let last = performance.now(); const start = last; let calls = 0, i = 0, toggled = false;
    await new Promise(res => (function f(now) { d.push(now - last); last = now; const t = now - start;
      if (t > 3000 && !toggled) { toggled = true; [...document.querySelectorAll('button')].find(b => /^Open$/.test(b.textContent.trim()))?.click(); }
      if (t > 1000 && Math.floor(t / 250) > i) { i = Math.floor(t / 250); set(ranges[i % 3], String(20 + ((i * 9) % 40))); }
      const gl = window.__gl; if (gl) calls = Math.max(calls, gl.info.render.calls);
      if (t < 7000) requestAnimationFrame(f); else res(); })(last));
    return JSON.stringify({ ...window.__stats(d), maxDrawCalls: calls, note: '7s: auto-rotate, slider changes every 250ms from 1s, Open at 3s' }); })()`));
  result.loadAvgAtEnd = +loadavg()[0].toFixed(2);
} catch (e) {
  result.error = String(e);
} finally {
  cleanup();
}

mkdirSync("docs/perf", { recursive: true });
writeFileSync(`docs/perf/${LABEL}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(0);
