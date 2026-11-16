/**
 * The text of a request, and the links that carry it: ONE builder for WhatsApp, email and the form-service payload.
 * Loaded by the review step, not by the first screen. No React and no alias imports (node unit-tests it).
 */
import { contact, emailSubject, messageIntro, messageLabels } from "../content/siteCore";
import { MATERIALS, TYPE_BY_ID, summaryLines, type BoxConfig } from "./box";
import { CONTACT_LABEL, NOT_SURE, normalizePhone, type QuoteDraft } from "./quote";

export const MATERIAL_CHOICES = [...Object.values(MATERIALS).map((m) => m.label), NOT_SURE];

const size = (d: QuoteDraft) => (d.l || d.w || d.h ? `${d.l || "?"} x ${d.w || "?"} x ${d.h || "?"} ${d.unit}` : "");

/**
 * The text of the request. WhatsApp, email and the form-service payload all send exactly this. When the box came from the
 * configurator, its summary lines replace the product, size and material lines.
 */
export function buildQuoteMessage(d: QuoteDraft, cfg?: BoxConfig | null): string {
  const L = messageLabels;
  const out: string[] = [messageIntro, ""];
  const add = (label: string, v?: string) => { if (v && v.trim()) out.push(`${label}: ${v.trim()}`); };
  if (cfg) {
    out.push("Box designed in the configurator:");
    for (const [k, v] of summaryLines(cfg)) if (k !== "Price" && k !== "Quantity") out.push(`  ${k}: ${v}`);
    if (d.finishes.length) add("Finishes", d.finishes.join(", "));
  } else {
    add(L.product, d.product);
    add("Size (L x W x H)", size(d));
    add("Material", d.material);
    add("Finishes", d.finishes.join(", "));
  }
  add(L.quantity, d.quantity);
  add("Artwork", d.artwork);
  out.push("");
  add(L.name, d.name);
  const ph = normalizePhone(d.phone, d.code);
  add(L.phone, ph ?? d.phone);
  add("Email", d.email);
  add("City, country", [d.city.trim(), d.country.trim()].filter(Boolean).join(", "));
  add("Please contact me by", CONTACT_LABEL[d.contact]);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Short message from the contact page. */
export function buildContactMessage(d: Pick<QuoteDraft, "name" | "code" | "phone" | "email" | "artwork">): string {
  const out: string[] = ["Hello, I have a question."];
  const add = (label: string, v?: string) => { if (v && v.trim()) out.push(`${label}: ${v.trim()}`); };
  add("Message", d.artwork);
  out.push("");
  add("Name", d.name);
  add("Phone", normalizePhone(d.phone, d.code) ?? d.phone);
  add("Email", d.email);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const whatsappLink = (text: string) => `${contact.whatsappHref}?text=${encodeURIComponent(text)}`;
export const mailtoLink = (text: string) => `mailto:${contact.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(text)}`;

/** What the configurator's design fills in on the quote form. */
export function prefillFromConfig(cfg: BoxConfig): Partial<QuoteDraft> {
  return { product: TYPE_BY_ID[cfg.type].label, quantity: String(cfg.qty), material: MATERIALS[cfg.material].label };
}
