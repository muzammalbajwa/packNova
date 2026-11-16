/**
 * The quote request: its fields, validation, and the ONE summary builder that the WhatsApp link, the email link and the
 * form-service payload all use. No React and no alias imports, so node can unit-test it (scripts/quote-test.mjs).
 */

export type Contact = "whatsapp" | "phone" | "email";

export interface QuoteDraft {
  product: string;
  /** Sizes the visitor knows (optional), in `unit`. */
  l: string;
  w: string;
  h: string;
  unit: "cm" | "in";
  material: string;
  finishes: string[];
  quantity: string;
  artwork: string;
  name: string;
  /** "+92": the country code picked in the form. */
  code: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  contact: Contact;
  /** Honeypot: real visitors never see or fill this. */
  company: string;
}

export const EMPTY_DRAFT: QuoteDraft = {
  product: "", l: "", w: "", h: "", unit: "cm", material: "", finishes: [], quantity: "", artwork: "",
  name: "", code: "+92", phone: "", email: "", city: "", country: "", contact: "whatsapp", company: "",
};

export const FINISHES = ["Matte coating", "Gloss coating", "Foil", "Embossing", "Window", "Not sure yet"] as const;
export const NOT_SURE = "Not sure yet";
export const CONTACT_LABEL: Record<Contact, string> = { whatsapp: "WhatsApp", phone: "Phone call", email: "Email" };

/** The most used country codes first (Pakistan is the default); the rest in a plain list. */
export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+92", label: "Pakistan (+92)" }, { code: "+971", label: "United Arab Emirates (+971)" }, { code: "+966", label: "Saudi Arabia (+966)" },
  { code: "+44", label: "United Kingdom (+44)" }, { code: "+1", label: "USA / Canada (+1)" }, { code: "+91", label: "India (+91)" },
  { code: "+880", label: "Bangladesh (+880)" }, { code: "+93", label: "Afghanistan (+93)" }, { code: "+98", label: "Iran (+98)" },
  { code: "+90", label: "Turkey (+90)" }, { code: "+20", label: "Egypt (+20)" }, { code: "+974", label: "Qatar (+974)" }, { code: "+968", label: "Oman (+968)" },
  { code: "+965", label: "Kuwait (+965)" }, { code: "+973", label: "Bahrain (+973)" }, { code: "+49", label: "Germany (+49)" }, { code: "+33", label: "France (+33)" },
  { code: "+39", label: "Italy (+39)" }, { code: "+34", label: "Spain (+34)" }, { code: "+31", label: "Netherlands (+31)" }, { code: "+61", label: "Australia (+61)" },
  { code: "+86", label: "China (+86)" }, { code: "+60", label: "Malaysia (+60)" }, { code: "+65", label: "Singapore (+65)" }, { code: "+27", label: "South Africa (+27)" },
  { code: "+234", label: "Nigeria (+234)" },
];

/* ------------------------------------------------------------------ phone and validation */

/**
 * Turns what a person typed into a full international number ("+923001234567"), or null when it cannot be a phone number.
 * Accepts digits, spaces, dashes, dots and brackets. "+44 ..." and "0044 ..." are taken as international; anything else
 * gets the chosen country code, with a leading national 0 dropped. Only the length is checked (6 to 15 digits).
 */
export function normalizePhone(raw: string, code: string): string | null {
  const t = raw.trim();
  if (!t || /[^\d\s+().-]/.test(t) || (t.indexOf("+") > 0) || (t.match(/\+/g)?.length ?? 0) > 1) return null;
  let digits = t.replace(/\D/g, "");
  if (digits.length < 6) return null;
  let full: string;
  if (t.startsWith("+")) full = digits;
  else if (digits.startsWith("00")) full = digits.slice(2);
  else {
    if (digits.startsWith("0")) digits = digits.slice(1);
    full = code.replace(/\D/g, "") + digits;
  }
  return full.length >= 7 && full.length <= 15 ? `+${full}` : null;
}

export type Errors = Partial<Record<keyof QuoteDraft, string>>;
const posNum = (v: string) => v.trim() === "" || (Number.isFinite(Number(v)) && Number(v) > 0);

/** Messages are written for people, and only block what truly cannot work: a missing product, a quantity, a name and a way to reach you. */
export function validateStep(step: number, d: QuoteDraft): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!d.product) e.product = "Please choose a product, or pick \"Not sure yet\" and we will help.";
    for (const k of ["l", "w", "h"] as const) if (!posNum(d[k])) e[k] = "Please use a number bigger than zero, for example 12.5, or leave it empty.";
  }
  if (step === 2) {
    const q = d.quantity.trim();
    if (!q) e.quantity = "Please tell us how many you need, for example 1000. A rough number is fine.";
    else if (!/^\d+$/.test(q) || Number(q) < 1 || Number(q) > 10_000_000) e.quantity = "Please use a whole number, for example 1000.";
  }
  if (step === 4) {
    if (!d.name.trim()) e.name = "Please tell us your name.";
    if (!d.phone.trim()) e.phone = "Please enter a phone or WhatsApp number we can reach you on.";
    else if (!normalizePhone(d.phone, d.code)) e.phone = "That does not look like a phone number. Use digits, spaces, + or dashes, for example 300 1234567 or +44 20 7946 0000.";
    const em = d.email.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e.email = "That email address does not look right. Check it, or leave it empty.";
    if (d.contact === "email" && !em) e.email = "You chose email as the way to reach you, so please add an email address.";
  }
  return e;
}

/** Contact-page form: name, a way to reach you, and the message. */
export function validateContact(d: Pick<QuoteDraft, "name" | "code" | "phone" | "email" | "artwork">): Errors {
  const e: Errors = validateStep(4, { ...EMPTY_DRAFT, ...d, contact: "whatsapp" });
  if (!d.artwork.trim()) e.artwork = "Please write your message.";
  if (!d.phone.trim() && !d.email.trim()) e.phone = "Please add a phone number or an email address so we can reply.";
  else if (!d.phone.trim()) delete e.phone;
  return e;
}

/* ------------------------------------------------------------------ the summary: one builder for everything */

/** Reads /quote/?product=&qty= (product pages). The configurator's own params are read by lib/box.ts (loaded only when they are present). */
export function prefillFromParams(q: URLSearchParams): Partial<QuoteDraft> {
  const draft: Partial<QuoteDraft> = {};
  const product = q.get("product")?.slice(0, 80) ?? "";
  if (product) draft.product = product;
  const qty = q.get("qty");
  if (qty && /^\d{1,8}$/.test(qty)) draft.quantity = qty;
  return draft;
}
