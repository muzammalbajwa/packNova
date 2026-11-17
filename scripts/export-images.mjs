#!/usr/bin/env node
// Re-renders public/textures/hero-poster-<template>.webp and public/og-<template>.png from the live 3D scene.
// Usage: npm run build && npm run serve:out   (other terminal)
//        node scripts/export-images.mjs --template editorial [--base http://localhost:8080]
import { writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://localhost:8080");
const TEMPLATE = arg("template", "eco");
const FLAT = TEMPLATE === "eco"; // eco: plain social image (no glow, sentence-case label, the page's own headline, wrapped)

const PHONE = process.argv.includes("--phone"); // --phone: write the phone poster (hero-poster-<template>-m.webp) from a 390 px viewport
const c = await launch(PHONE ? { width: 390, height: 844, dpr: 1, mobile: true, cores: 4 } : { width: 1440, height: 900, dpr: 1 });
await c.send("Page.navigate", { url: `${BASE}/?tier=high` });
await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')");
await sleep(2500);

const result = JSON.parse(await c.ev(`(async () => {
  const FLAT = ${FLAT};
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 600));
  const st = window.__r3f;
  const { gl, scene, camera, size } = st;
  st.setFrameloop("never"); // freeze: we position things by hand and render once
  const root = scene.children.find((c) => c.type === "Group");
  const shadow = scene.children.find((c) => c.type === "Mesh");
  const [w0, h0, pr] = [size.width, size.height, gl.getPixelRatio()];
  // The poster is a crop of the LIVE canvas at the rectangle the poster <img> occupies, so the swap from poster to 3D lines up exactly
  // (same camera, same scale, same position). The box is at its rest pose (the idle bob and sway are a few pixels).
  const posterImg = document.querySelector("#top img");
  const pr0 = posterImg.getBoundingClientRect();
  const k = 800 / pr0.width;
  gl.setPixelRatio(k); gl.setSize(size.width, size.height, false);
  gl.render(scene, camera);
  const full = new Image();
  await new Promise((r) => { full.onload = r; full.src = gl.domElement.toDataURL("image/png"); });
  const crop = document.createElement("canvas"); crop.width = crop.height = 800;
  crop.getContext("2d").drawImage(full, pr0.left * k, pr0.top * k, 800, 800, 0, 0, 800, 800);
  const posterLive = crop.toDataURL("image/webp", 0.9);
  gl.setPixelRatio(1); gl.setSize(1000, 1000, false);
  camera.aspect = 1; camera.zoom = 1.25; camera.updateProjectionMatrix();
  root.position.set(0, -0.62 * 0.82 + 0.18, 0); root.rotation.set(0.18, 0.55, 0); root.scale.setScalar(0.82);
  shadow.position.set(0, root.position.y + 0.01, 0);
  gl.render(scene, camera);
  const box = new Image();
  const boxPng = gl.domElement.toDataURL("image/png");
  await new Promise((r) => { box.onload = r; box.src = boxPng; });

  // 800x800 poster
  const p = document.createElement("canvas"); p.width = p.height = 800;
  p.getContext("2d").drawImage(box, 0, 0, 800, 800);
  const poster = posterLive;

  // 1200x630 social image from the live theme variables
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue(n).trim();
  const font = getComputedStyle(document.querySelector("h1")).fontFamily;
  const o = document.createElement("canvas"); o.width = 1200; o.height = 630;
  const g = o.getContext("2d");
  g.fillStyle = v("--bg"); g.fillRect(0, 0, 1200, 630);
  if (FLAT) {
    // soften the square edge of the render so the contact shadow does not end in a hard line
    const m = document.createElement("canvas"); m.width = m.height = 600;
    const mg = m.getContext("2d"); mg.drawImage(box, 0, 0, 600, 600);
    mg.globalCompositeOperation = "destination-in";
    const fade = mg.createRadialGradient(300, 300, 262, 300, 300, 300);
    fade.addColorStop(0, "#000"); fade.addColorStop(1, "#0000");
    mg.fillStyle = fade; mg.fillRect(0, 0, 600, 600);
    g.drawImage(m, 590, 20, 600, 600);
    g.fillStyle = v("--kraft-ink"); g.font = "600 26px " + font;
    g.fillText(document.querySelector("[data-og-eyebrow]").textContent, 72, 170);
    g.fillStyle = v("--fg"); g.font = "500 76px " + font;
    // wrap the page's own h1 to the left column
    let line = "", y = 262;
    for (const word of document.querySelector("h1").textContent.trim().split(/\\s+/)) {
      const t = line ? line + " " + word : word;
      if (g.measureText(t).width > 500 && line) { g.fillText(line, 72, y); y += 86; line = word; } else line = t;
    }
    g.fillText(line, 72, y);
  } else {
  const glow = g.createRadialGradient(900, 330, 20, 900, 330, 520);
  glow.addColorStop(0, v("--accent") + "33"); glow.addColorStop(1, v("--accent") + "00");
  g.fillStyle = glow; g.fillRect(0, 0, 1200, 630);
  g.drawImage(box, 590, 20, 600, 600);
  g.fillStyle = v("--accent"); g.font = "600 22px " + font; g.letterSpacing = "6px";
  g.fillText(document.querySelector("[data-og-eyebrow]").textContent.toUpperCase(), 72, 150);
  g.letterSpacing = "0px"; g.fillStyle = v("--fg"); g.font = "700 96px " + font;
  const words = ["Packaging", "with"]; g.fillText(words[0], 72, 262); g.fillText(words[1], 72, 352);
  g.fillStyle = v("--kraft-ink"); g.fillText("presence.", 72, 442);
  }
  g.fillStyle = v("--muted"); g.font = "400 28px " + font;
  g.fillText(document.title.split("|")[0].trim(), 72, FLAT ? 570 : 540);
  const og = o.toDataURL("image/png");

  gl.setPixelRatio(pr); gl.setSize(w0, h0, false); camera.aspect = w0 / h0; camera.zoom = 1; camera.updateProjectionMatrix();
  return JSON.stringify({ poster, og });
})()`));

const save = (file, url) => { writeFileSync(file, Buffer.from(url.split(",")[1], "base64")); console.log("wrote", file); };
save(`public/textures/hero-poster-${TEMPLATE}${PHONE ? "-m" : ""}.webp`, result.poster);
if (!PHONE) save(`public/og-${TEMPLATE}.png`, result.og);
c.kill();
process.exit(0);
