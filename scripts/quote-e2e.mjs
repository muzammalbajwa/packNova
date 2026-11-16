#!/usr/bin/env node
// End-to-end checks of /quote/ and /contact/ in a real browser.
//   normal site (no form service):      http://127.0.0.1:8080   (npm run build; npm run serve:out)
//   site built WITH an endpoint:        --mock-dir <dir containing out/>  (built with NEXT_PUBLIC_QUOTE_ENDPOINT=http://127.0.0.1:8099/submit),
//                                       served here on :8081; the mock form service listens on :8099.
// node scripts/quote-e2e.mjs --mock-dir /tmp/mock
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { launch, sleep } from "./lib/cdp.mjs";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const NORMAL = arg("base", "http://127.0.0.1:8080");
const MOCKDIR = arg("mock-dir", "");
const MOCK = "http://127.0.0.1:8081";
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++; };

/* the mock form service */
let mode = "ok", hits = [];
const srv = createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c));
  req.on("end", () => {
    res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Headers", "content-type, accept");
    if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
    hits.push({ method: req.method, body: b });
    if (mode === "drop") return req.socket.destroy();
    if (mode === "500") return res.writeHead(500).end("no");
    res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
  });
}).listen(8099, "127.0.0.1");
let mockSite = null;
if (MOCKDIR) {
  mockSite = spawn("node", [new URL("./serve.mjs", import.meta.url).pathname, "8081", "127.0.0.1"], { cwd: MOCKDIR, stdio: "ignore" });
  await sleep(1200);
}

