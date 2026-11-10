// Tiny Chrome DevTools Protocol helper shared by the screenshot/measure scripts.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ width = 1440, height = 900, dpr = 1, mobile = false, cores } = {}) {
  const PORT = 9333 + Math.floor(Math.random() * 500);
  const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`,
    "--no-first-run", "--enable-unsafe-swiftshader", "--use-angle=metal", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"], { stdio: "ignore" });
  const kill = () => { try { chrome.kill(); } catch {} };
  process.on("exit", kill);
  let json;
  for (let i = 0; i < 60 && !json; i++) {
    try { json = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json(); } catch { await sleep(250); }
  }
  const ws = new WebSocket(json.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(); const listeners = new Map();
  const on = (method, cb) => { listeners.set(method, [...(listeners.get(method) ?? []), cb]); };
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method) (listeners.get(d.method) ?? []).forEach((cb) => cb(d.params)); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.j(new Error(d.error.message)) : p.r(d.result); } };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result.value; };
  const waitFor = async (expr, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(250); } return false; };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile });
  if (mobile) {
    await send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36" });
  }
  if (cores) await send("Emulation.setHardwareConcurrencyOverride", { hardwareConcurrency: cores });
  return { send, ev, waitFor, kill, on };
}
