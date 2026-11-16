#!/usr/bin/env node
// Unit tests (no browser): the summary builder, links, phone and URL parsing, validation, submitQuote against a local mock server.
// node scripts/quote-unit.mjs
import { createServer } from "node:http";
import { register } from "node:module";
register("./lib/ts-loader.mjs", import.meta.url);
const Q = await import("../src/lib/quote.ts");
const B = await import("../src/lib/quoteBuild.ts");
const box = await import("../src/lib/box.ts");
const S = await import("../src/lib/submitQuote.ts");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log(`FAIL  ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`);

/* phone numbers */
for (const [raw, code, want] of [
  ["300 1234567", "+92", "+923001234567"], ["0300-1234567", "+92", "+923001234567"], ["(0300) 123 4567", "+92", "+923001234567"],
  ["+44 20 7946 0000", "+92", "+442079460000"], ["0044 20 7946 0000", "+92", "+442079460000"], ["+1 (415) 555-2671", "+92", "+14155552671"],
  ["20 7946 0000", "+44", "+442079460000"], ["055 123 4567", "+971", "+971551234567"],
  ["abc", "+92", null], ["12345", "+92", null], ["", "+92", null], ["+92+300", "+92", null], ["30 0123 4567 8901 2345 6", "+92", null], ["300 123 45x7", "+92", null],
]) eq(Q.normalizePhone(raw, code), want, `phone ${JSON.stringify(raw)} ${code}`);

/* validation: clear messages, and nothing that blocks a real person */
const D = (o) => ({ ...Q.EMPTY_DRAFT, ...o });
eq(Object.keys(Q.validateStep(1, D({}))), ["product"], "step 1 needs a product");
eq(Object.keys(Q.validateStep(1, D({ product: "Tuck Boxes", l: "12.5", w: "", h: "8" }))), [], "step 1 accepts decimals and empty sizes");
eq(Object.keys(Q.validateStep(1, D({ product: "x", l: "-3", w: "abc" }))).sort(), ["l", "w"], "step 1 refuses negative or non-numeric sizes");
eq(Object.keys(Q.validateStep(1, D({ product: Q.NOT_SURE }))), [], "step 1 accepts 'Not sure yet'");
for (const [v, bad] of [["", true], ["1000", false], ["1", false], ["0", true], ["abc", true], ["1e3", true], ["12.5", true], ["20000000", true], ["10000000", false]]) eq(!!Q.validateStep(2, D({ quantity: v })).quantity, bad, `quantity ${JSON.stringify(v)}`);
eq(Object.keys(Q.validateStep(4, D({}))).sort(), ["name", "phone"], "step 4 needs a name and a phone");
eq(Object.keys(Q.validateStep(4, D({ name: "A", phone: "300 1234567" }))), [], "step 4: name and phone are enough (email, city, country optional)");
ok(/phone number/i.test(Q.validateStep(4, D({ name: "A", phone: "hello" })).phone), "phone message mentions a phone number");
eq(Object.keys(Q.validateStep(4, D({ name: "A", phone: "300 1234567", email: "not-an-email" }))), ["email"], "bad email is flagged");
eq(Object.keys(Q.validateStep(4, D({ name: "A", phone: "300 1234567", contact: "email" }))), ["email"], "email is required only when chosen as the contact method");
for (const e of ["a@b.co", "first.last+tag@sub.example.org", "ali@example.pk"]) eq(Q.validateStep(4, D({ name: "A", phone: "300 1234567", email: e })).email, undefined, `email ${e} accepted`);
for (const m of Object.values(Q.validateStep(4, D({ phone: "x" })))) ok(m.length > 20 && /^[A-Z]/.test(m), "messages are full sentences");
eq(Object.keys(Q.validateContact({ name: "A", code: "+92", phone: "", email: "a@b.co", artwork: "hi" })), [], "contact form: email alone is enough");
eq(Object.keys(Q.validateContact({ name: "A", code: "+92", phone: "300 1234567", email: "", artwork: "hi" })), [], "contact form: phone alone is enough");
eq(Object.keys(Q.validateContact({ name: "A", code: "+92", phone: "", email: "", artwork: "hi" })), ["phone"], "contact form: needs a phone or an email");
eq(Object.keys(Q.validateContact({ name: "A", code: "+92", phone: "300 1234567", email: "", artwork: "" })), ["artwork"], "contact form: needs a message");

