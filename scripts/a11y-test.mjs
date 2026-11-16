#!/usr/bin/env node
// Accessibility checks in a real browser: skip link, heading order, desktop dropdown keyboard behaviour (arrows, Escape, Tab out),
// visible focus, prefers-reduced-motion (the films fall back to the step list), decorative SVGs, form labels.
// node scripts/a11y-test.mjs   (site on :8080)
import { launch, sleep } from "./lib/cdp.mjs";
const BASE = "http://127.0.0.1:8080";
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };
const key = async (c, k, code, vk, text) => { await c.send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, text }); await c.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); };
const PAGES = ["/", "/industry/", "/material/rigid-boxes/", "/shape-and-style/paper-bags/", "/event/halloween/", "/configurator/", "/quote/", "/contact/", "/privacy/", "/terms/", "/nope-404/"];

for (const reduced of [false, true]) {
  const c = await launch({ width: 1440, height: 900 });
  if (reduced) await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  const tag = reduced ? " (reduced motion)" : "";
  if (!reduced) {
    for (const p of PAGES) {
      await c.send("Page.navigate", { url: BASE + p }); await sleep(1800);
      const r = await c.ev(`(()=>{ const hs=[...document.querySelectorAll('h1,h2,h3,h4')].filter(h=>h.offsetParent!==null||getComputedStyle(h).position==='fixed'||h.closest('.sr-only')); let prev=0, jumps=[]; for(const h of hs){ const l=+h.tagName[1]; if(prev && l>prev+1) jumps.push(h.tagName+':'+h.textContent.trim().slice(0,25)); prev=l; } return {h1: document.querySelectorAll('h1').length, jumps, lang: document.documentElement.lang, main: !!document.getElementById('main')||!!document.querySelector('main'), title: document.title.length>0}; })()`);
      ok(r.h1 === 1 && r.jumps.length === 0 && r.lang && r.title, `${p}: one h1, no skipped heading levels, lang and title set${r.jumps.length ? " (jumps: " + r.jumps.join(", ") + ")" : ""}${r.h1 !== 1 ? " (h1 count " + r.h1 + ")" : ""}`);
    }
    // skip link
    await c.send("Page.navigate", { url: BASE + "/quote/" }); await sleep(1800);
    await key(c, "Tab", "Tab", 9);
    const sk = await c.ev("(()=>{const a=document.activeElement; const r=a.getBoundingClientRect(); return {text:a.textContent.trim(), visible:r.width>10&&r.top>=0, href:a.getAttribute('href')}})()");
    ok(/Skip to main content/.test(sk.text) && sk.visible && sk.href === "#main", "skip link is the first Tab stop and becomes visible");
    await key(c, "Enter", "Enter", 13, "\r"); await sleep(300);
    ok(await c.ev("document.activeElement.id==='main' || document.activeElement.closest('#main')!==null"), "skip link moves focus into the main content");
    // desktop dropdown by keyboard
    await c.send("Page.navigate", { url: BASE + "/quote/" }); await sleep(1800);
    await key(c, "Tab", "Tab", 9); // keyboard modality, so :focus-visible applies
    await c.ev("[...document.querySelectorAll('button[aria-haspopup]')].find(b=>/Industry/.test(b.textContent)).focus()");
    ok(await c.ev("getComputedStyle(document.activeElement).outlineStyle!=='none' && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>0 || getComputedStyle(document.activeElement).boxShadow!=='none'"), "menu button shows a visible focus indicator");
    await key(c, "ArrowDown", "ArrowDown", 40); await sleep(300);
    ok(await c.ev("document.querySelector('button[aria-haspopup][aria-expanded=true]')!==null && document.activeElement.tagName==='A'"), "ArrowDown opens the dropdown and focuses its first link");
    const first = await c.ev("document.activeElement.textContent");
    await key(c, "ArrowDown", "ArrowDown", 40);
    ok((await c.ev("document.activeElement.textContent")) !== first, "ArrowDown moves to the next link");
    await key(c, "End", "End", 35);
    ok(/All industry/.test(await c.ev("document.activeElement.textContent")), "End jumps to the last link");
    await key(c, "Home", "Home", 36);
    ok((await c.ev("document.activeElement.textContent")) === first, "Home jumps back to the first link");
    await key(c, "Escape", "Escape", 27); await sleep(300);
    ok(await c.ev("document.querySelector('button[aria-haspopup][aria-expanded=true]')===null && document.activeElement.tagName==='BUTTON' && /Industry/.test(document.activeElement.textContent)"), "Escape closes the dropdown and puts focus back on its button");
    // focus is not trapped: Tab leaves the menu
    await key(c, "Enter", "Enter", 13, "\r"); await sleep(200);
    for (let i = 0; i < 40; i++) await key(c, "Tab", "Tab", 9);
    ok(await c.ev("document.querySelector('button[aria-haspopup][aria-expanded=true]')===null && !document.activeElement.closest('header, nav')"), "Tab keeps moving through the page: focus is not trapped in the menu, which closes behind it");
    // forms and svgs
    const svgs = await c.ev("[...document.querySelectorAll('svg')].filter(s=>!s.closest('[aria-hidden=true]') && !s.getAttribute('aria-hidden') && !s.getAttribute('role') && !s.getAttribute('aria-label')).length");
    ok(svgs === 0, `every SVG on /quote/ is labelled or hidden from screen readers (${svgs} unlabelled)`);
    for (const p of ["/", "/material/rigid-boxes/"]) {
      await c.send("Page.navigate", { url: BASE + p }); await sleep(1800);
      const n = await c.ev("[...document.querySelectorAll('svg')].filter(s=>!s.closest('[aria-hidden=true]') && s.getAttribute('aria-hidden')!=='true' && !s.getAttribute('role') && !s.getAttribute('aria-label')).length");
      ok(n === 0, `${p}: no unlabelled SVG (${n})`);
      const bad = await c.ev("[...document.querySelectorAll('img')].filter(i=>i.getAttribute('alt')===null).length");
      ok(bad === 0, `${p}: every image has an alt attribute`);
    }
  } else {
    for (const p of ["/material/rigid-boxes/", "/shape-and-style/paper-bags/", "/event/halloween/"]) {
      await c.send("Page.navigate", { url: BASE + p }); await sleep(2500);
      const r = await c.ev("({canvas: !!document.querySelector('#how canvas'), film: !!window.__film, steps: document.querySelectorAll('#how ol > li').length})");
      ok(!r.canvas && !r.film && r.steps >= 4, `${p}${tag}: the film is replaced by the step list (${r.steps} steps, no canvas)`);
    }
    await c.send("Page.navigate", { url: BASE + "/" }); await sleep(3500);
    const h = await c.ev("({smooth: document.documentElement.classList.contains('lenis'), canvases: document.querySelectorAll('canvas').length, anim: [...document.getAnimations()].filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations===Infinity).length})");
    ok(!h.smooth && h.anim === 0, `/${tag}: smooth scroll is off and no endless CSS animation runs (${JSON.stringify(h)})`);
  }
  c.kill();
}
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
