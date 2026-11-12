import { site } from "@/content/site";

/**
 * Eco-only wording. Shared facts (contact, product names and descriptions, the quote form, the 12 story captions) are
 * read from content/site.ts so there is one source of truth; only headlines and short lead texts are written here.
 * Nothing in this file invents a number, a lead time, a minimum order, a material, a certification, a client or a price.
 *
 * TODO(owner): a real manufacturer states these on the page. Add them to site.ts when known (see CONTENT-TODO.md, section 8):
 *   - board weight (GSM) and the board types you stock
 *   - minimum order quantity per product
 *   - typical lead time
 *   - print methods and finishes you offer
 *   - factory location and years in business
 */
export const copy = {
  hero: {
    kicker: "Custom packaging", // small plain text, not a chip; also read by scripts/export-images.mjs
    headline: "Packaging made to fit your product.",
    sub: "We make corrugated boxes, folding cartons, rigid gift boxes, pouches and courier bags. Set up your box in 3D, check the preview, then ask us for a quote.",
    primary: site.hero.primary,
    secondary: site.hero.secondary,
    posterAlt: site.hero.posterAlt,
  },
  products: {
    heading: "What we make",
    lead: "Six kinds of packaging. Choose one to start a quote.",
    bestFor: "Used for",
    action: "Start a quote",
    // TODO(owner): board weight, minimum quantity and lead time per product line.
  },
  story: {
    label: "How a box is made",
    fallbackHeading: "From flat board to your door",
  },
  process: {
    heading: "How an order works",
    lead: "Four steps, from your first message to the delivery.",
    steps: [
      site.process.steps[0],
      site.process.steps[1],
      site.process.steps[2],
      { title: site.process.steps[3].title, body: "Your order is packed and sent to your address." },
    ],
    // TODO(owner): typical lead time for each step, and who handles delivery.
  },
  configurator: {
    heading: "Try your size in 3D",
    body: "Pick a box type, enter the length, width and height, choose a material and turn the box around on screen.",
    cta: site.configurator.cta,
  },
  quote: {
    heading: site.quote.heading,
    lead: "Fill in the form and it opens as a WhatsApp message to us. Nothing is sent until you press send there.",
  },
  // Hidden until real data exists. Fill these in site.ts (media) and the sections appear on their own.
  photos: {
    productsHeading: "Our packaging",
    factoryHeading: "Where it is made",
  },
};
