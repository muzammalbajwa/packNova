import { site } from "@/content/site";

export interface QuoteFields {
  name?: string;
  phone?: string;
  product?: string;
  quantity?: string;
  message?: string;
  /** Pre-formatted spec lines from the configurator. */
  spec?: string;
}

/** Plain-text message shared by the WhatsApp and email hand-off. */
export function buildQuoteText(f: QuoteFields): string {
  const L = site.quote.messageLabels;
  const lines = [site.quote.messageIntro, ""];
  const add = (label: string, v?: string) => v?.trim() && lines.push(`${label}: ${v.trim()}`);
  add(L.name, f.name);
  add(L.phone, f.phone);
  add(L.product, f.product);
  add(L.quantity, f.quantity);
  if (f.spec?.trim()) lines.push("", `${L.spec}:`, f.spec.trim());
  add(L.message, f.message);
  return lines.join("\n");
}

export const whatsappUrl = (text: string) => `${site.contact.whatsappHref}?text=${encodeURIComponent(text)}`;

export const mailtoUrl = (text: string) =>
  `mailto:${site.contact.email}?subject=${encodeURIComponent(site.quote.emailSubject)}&body=${encodeURIComponent(text)}`;
