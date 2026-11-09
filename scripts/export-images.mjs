#!/usr/bin/env node
// Re-renders public/textures/hero-poster.webp and public/og.png from the live 3D scene for a theme.
// Usage: npm run build && npm run serve:out   (other terminal)
//        node scripts/export-images.mjs [--base http://localhost:8080] [--theme a]
import { writeFileSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://localhost:8080");
const THEME = arg("theme", "a");

const c = await launch({ width: 1440, height: 900, dpr: 1 });
await c.send("Page.navigate", { url: `${BASE}/?theme=${THEME}&tier=high` });
await c.waitFor("window.__r3f && !document.querySelector('[role=status]') && document.querySelector('canvas')");
await sleep(2500);

const result = JSON.parse(await c.ev(`(async () => {
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 600));
  const st = window.__r3f;
  const { gl, scene, camera, size } = st;
  st.setFrameloop("never"); // freeze: we position things by hand and render once
  const root = scene.children.find((c) => c.type === "Group");
  const shadow = scene.children.find((c) => c.type === "Mesh");
  const [w0, h0, pr] = [size.width, size.height, gl.getPixelRatio()];
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
  const poster = p.toDataURL("image/webp", 0.9);

  // 1200x630 social image from the live theme variables
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue(n).trim();
  const font = getComputedStyle(document.querySelector("h1")).fontFamily;
  const o = document.createElement("canvas"); o.width = 1200; o.height = 630;
  const g = o.getContext("2d");
  g.fillStyle = v("--bg"); g.fillRect(0, 0, 1200, 630);
  const glow = g.createRadialGradient(900, 330, 20, 900, 330, 520);
  glow.addColorStop(0, v("--accent") + "33"); glow.addColorStop(1, v("--accent") + "00");
  g.fillStyle = glow; g.fillRect(0, 0, 1200, 630);
  g.drawImage(box, 590, 20, 600, 600);
  g.fillStyle = v("--accent"); g.font = "600 22px " + font; g.letterSpacing = "6px";
  g.fillText(document.querySelector(".eyebrow").textContent.toUpperCase(), 72, 150);
  g.letterSpacing = "0px"; g.fillStyle = v("--fg"); g.font = "700 96px " + font;
  const words = ["Packaging", "with"]; g.fillText(words[0], 72, 262); g.fillText(words[1], 72, 352);
  g.fillStyle = v("--kraft-ink"); g.fillText("presence.", 72, 442);
  g.fillStyle = v("--muted"); g.font = "400 28px " + font;
  g.fillText(document.title.split("|")[0].trim(), 72, 540);
  const og = o.toDataURL("image/png");

  gl.setPixelRatio(pr); gl.setSize(w0, h0, false); camera.aspect = w0 / h0; camera.zoom = 1; camera.updateProjectionMatrix();
  return JSON.stringify({ poster, og });
})()`));

const save = (file, url) => { writeFileSync(file, Buffer.from(url.split(",")[1], "base64")); console.log("wrote", file); };
save("public/textures/hero-poster.webp", result.poster);
save("public/og.png", result.og);
c.kill();
process.exit(0);