const open = async (url, opts = {}) => {
  const c = await launch(opts.mobile ? { width: 390, height: 844, dpr: 2, mobile: true, cores: 4 } : { width: 1440, height: 900 });
  const reqs = [], errors = [];
  await c.send("Network.enable");
  c.on("Network.requestWillBeSent", (e) => reqs.push(e.request.url));
  c.on("Runtime.exceptionThrown", (e) => errors.push(e.exceptionDetails.exception?.description?.slice(0, 160) ?? "exception"));
  await c.send("Page.navigate", { url });
  await sleep(1500);
  const api = {
    c, reqs, errors,
    ev: c.ev,
    nav: async (u) => { await c.send("Page.navigate", { url: u }); await sleep(1300); },
    val: (sel, v) => c.ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); const P=el instanceof HTMLSelectElement?HTMLSelectElement:el instanceof HTMLTextAreaElement?HTMLTextAreaElement:HTMLInputElement; Object.getOwnPropertyDescriptor(P.prototype,'value').set.call(el,${JSON.stringify(v)}); el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true}));})()`),
    click: (sel) => c.ev(`document.querySelector(${JSON.stringify(sel)}).click()`),
    clickText: (txt) => c.ev(`(()=>{const el=[...document.querySelectorAll('button,a')].find(b=>b.textContent.trim()===${JSON.stringify(txt)}); if(!el) throw new Error('no button '+${JSON.stringify(txt)}); el.click();})()`),
    text: (sel) => c.ev(`document.querySelector(${JSON.stringify(sel)})?.innerText ?? null`),
    step: () => c.ev(`document.querySelector('[aria-label=Progress] p')?.innerText ?? ''`),
    has: (txt) => c.ev(`document.body.innerText.includes(${JSON.stringify(txt)})`),
    next: async () => { await c.ev(`[...document.querySelectorAll('form button[type=submit]')][0].click()`); await sleep(500); },
    key: async (key, code, vk, text) => { await c.send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key, code, windowsVirtualKeyCode: vk, text }); await c.send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); },
    done: () => c.kill(),
  };
  return api;
};

/** Fills the whole wizard through the page's own controls and stops on the review step. */
async function fillAll(p, o = {}) {
  await p.val("#q-product", o.product ?? "Tuck Boxes"); await p.val("#q-l", "9"); await p.val("#q-w", "6"); await p.val("#q-h", "13"); await p.next();
  await p.val("#q-quantity", "2500"); await p.next();
  await p.val("#q-artwork", "I have a logo."); await p.next();
  await p.val("#q-name", "Ayesha Khan"); await p.val("#q-phone", "0300 123 4567"); await p.val("#q-email", "ayesha@example.pk"); await p.next();
}
const noBlock = (r) => r;

/* ---------------------------------------------------------------- A. the normal site (no form service) */
{
  const p = await open(NORMAL + "/quote/");
  ok(/Step 1 of 5: Product and size/.test(await p.step()), "wizard opens on step 1 of 5 with a progress line");
  const lib3d = (list) => list.filter((u) => /\.js(\?|$)/.test(u)).filter((u) => { try { const f = "out" + new URL(u).pathname; return existsSync(f) && /WebGLRenderer|film-recipe:|forceContextLoss/.test(readFileSync(f, "utf8")); } catch { return false; } });
  ok(lib3d(p.reqs).length === 0, "no 3D chunk is requested on /quote/ (checked every JS file in the network log)");
  ok(!(await p.ev("!!window.__film || !!window.__gl || !!document.querySelector('canvas')")), "no canvas, no WebGL objects on /quote/");

  // step 1 validation
  await p.next();
  ok(/choose a product/i.test((await p.text("#q-product-err")) ?? ""), "step 1: empty product shows an inline message next to the field");
  ok((await p.ev("(()=>{const e=document.getElementById('q-product'); return e.getAttribute('aria-invalid')==='true' && (e.getAttribute('aria-describedby')||'').includes('q-product-err') && document.activeElement===e})()")), "step 1: the field is aria-invalid, points at its message, and has focus");
  ok(/1 thing to check/.test(await p.text("[role=status]")), "step 1: the problem is announced in the live region");
  await p.val("#q-product", "Tuck Boxes"); await p.val("#q-l", "abc"); await p.next();
  ok(/number bigger than zero/i.test((await p.text("#q-l-err")) ?? ""), "step 1: a non-number size is explained");
  await p.val("#q-l", "12.5"); await p.val("#q-w", ""); await p.next();
  ok(/Step 2 of 5/.test(await p.step()), "step 1: decimals and empty sizes are fine, Next moves on");
  ok(await p.ev("document.activeElement===document.getElementById('q-heading')"), "focus moves to the new step's heading");
  // step 2
  await p.next();
  ok(/how many/i.test((await p.text("#q-quantity-err")) ?? ""), "step 2: empty quantity shows a message");
  await p.val("#q-quantity", "1,000");
  ok((await p.ev("document.getElementById('q-quantity').value")) === "1000", "step 2: commas typed in the quantity are removed");
  await p.next();
  ok(/Step 3 of 5/.test(await p.step()) && /send your artwork on WhatsApp or by email/i.test(await p.text("form")), "step 3 tells the visitor to send artwork on WhatsApp or email");
  await p.next();
  ok(/Step 4 of 5/.test(await p.step()), "step 3 (artwork) is optional");
  // step 4
  await p.next();
  ok(/name/i.test((await p.text("#q-name-err")) ?? "") && /phone/i.test((await p.text("#q-phone-err")) ?? ""), "step 4: name and phone are required, each with its own message");
  await p.val("#q-name", "Ayesha Khan"); await p.val("#q-phone", "hello"); await p.next();
  ok(/does not look like a phone number/i.test((await p.text("#q-phone-err")) ?? ""), "step 4: a bad phone number is explained with an example");
  for (const good of ["300 1234567", "0300-123-4567", "+44 20 7946 0000", "+1 (415) 555-2671"]) { await p.val("#q-phone", good); await p.next(); const ok4 = /Step 5/.test(await p.step()); if (!ok4) { ok(false, `phone ${good} should be accepted`); break; } await p.clickText("Back"); await sleep(300); }
  ok(true, "international phone formats are accepted (+44, +1 with brackets, dashes, local 0)");
  await p.val("#q-email", "bad@"); await p.next();
  ok(/email address does not look right/i.test((await p.text("#q-email-err")) ?? ""), "step 4: a bad email is flagged");
  await p.val("#q-email", ""); await p.click("input[name=contact][type=radio]:nth-of-type(1)");
  await p.ev("[...document.querySelectorAll('input[name=contact]')][2].click()"); await p.next();
  ok(/chose email/i.test((await p.text("#q-email-err")) ?? ""), "step 4: choosing email as the contact method requires an email");
  await p.val("#q-email", "ayesha@example.pk"); await p.val("#q-city", "Lahore"); await p.val("#q-country", "Pakistan"); await p.next();
  // review
  ok(/Step 5 of 5/.test(await p.step()), "reached the review step");
  await p.c.waitFor("[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='Send on WhatsApp')", 8000);
  const message = await p.text("[data-testid=quote-message]");
  const wa = await p.ev("[...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Send on WhatsApp').href");
  const mail = await p.ev("[...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Send by email').href");
  ok(new URL(wa).searchParams.get("text") === message && decodeURIComponent(mail.split("&body=")[1]) === message, "review: WhatsApp and email carry exactly the text shown on screen");
  ok(/Product: Tuck Boxes/.test(message) && /Quantity: 1000/.test(message) && /Phone: \+\d+/.test(message) && /Please contact me by: Email/.test(message), "review: the text has the product, quantity, normalised phone and contact method");
  ok(wa.startsWith("https://wa.me/923000000000?text="), "WhatsApp link uses the number from site.ts");
  ok(!(await p.has("Send request")), "no form service: there is no 'Send request' button, only WhatsApp and email");
  const privacy = await p.text("[data-testid=privacy]");
  ok(/does not store it/.test(privacy) && /your own browser/.test(privacy) && !/form service/.test(privacy), "privacy note says what is sent, to whom, and that the site stores nothing");
  // draft in localStorage, restored after a reload, cleared after sending
  ok(await p.ev("(()=>{try{return JSON.parse(localStorage.getItem('packnova.quote.draft.v1')).name==='Ayesha Khan'}catch{return false}})()"), "the draft is saved in this browser's localStorage");
  ok(!(await p.ev("localStorage.getItem('packnova.quote.draft.v1').includes('company')")), "the honeypot is never saved");
  await p.nav(NORMAL + "/quote/");
  await p.val("#q-product", "Tuck Boxes"); await p.next(); await p.val("#q-quantity", "10"); await p.next(); await p.next();
  ok((await p.ev("document.getElementById('q-name').value")) === "Ayesha Khan", "after a reload the contact details come back from the draft");
  await p.val("#q-phone", "300 1234567"); await p.next();
  await p.c.waitFor("[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='Send on WhatsApp')", 8000);
  await p.ev("document.addEventListener('click',(e)=>{ if(e.target.closest('a[target=_blank], a[href^=mailto]')) e.preventDefault(); })");
  await p.clickText("Send on WhatsApp"); await sleep(500);
  ok((await p.ev("localStorage.getItem('packnova.quote.draft.v1')")) === null, "the draft is deleted after sending");
  ok(p.errors.length === 0, "no uncaught errors" + (p.errors.length ? ": " + p.errors[0] : ""));
  p.done();
}

/* ---------------------------------------------------------------- A2. from the configurator and from a product page */
{
  const p = await open(NORMAL + "/quote/?cfg=1&type=rigid&l=32.5&w=21&h=9&unit=cm&mat=rigid&col=3366aa&print=both&fin=gloss%2Bfoil&qty=2500&product=Rigid%20box%20with%20lid");
  await sleep(800);
  const t = await p.text("form");
  ok(/From your design in the configurator/.test(t) && /32\.5 x 21 x 9 cm/.test(t) && /#3366AA/.test(t), "from the configurator: step 1 shows its summary");
  const link = await p.ev("[...document.querySelectorAll('a')].find(a=>/Change in configurator/.test(a.textContent)).getAttribute('href')");
  ok(/^\/configurator\/\?cfg=1&type=rigid&l=32\.5/.test(link) && !/note=/.test(link), "from the configurator: 'Change in configurator' link carries the design back");
  await p.next();
  ok((await p.ev("document.getElementById('q-quantity').value")) === "2500", "from the configurator: quantity is prefilled");
  p.done();
  const q = await open(NORMAL + "/quote/?product=Rigid%20Boxes&note=I%20am%20interested%20in%3A%20Rigid%20Boxes.");
  ok((await q.ev("document.getElementById('q-product').value")) === "Rigid Boxes" && /I am interested in: Rigid Boxes/.test(await q.text("form")), "from a product page: product is preselected and its note is shown");
  q.done();
}

/* ---------------------------------------------------------------- B. keyboard only */
{
  const p = await open(NORMAL + "/quote/");
  const tabTo = async (id, max = 60) => { for (let i = 0; i < max; i++) { if (await p.ev(`document.activeElement && document.activeElement.id==='${id}'`)) return true; await p.key("Tab", "Tab", 9); } return false; };
  const type = async (s) => { await p.c.send("Input.insertText", { text: s }); };
  ok(await tabTo("q-product"), "keyboard: Tab reaches the product select");
  for (const ch of "Tuck") await p.key(ch, "Key" + ch.toUpperCase(), ch.toUpperCase().charCodeAt(0), ch);
  ok((await p.ev("document.getElementById('q-product').value")) === "Tuck Boxes", "keyboard: typing the product name chooses it");
  ok(await tabTo("q-l"), "keyboard: Tab moves on to the size fields");
  let n = 0; while (!(await p.ev("document.activeElement.type==='submit'")) && n++ < 20) await p.key("Tab", "Tab", 9);
  await p.key("Enter", "Enter", 13, "\r"); await sleep(600);
  ok(/Step 2 of 5/.test(await p.step()) && await p.ev("document.activeElement.id==='q-heading'"), "keyboard: Enter on Next goes to step 2 and focus lands on the heading");
  ok(await tabTo("q-quantity"), "keyboard: Tab reaches quantity");
  await type("1500"); await p.key("Enter", "Enter", 13, "\r"); await sleep(600);
  ok(/Step 3 of 5/.test(await p.step()), "keyboard: Enter inside a field submits the step");
  await p.key("Enter", "Enter", 13, "\r"); await sleep(300); // heading has focus; Enter does nothing
  n = 0; while (!(await p.ev("document.activeElement.type==='submit'")) && n++ < 20) await p.key("Tab", "Tab", 9);
  await p.key(" ", "Space", 32, " "); await sleep(600);
  ok(/Step 4 of 5/.test(await p.step()), "keyboard: Space on Next works");
  ok(await tabTo("q-name"), "keyboard: Tab reaches name");
  await type("Bilal"); await p.key("Tab", "Tab", 9); await p.key("Tab", "Tab", 9);
  ok(await p.ev("document.activeElement.id==='q-phone'"), "keyboard: country code then phone, in order");
  await type("300 1234567"); await p.key("Enter", "Enter", 13, "\r"); await sleep(700);
  ok(/Step 5 of 5/.test(await p.step()), "keyboard: the whole form can be completed without a mouse");
  await p.c.waitFor("[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='Send on WhatsApp')", 8000);
  n = 0; while (!(await p.ev("document.activeElement.tagName==='A' && document.activeElement.textContent.trim()==='Send on WhatsApp'")) && n++ < 30) await p.key("Tab", "Tab", 9);
  ok(n < 30, "keyboard: the Send on WhatsApp link can be focused");
  // visible focus: the focused control has an outline or ring
  ok(await p.ev("(()=>{const s=getComputedStyle(document.activeElement); return s.outlineStyle!=='none' && parseFloat(s.outlineWidth)>0 || s.boxShadow!=='none'})()"), "keyboard: the focused control has a visible focus indicator");
  p.done();
}

/* ---------------------------------------------------------------- C. contact page */
{
  const p = await open(NORMAL + "/contact/");
  const lib3d = p.reqs.filter((u) => /\.js(\?|$)/.test(u)).filter((u) => { try { const f = "out" + new URL(u).pathname; return existsSync(f) && /WebGLRenderer|film-recipe:|forceContextLoss/.test(readFileSync(f, "utf8")); } catch { return false; } });
  ok(lib3d.length === 0 && !(await p.ev("!!document.querySelector('canvas')")), "no 3D chunk and no canvas on /contact/");
  ok((await p.ev("[...document.querySelectorAll('iframe')].length")) === 0, "no iframe (the map is a static placeholder)");
  ok(await p.ev("(()=>{const a=[...document.querySelectorAll('a')].find(a=>/Open in Google Maps/.test(a.textContent)); return !!a && a.href.startsWith('https://www.google.com/maps/') && a.target==='_blank' && /noopener/.test(a.rel)})()"), "'Open in Google Maps' is a plain link");
  const ld = await p.ev("[...document.querySelectorAll('script[type=\"application/ld+json\"]')].map(s=>s.textContent)");
  const j = JSON.parse(ld[0]);
  ok(j["@type"] === "LocalBusiness" && j.name === "PackNova" && j.telephone === "+92 300 0000000" && j.address?.streetAddress && j.geo?.latitude, "LocalBusiness JSON-LD is present and built from site.ts");
  ok(await p.ev("document.querySelector('meta[name=robots]').content.includes('noindex')"), "noindex while staging");
  const faqN = await p.ev("document.querySelectorAll('details').length");
  ok(faqN >= 6 && faqN <= 8, `FAQ has ${faqN} questions`);
  ok(await p.ev("[...document.querySelectorAll('details p')].filter(e=>/confirm/i.test(e.textContent)).length >= 6"), "FAQ answers say details are confirmed with the quote (read from the closed accordions)");
  for (const [sel, t] of [["address", "Plot 00"], ["dl", "Mon to Sat"]]) ok(await p.has(t), `contact details from site.ts shown (${t})`);
  // the form
  await p.clickText("Send on WhatsApp").catch(() => {});
  await sleep(400);
  const msgs = await p.text("#contact-form-h + p + [role=status]");
  ok(/to check/.test(msgs ?? "") && /name/i.test((await p.text("#c-name-err")) ?? "") && /message/i.test((await p.text("#c-artwork-err")) ?? "") && /phone number or an email/i.test((await p.text("#c-phone-err")) ?? ""), "contact form: validation messages next to each field");
  await p.val("#c-name", "Sara"); await p.val("#c-email", "sara@example.com"); await p.val("#c-artwork", "Do you ship to Dubai? & how long does it take?");
  await p.ev("document.addEventListener('click',(e)=>{ if(e.target.closest('a[target=_blank], a[href^=mailto]')) e.preventDefault(); })");
  await sleep(300);
  const wa = await p.ev("[...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='Send on WhatsApp').href");
  ok(new URL(wa).searchParams.get("text").includes("Message: Do you ship to Dubai? & how long does it take?") && !(await p.has("Send request")), "contact form: email alone is enough, WhatsApp text is built, no 'Send request' without a form service");
  ok(p.errors.length === 0, "no uncaught errors on /contact/");
  p.done();
}

/* ---------------------------------------------------------------- D. a site built with a form service endpoint (mock) */
if (MOCKDIR) {
  const wait = async (p, ms) => sleep(ms);
  const toReview = async (p, o) => { await fillAll(p, o); await p.c.waitFor("[...document.querySelectorAll('button')].some(a=>a.textContent.trim()==='Send request')", 8000); };
  // 1. a normal send
  {
    hits = []; mode = "ok";
    const p = await open(MOCK + "/quote/");
    await toReview(p);
    ok(/form service/.test(await p.text("[data-testid=privacy]")), "endpoint set: the privacy note also mentions the form service");
    ok((await p.ev("[...document.querySelectorAll('a')].filter(a=>/Send on WhatsApp|Send by email/.test(a.textContent)).length")) === 2, "endpoint set: WhatsApp and email buttons are still there");
    await sleep(4500);
    await p.clickText("Send request"); await sleep(1500);
    ok(/Thank you\. We have your request/.test(await p.text("body")) && /artwork on WhatsApp or by email/.test(await p.text("body")), "success state is shown (neutral line from site.ts, no reply-time promise)");
    ok(!/within \d|hours|24|48/i.test((await p.text("[role=status]")) ?? ""), "the success text promises no reply time");
    ok(hits.length === 1 && hits[0].method === "POST", "exactly one POST reached the mock service");
    const body = JSON.parse(hits[0].body);
    ok(body.name === "Ayesha Khan" && body.phone === "+923001234567" && body.email === "ayesha@example.pk" && body._gotcha === "" && body.fields.product === "Tuck Boxes" && /Quantity: 2500/.test(body.message) && body._elapsed_ms >= 4000, "payload: readable message, normalised phone, empty honeypot, product, fill time");
    ok((await p.ev("localStorage.getItem('packnova.quote.draft.v1')")) === null, "the draft is deleted after a successful send");
    p.done();
  }
  // 2. honeypot
  {
    hits = []; mode = "ok";
    const p = await open(MOCK + "/quote/");
    await toReview(p);
    await p.val("input[name=company]", "http://spam.example");
    await sleep(4500);
    await p.clickText("Send request"); await sleep(1200);
    ok(/Thank you/.test(await p.text("body")), "honeypot filled: the page looks successful");
    ok(hits.length === 0, "honeypot filled: NOTHING reached the service (spam trap works)");
    p.done();
  }
  // 3. too fast, then retry
  {
    hits = []; mode = "ok";
    const p = await open(MOCK + "/quote/");
    const t0 = Date.now();
    await toReview(p);
    await p.clickText("Send request"); await sleep(600);
    const quick = Date.now() - t0 < 4000;
    ok(quick && /very quick/i.test(await p.text("body")) && hits.length === 0, "sent within 4 s of opening: held back with a polite message, nothing sent" + (quick ? "" : " (the script was too slow to test this)"));
    ok(await p.has("Send on WhatsApp"), "after 'too fast' the WhatsApp and email buttons are still there");
    await sleep(4200);
    await p.clickText("Send request"); await sleep(1200);
    ok(/Thank you/.test(await p.text("body")) && hits.length === 1, "pressing send again after a moment works");
    p.done();
  }
  // 4. server error, then a retry
  {
    hits = []; mode = "500";
    const p = await open(MOCK + "/quote/");
    await toReview(p);
    await sleep(4500);
    await p.clickText("Send request"); await sleep(1200);
    ok(/could not be sent from this page/.test(await p.text("body")) && !/Thank you\. We have/.test(await p.text("body")), "HTTP 500: a real error state, no false success");
    ok(await p.has("Send on WhatsApp") && await p.has("Send by email"), "HTTP 500: the WhatsApp and email buttons remain");
    mode = "ok"; await p.clickText("Send request"); await sleep(1200);
    ok(/Thank you/.test(await p.text("body")), "after the service recovers, Send request works");
    p.done();
  }
  // 5. network error
  {
    hits = []; mode = "drop";
    const p = await open(MOCK + "/quote/");
    await toReview(p);
    await sleep(4500);
    await p.clickText("Send request"); await sleep(1500);
    ok(/could not be sent from this page/.test(await p.text("body")), "dropped connection: error state");
    p.done();
  }
  // 6. contact form with the service
  {
    hits = []; mode = "ok";
    const p = await open(MOCK + "/contact/");
    await p.val("#c-name", "Sara"); await p.val("#c-email", "sara@example.com"); await p.val("#c-artwork", "A question");
    await sleep(4500);
    await p.c.waitFor("[...document.querySelectorAll('button')].some(a=>a.textContent.trim()==='Send request')", 8000);
    await p.clickText("Send request"); await sleep(1200);
    ok(/Thank you/.test(await p.text("body")) && hits.length === 1 && JSON.parse(hits[0].body).fields.kind === "contact", "contact form: Send request posts to the same service");
    p.done();
  }
} else console.log("SKIP  mock form-service checks (pass --mock-dir)");

srv.close();
mockSite?.kill();
console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
