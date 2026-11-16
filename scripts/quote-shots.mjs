#!/usr/bin/env node
// Screenshots of every quote step, the validation errors, the review step and the contact page at 1440 and 390 px.
// node scripts/quote-shots.mjs [--out docs/screenshots/pages-v1/phase5]
import { mkdirSync, writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:8080");
const OUT = arg("out", "docs/screenshots/pages-v1/phase5");
mkdirSync(OUT, { recursive: true });
for (const mobile of [false, true]) {
  const tag = mobile ? "390" : "1440";
  const c = await launch(mobile ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900 });
  const shot = async (name, full = false) => {
    const { data } = await c.send("Page.captureScreenshot", full ? { format: "png", captureBeyondViewport: true } : { format: "png" });
    writeFileSync(`${OUT}/${name}-${tag}.png`, Buffer.from(data, "base64"));
    console.log(`${OUT}/${name}-${tag}.png`);
  };
  const val = (sel, v) => c.ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); const P=el instanceof HTMLSelectElement?HTMLSelectElement:el instanceof HTMLTextAreaElement?HTMLTextAreaElement:HTMLInputElement; Object.getOwnPropertyDescriptor(P.prototype,'value').set.call(el,${JSON.stringify(v)}); el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}));})()`);
  const next = async () => { await c.ev("document.querySelector('form button[type=submit]').click()"); await sleep(500); };
  const focusForm = () => c.ev("document.getElementById('q-heading').scrollIntoView({block:'start'}); window.scrollBy(0,-110)");
  await c.send("Page.navigate", { url: BASE + "/quote/?product=Rigid%20Boxes" }); await sleep(1800);
  await focusForm(); await shot("quote-1-product");
  await val("#q-product", ""); await next(); await focusForm(); await shot("quote-1-product-error");
  await val("#q-product", "Rigid Boxes"); await val("#q-l", "20"); await val("#q-w", "15"); await val("#q-h", "8"); await next();
  await focusForm(); await shot("quote-2-material");
  await val("#q-material", "Rigid, wrapped"); await val("#q-quantity", "1000"); await next();
  await focusForm(); await shot("quote-3-artwork");
  await val("#q-artwork", "I have a logo as a PDF. I need the lid printed in gold."); await next();
  await focusForm(); await shot("quote-4-details");
  await next(); await focusForm(); await shot("quote-4-details-errors");
  await val("#q-name", "Ayesha Khan"); await val("#q-phone", "0300 123 4567"); await val("#q-email", "ayesha@example.pk"); await val("#q-city", "Lahore"); await val("#q-country", "Pakistan"); await next();
  await c.waitFor("[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='Send on WhatsApp')", 8000); await sleep(400);
  await focusForm(); await shot("quote-5-review"); await shot("quote-5-review-full", true);
  await c.send("Page.navigate", { url: BASE + "/contact/" }); await sleep(1800);
  await shot("contact-top"); await shot("contact-full", true);
  await c.ev("document.querySelector('form button, form a[href^=\"https://wa.me\"]')?.click?.()");
  c.kill();
}
process.exit(0);
