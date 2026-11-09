// node scripts/quick-shot.mjs <url> <out.jpg> [scrollY] [--mobile]
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { launch, sleep } from "./lib/cdp.mjs";
const [url, out, y = "0"] = process.argv.slice(2);
const mobile = process.argv.includes("--mobile");
const c = await launch(mobile ? { width: 412, height: 915, dpr: 2, mobile: true, cores: 4 } : {});
await c.send("Page.navigate", { url });
await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')");
await sleep(1200);
await c.ev(`window.scrollTo(0, ${Number(y)})`); await sleep(1800);
const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, Buffer.from(data, "base64"));
console.log("saved", out); c.kill(); process.exit(0);