/* the summary builder: one text for WhatsApp, email and the payload */
const full = D({ product: "Tuck Boxes", l: "9", w: "6", h: "13", unit: "cm", material: "White", finishes: ["Matte coating", "Foil"], quantity: "2500", artwork: "I have a logo & need help with the design #1 (50% off?) +", name: "Ayesha Khan", code: "+92", phone: "0300 123 4567", email: "ayesha@example.pk", city: "Zürich", country: "پاکستان", contact: "email" });
const msg = B.buildQuoteMessage(full, null);
for (const want of ["Product: Tuck Boxes", "Size (L x W x H): 9 x 6 x 13 cm", "Material: White", "Finishes: Matte coating, Foil", "Quantity: 2500", "Name: Ayesha Khan", "Phone: +923001234567", "Email: ayesha@example.pk", "City, country: Zürich, پاکستان", "Please contact me by: Email", "need help with the design #1 (50% off?) +"]) ok(msg.includes(want), `message has "${want}"`);
ok(!/undefined|null|NaN|\[object/.test(msg), "no undefined/null in the message");
ok(!/\n{3}/.test(msg) && msg === msg.trim(), "message is tidy");
const empty = B.buildQuoteMessage(D({ product: Q.NOT_SURE, quantity: "500", name: "B", phone: "300 1234567" }), null);
ok(!/Size|Finishes|Material|Email|City/.test(empty), "empty optional fields are left out");
const cfg = box.defaultConfig("rigid");
const withCfg = B.buildQuoteMessage(D({ quantity: "2500", name: "B", phone: "300 1234567" }), cfg);
ok(/Box designed in the configurator:/.test(withCfg) && /Size \(L x W x H\): 20 x 15 x 8 cm/.test(withCfg) && !/Price/.test(withCfg) && (withCfg.match(/Quantity/g) || []).length === 1, "configurator summary replaces product, size and material lines (no price, quantity once)");
/* WhatsApp and email carry exactly the same text, whatever the characters */
for (const text of [msg, empty, withCfg, "line1\nline2 & more = 100% #hash +plus ?q=1 \"quoted\" 'single' <b>html</b> emoji 📦 Zürich پاکستان"]) {
  const wa = new URL(B.whatsappLink(text));
  const mt = B.mailtoLink(text);
  const body = decodeURIComponent(mt.split("&body=")[1]);
  eq(wa.searchParams.get("text"), text, "WhatsApp link decodes to the exact text");
  eq(body, text, "mailto body decodes to the exact text");
  ok(wa.origin + wa.pathname === "https://wa.me/923000000000", "WhatsApp link uses the number from site.ts");
  ok(mt.startsWith("mailto:hello@example.com?subject=Quote%20request&body="), "mailto uses the address and subject from site.ts");
  ok(!/[\n ]/.test(B.whatsappLink(text)) && !/[\n ]/.test(mt), "links contain no raw newlines or spaces");
}
const contactMsg = B.buildContactMessage({ name: "C", code: "+92", phone: "300 1234567", email: "", artwork: "Do you ship to Dubai?" });
ok(/Message: Do you ship to Dubai\?/.test(contactMsg) && /Phone: \+923001234567/.test(contactMsg), "contact message");

/* URL params */
eq(Q.prefillFromParams(new URLSearchParams("product=Rigid%20Boxes&qty=500&note=x")), { product: "Rigid Boxes", quantity: "500" }, "product-page params");
eq(Q.prefillFromParams(new URLSearchParams("qty=abc&product=")), {}, "bad qty and empty product are ignored");
eq(Q.prefillFromParams(new URLSearchParams("product=" + "x".repeat(500))).product.length, 80, "product is length-limited");
const cp = box.configToParams({ ...box.defaultConfig("pouch"), qty: 2500 });
const back = box.paramsToConfig(new URLSearchParams(cp.toString()));
eq(B.prefillFromConfig(back), { product: "Pouch", quantity: "2500", material: "Film" }, "configurator params prefill the form");

/* submitQuote against a mock server */
let mode = "ok", hits = [];
const srv = createServer((req, res) => {
  let b = ""; req.on("data", (c) => (b += c));
  req.on("end", () => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
    hits.push({ method: req.method, ct: req.headers["content-type"], body: b });
    if (mode === "drop") return req.socket.destroy();
    if (mode === "slow") return; // never answers
    if (mode === "500") return res.writeHead(500).end("no");
    if (mode === "soft-fail") return res.writeHead(200, { "content-type": "application/json" }).end('{"success":false}');
    res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
  });
}).listen(0);
await new Promise((r) => srv.once("listening", r));
const url = `http://127.0.0.1:${srv.address().port}/submit`;
const payload = (o = {}) => ({ message: msg, name: "A", phone: "+923001234567", email: "", fields: { product: "Tuck Boxes" }, _gotcha: "", ...o });
eq((await S.submitQuote(payload(), { endpoint: "", elapsedMs: 9000 })), { ok: false, reason: "disabled" }, "no endpoint: disabled");
hits = []; mode = "ok";
eq(await S.submitQuote(payload(), { endpoint: url, elapsedMs: 9000 }), { ok: true }, "success");
ok(hits.length === 1 && hits[0].method === "POST" && /application\/json/.test(hits[0].ct), "one JSON POST");
const sent = JSON.parse(hits[0].body);
ok(sent.message === msg && sent.name === "A" && sent._gotcha === "" && sent._elapsed_ms === 9000 && sent.fields.product === "Tuck Boxes", "payload has the message, fields, empty honeypot and the fill time");
hits = [];
eq(await S.submitQuote(payload({ _gotcha: "http://spam.example" }), { endpoint: url, elapsedMs: 9000 }), { ok: true }, "honeypot filled: looks like success");
eq(hits.length, 0, "honeypot filled: nothing is sent");
eq(await S.submitQuote(payload(), { endpoint: url, elapsedMs: 1500 }), { ok: false, reason: "too-fast" }, "too fast is held back");
eq(hits.length, 0, "too fast: nothing is sent");
eq(await S.submitQuote(payload(), { endpoint: url, elapsedMs: 1500, minMs: 1000 }), { ok: true }, "the minimum time is configurable");
mode = "500"; eq(await S.submitQuote(payload(), { endpoint: url, elapsedMs: 9000 }), { ok: false, reason: "server" }, "HTTP 500 is an error");
mode = "soft-fail"; eq(await S.submitQuote(payload(), { endpoint: url, elapsedMs: 9000 }), { ok: false, reason: "server" }, "200 with success:false is an error");
mode = "drop"; eq(await S.submitQuote(payload(), { endpoint: url, elapsedMs: 9000 }), { ok: false, reason: "network" }, "dropped connection is a network error");
mode = "slow"; const t0 = Date.now(); eq(await S.submitQuote(payload(), { endpoint: url, elapsedMs: 9000, timeoutMs: 600 }), { ok: false, reason: "network" }, "no answer: times out");
ok(Date.now() - t0 < 2000, "the timeout is honoured");
eq(await S.submitQuote(payload(), { endpoint: "http://127.0.0.1:9/none", elapsedMs: 9000 }), { ok: false, reason: "network" }, "nothing listening: network error");
srv.close();
console.log(fails ? `${fails} of ${n} checks FAILED` : `all ${n} checks passed`);
process.exit(fails ? 1 : 0);
