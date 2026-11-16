/**
 * Text of the contact page (/contact/). Edit the words here. The contact details themselves (phone, email, address, hours) are in site.ts.
 * Kept in its own file so the other pages do not download it. Every FAQ answer says the detail is confirmed with the quote on purpose:
 * TODO(owner): replace with your real terms when you have them.
 */
export const contactPage = {
  heading: "Contact us",
  lead: "Ask a question, send us a size, or start a quote. We read every message.",
  formHeading: "Send us a message",
  formLead: "For a full quote with sizes and materials, use the quote form. This short form is for questions.",
  mapNote: "Map placeholder. Press the button to open the address in Google Maps.",
  faqHeading: "Questions we are often asked",
  /** Honest placeholders: every detail is confirmed with the quote. TODO(owner): replace with your real terms. */
  faq: [
    { q: "How do I place an order?", a: "Send us a quote request with the product, size and quantity. We reply with a quote. If you accept it, we confirm the details with you before anything is made." },
    { q: "What is the minimum order?", a: "It depends on the product and the print. We confirm the minimum order with your quote." },
    { q: "What artwork do you need?", a: "Send your logo or artwork on WhatsApp or by email. If you only have an idea, tell us and we will explain what we need. We send a dieline you can place your artwork on, and our team checks it before printing." },
    { q: "Can I get a sample?", a: "Ask us when you request a quote. Whether a sample is possible, and what it costs, depends on the product and is confirmed with the quote." },
    { q: "How long does an order take?", a: "Lead time depends on the product, the quantity and the print. We confirm it with the quote." },
    { q: "How does delivery work?", a: "We confirm how and when your order is delivered, and the cost, with the quote." },
    { q: "How do I pay?", a: "We confirm the payment method and terms with the quote, before production starts." },
    { q: "Is the price shown anywhere on the site?", a: "No. Prices depend on size, material, print and quantity, so a quote is made after we see your request." },
  ],
  /** Opens in Google Maps (a link only, no embedded map). TODO(owner): use the real address or a place link. */
  mapsHref: "https://www.google.com/maps/search/?api=1&query=Industrial+Area+Lahore+Pakistan",
  /** TODO(owner): real latitude and longitude, for the structured data on the contact page. */
  geo: { lat: 31.5204, lng: 74.3587 },
};
