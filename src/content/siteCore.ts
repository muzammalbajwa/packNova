/**
 * The small set of values every page needs (header, footer, sticky bar, the quote and contact forms).
 * EDIT THE BRAND NAME, CONTACT DETAILS, SOCIAL LINKS AND THE FIRST LINE OF A QUOTE MESSAGE HERE.
 * All other copy is in site.ts. They are separate files only so that a page does not download all the copy to draw the header.
 * Every value below is a DUMMY until the owner replaces it (see CONTENT-TODO.md).
 */

export const brand = {
  name: "PackNova",
  tagline: "Packaging that makes your product unforgettable.",
  description: "Custom boxes, cartons and pouches, designed in 3D and made to order.",
  /** Used for absolute URLs (Open Graph). Replace with the real domain. */
  url: "https://staging.artinstallation.uk",
};

export const contact = {
  phone: "+92 300 0000000",
  phoneHref: "tel:+923000000000",
  whatsapp: "+92 300 0000000",
  whatsappHref: "https://wa.me/923000000000",
  email: "hello@example.com",
  address: "Plot 00, Industrial Area, Lahore, Pakistan",
  hours: "Mon to Sat, 9:00 AM to 6:00 PM",
};

export const social = [
  { name: "Instagram", href: "#" },
  { name: "Facebook", href: "#" },
  { name: "LinkedIn", href: "#" },
];

/** The few values the page shell (header, footer links, sticky bar) needs. Exported on their own so pages do not download the rest of this file. */
export const navCta = "Get a quote";
export const messageIntro = "Hello, I would like a quote.";

export const messageLabels = {
  name: "Name",
  phone: "Phone",
  product: "Product",
  quantity: "Quantity",
  message: "Notes",
  spec: "Spec",
};
export const emailSubject = "Quote request";
