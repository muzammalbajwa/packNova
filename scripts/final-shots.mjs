#!/usr/bin/env node
// Screenshots for docs/screenshots/pages-v1/final/: one page per recipe (contact sheet over the film), the configurator, quote and contact pages.
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, sleep } from "./lib/cdp.mjs";
const OUT = "docs/screenshots/pages-v1/final";
mkdirSync(OUT, { recursive: true });
const pages = ["/material/rigid-boxes/", "/material/corrugated-boxes/", "/shape-and-style/tuck-boxes/", "/shape-and-style/paper-bags/", "/industry/mylar-bags/", "/shape-and-style/hang-tags/", "/shape-and-style/trays-and-sleeves/"];
for (const mode of ["desktop", "mobile"]) execFileSync("node", ["scripts/film-shots.mjs", "--paths", pages.join(","), "--points", "0.1,0.35,0.6,0.85,1", "--sheet", "1", "--mode", mode, "--out", `${OUT}/film-${mode}`], { stdio: "inherit" });
for (const [mobile, tag] of [[false, "1440"], [true, "390"]]) {
  const c = await launch(mobile ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900 });
  for (const [name, url] of [["configurator", "/configurator/"], ["quote", "/quote/"], ["contact", "/contact/"], ["home", "/"], ["privacy", "/privacy/"]]) {
    await c.send("Page.navigate", { url: "http://127.0.0.1:8080" + url }); await sleep(name === "configurator" || name === "home" ? 6000 : 2500);
    const { data } = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: name !== "home", ...(name === "home" ? {} : {}) });
    writeFileSync(`${OUT}/${name}-${tag}.png`, Buffer.from(data, "base64"));
    console.log(`${OUT}/${name}-${tag}.png`);
  }
  c.kill();
}
process.exit(0);
