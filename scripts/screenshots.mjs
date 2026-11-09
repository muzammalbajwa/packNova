#!/usr/bin/env node
// Saves desktop + mobile screenshots of every section and the configurator to docs/screenshots/.
// Usage: node scripts/screenshots.mjs --base http://localhost:8080
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://localhost:8080");
const PORT = 9333 + Math.floor(Math.random() * 500);
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "shots-"))}`,
  "--no-first-run", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"], { stdio: "ignore" });
process.on("exit", () => { try { chrome.kill(); } catch {} });

async function getJson(path, method = "GET") {
  for (let i = 0; i < 60; i++) { try { return await (await fetch(`http://127.0.0.1:${PORT}${path}`, { method })).json(); } catch { await sleep(250); } }
  throw new Error("Chrome did not start");
}
const target = await getJson("/json/new?about:blank", "PUT");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.j(new Error(d.error.message)) : p.r(d.result); } };
const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value; };
const waitFor = async (expr, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(300); } return false; };

await send("Page.enable"); await send("Runtime.enable");

async function shot(dir, name) {
  const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
  mkdirSync(`docs/screenshots/${dir}`, { recursive: true });
  writeFileSync(`docs/screenshots/${dir}/${name}.jpg`, Buffer.from(data, "base64"));
  console.log("saved", dir, name);
}
const scrollTo = async (y, settle = 1800) => { await ev(`window.scrollTo(0, ${y})`); await sleep(settle); };
const setVal = `const setVal=(el,v)=>{const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}));};`;

for (const mode of ["desktop", "mobile"]) {
  if (mode === "desktop") {
    await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  } else {
    await send("Emulation.setDeviceMetricsOverride", { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36" });
    await send("Emulation.setHardwareConcurrencyOverride", { hardwareConcurrency: 4 }); // classified as the "low" tier, like many mid-range phones
  }

  await send("Page.navigate", { url: `${BASE}/` });
  await waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')");
  await sleep(1500);
  const g = JSON.parse(await ev(`JSON.stringify((()=>{const vh=innerHeight; const hero=document.getElementById('top'); const story=document.getElementById('story');
    return { vh, heroEnd: hero.offsetHeight - vh, sTop: story.offsetTop, sLen: story.offsetHeight - vh, marquee: document.querySelector('main > div[aria-hidden]').getBoundingClientRect().top + scrollY,
      products: document.getElementById('products').offsetTop, process: document.getElementById('process').offsetTop, conf: document.getElementById('configurator').offsetTop, quote: document.getElementById('quote').offsetTop, h: document.documentElement.scrollHeight }; })())`));

  await shot(mode, "01-hero-closed");
  await scrollTo(g.heroEnd * 0.95);
  await shot(mode, "02-hero-open");
  await scrollTo(g.marquee - g.vh * 0.35);
  await shot(mode, "03-marquee");
  await scrollTo(g.products - 20, 2600);
  await shot(mode, "04-products-top");
  await scrollTo(g.products + g.vh * 0.9, 2600);
  await shot(mode, "05-products-more");
  for (const [i, [name, p]] of [["design", 0.15], ["print", 0.5], ["deliver", 0.9]].entries()) {
    await scrollTo(g.sTop + g.sLen * p, 2200);
    await shot(mode, `0${6 + i}-story-${name}`);
  }
  await scrollTo(g.process - 40, 2600);
  await shot(mode, "09-process");
  await scrollTo(g.conf - 40, 2600);
  await shot(mode, "10-configurator-teaser");
  await scrollTo(g.quote - 30, 2600);
  await shot(mode, "11-quote");
  await scrollTo(g.h, 2200);
  await shot(mode, "12-footer");

  /* configurator */
  await send("Page.navigate", { url: `${BASE}/configurator/?type=carton&l=40&w=30&h=25&m=kraft&q=1000` });
  await waitFor("window.__r3f && document.querySelector('canvas')");
  await sleep(1500);
  await shot(mode, "13-configurator-default");
  await ev(`(async()=>{ ${setVal} const tab=n=>[...document.querySelectorAll('[role=tab]')].find(b=>b.textContent.trim().startsWith(n)); tab('Front').click(); await new Promise(r=>setTimeout(r,200));
    setVal(document.querySelector('textarea'),'PackNova\\nBEST BOX'); const c=[...document.querySelectorAll('input[type=color]')]; setVal(c[0],'#ffffff'); setVal(c[1],'#1f3a6e');
    tab('Top').click(); await new Promise(r=>setTimeout(r,200)); setVal(document.querySelector('textarea'),'THIS SIDE UP'); setVal([...document.querySelectorAll('input[type=color]')][0],'#ffffff'); setVal([...document.querySelectorAll('input[type=color]')][1],'#c0392b'); return 1; })()`);
  await sleep(2500);
  await shot(mode, "14-configurator-artwork");
  await ev(`[...document.querySelectorAll('button')].find(b=>/^Open$/.test(b.textContent.trim()))?.click(); 1`);
  await sleep(2500);
  await shot(mode, "15-configurator-open");
  await send("Page.navigate", { url: `${BASE}/configurator/?type=pouch&m=white` });
  await waitFor("window.__r3f && document.querySelector('canvas')");
  await sleep(1500);
  await ev(`(()=>{ ${setVal} setVal(document.querySelector('textarea'),'COFFEE\\nBEANS'); setVal([...document.querySelectorAll('input[type=color]')][0],'#222222'); return 1; })()`);
  await sleep(2000);
  await shot(mode, "16-configurator-pouch");
}
chrome.kill();
process.exit(0);
