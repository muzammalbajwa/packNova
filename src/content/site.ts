/**
 * ALL copy and brand values live in this file.
 * The contact details, brand name and social links below are DUMMY values:
 * replace them here and they change everywhere on the site (see CONTENT-TODO.md).
 *
 * Urdu later: add `const ur: SiteContent = { ... }`, register it in `locales`,
 * and pick it by route/locale. Every component reads from `site`, never from literals.
 */

const en = {
  lang: "en" as const,
  dir: "ltr" as const,

  brand: {
    name: "PackNova",
    tagline: "Packaging that makes your product unforgettable.",
    description: "Custom boxes, cartons and pouches, designed in 3D and made to order.",
    /** Used for absolute URLs (Open Graph). Replace with the real domain. */
    url: "https://example.com",
  },

  contact: {
    phone: "+92 300 0000000",
    phoneHref: "tel:+923000000000",
    whatsapp: "+92 300 0000000",
    whatsappHref: "https://wa.me/923000000000",
    email: "hello@example.com",
    address: "Plot 00, Industrial Area, Lahore, Pakistan",
    hours: "Mon to Sat, 9:00 AM to 6:00 PM",
  },

  social: [
    { name: "Instagram", href: "#" },
    { name: "Facebook", href: "#" },
    { name: "LinkedIn", href: "#" },
  ],

  seo: {
    title: "PackNova | Custom 3D-designed packaging, made to order",
    description:
      "Custom corrugated boxes, folding cartons, rigid gift boxes, pouches and courier bags. Design your box in 3D, approve the preview, and get a quote from PackNova.",
    ogImage: "/og.png",
  },

  nav: {
    links: [
      { label: "Products", hash: "products" },
      { label: "Configurator", href: "/configurator/" },
      { label: "Quote", hash: "quote" },
      { label: "Contact", hash: "contact" },
    ],
    cta: "Get a quote",
  },

  hero: {
    eyebrow: "Custom packaging, made to order",
    headline: "Packaging with presence.",
    headlineAccent: "presence.",
    sub: "Custom boxes, cartons and pouches, designed in 3D and made to order. See your packaging before it exists.",
    primary: { label: "Design your box", href: "/configurator/" },
    secondary: { label: "Get a quote", hash: "quote" },
    scrollHint: "Scroll to open",
    posterAlt: "A kraft packaging box with its flaps open",
  },

  marquee: [
    "Corrugated Boxes",
    "Folding Cartons",
    "Rigid Gift Boxes",
    "Pouches",
    "Poly & Courier Bags",
    "Custom Printing",
    "Eco-friendly",
    "Made to Order",
  ],

  products: {
    eyebrow: "What we make",
    heading: "Six ways to wrap a product.",
    bestForLabel: "Best for",
    items: [
      {
        id: "corrugated",
        name: "Corrugated Shipping Boxes",
        spec: "3, 5 and 7 ply",
        description: "Strong boxes that protect products in transit.",
        bestFor: ["E-commerce", "Export", "Bulk shipping"],
        icon: "corrugated" as const,
        model: "carton" as const,
      },
      {
        id: "folding",
        name: "Folding Cartons",
        spec: "Printed retail cartons",
        description: "Printed retail cartons that sit well on a shelf.",
        bestFor: ["Food", "Cosmetics", "Medicine", "Electronics"],
        icon: "carton" as const,
        model: "folding" as const,
      },
      {
        id: "rigid",
        name: "Rigid Gift Boxes",
        spec: "Lid and base",
        description: "Premium boxes with a lid and a luxury feel.",
        bestFor: ["Jewelry", "Mobiles", "Gifts", "Apparel"],
        icon: "rigid" as const,
        model: "rigid" as const,
      },
      {
        id: "pouches",
        name: "Flexible Pouches",
        spec: "Stand-up and sachet",
        description: "Stand-up and sachet pouches for dry and liquid products.",
        bestFor: ["Snacks", "Spices", "Coffee", "Personal care"],
        icon: "pouch" as const,
        model: "pouch" as const,
      },
      {
        id: "courier",
        name: "Poly & Courier Bags",
        spec: "Tamper-evident",
        description: "Light, tamper-evident bags for fast shipping.",
        bestFor: ["Clothing", "Online stores", "Couriers"],
        icon: "courier" as const,
        model: "courier" as const,
      },
      {
        id: "eco",
        name: "Eco & Paper Packaging",
        spec: "Kraft and paper",
        description: "Kraft bags and boxes, paper cups and trays.",
        bestFor: ["Brands that want a greener option"],
        icon: "paper" as const,
        model: "paperbag" as const,
      },
    ],
  },

  making: {
    eyebrow: "How your box is made",
    stepsLabel: "Making steps",
    stages: [
      { step: "Board", title: "Choose your board", line: "Kraft, white or black stock, in the thickness your product needs." },
      { step: "Print", title: "Your brand, printed edge to edge", line: "Artwork is printed across the whole flat sheet before anything is cut." },
      { step: "Finish", title: "Lamination, UV and foil", line: "Gloss or matt protection, spot UV and foil accents on the printed sheet." },
      { step: "Die-cut", title: "Cut and creased in one press", line: "A steel die cuts the outline and presses the fold lines in a single stroke." },
      { step: "Fold", title: "Crease and fold", line: "Each panel folds along its crease: the sides first, then the flaps." },
      { step: "Glue", title: "Glue and close", line: "One glued seam holds the sides together, and the top tucks in." },
      { step: "Ship", title: "Ready to ship", line: "Your finished carton, ready to be packed and sent." },
    ],
    quoteButton: "Want this box? Get a quote",
    cta: {
      title: "Your box is ready. Let's make it real.",
      body: "Tell us the size and quantity and we will reply with a quote.",
      primary: "Open the configurator",
      secondary: "Chat on WhatsApp",
    },
    /** Spec handed to the quote flow from this section: the carton shown in the animation. */
    quoteProduct: "Folding Cartons",
    quoteNote: "I liked the folding carton in the how-it's-made animation (12 x 6 x 18 cm).",
    skip: "Skip to the quote form",
  },

  process: {
    eyebrow: "How it works",
    heading: "Four steps from brief to box.",
    steps: [
      { title: "Tell us what you need", body: "Share your product, size and quantity. Send artwork now or add it later." },
      { title: "Approve the 3D preview", body: "See your packaging in 3D and ask for changes before anything is cut." },
      { title: "We print and make it", body: "Your order is printed, finished and assembled to the approved design." },
      { title: "Delivered to you", body: "Packed, palletized and sent to your address." },
    ],
  },

  configurator: {
    eyebrow: "Configurator",
    heading: "Your box, your size.",
    body: "Choose a type, enter length, width and height, pick a material, and preview it live.",
    cta: "Open the configurator",
    labels: {
      type: "Type",
      size: "Size (cm)",
      length: "Length",
      width: "Width",
      height: "Height",
      material: "Material",
      quantity: "Quantity (units)",
    },
    studio: {
      artworkTitle: "Artwork",
      panel: "Panel",
      upload: "Upload image",
      uploadHelp: "PNG or JPG, up to 10 MB",
      removeImage: "Remove image",
      text: "Text on this panel",
      textColor: "Text color",
      background: "Background color",
      useMaterialColor: "Use material color",
      fit: "Image fit",
      fitCover: "Fill panel",
      fitContain: "Fit inside",
      clearPanel: "Clear this panel",
      open: "Open",
      close: "Close",
      hint: "Drag to rotate. Scroll or pinch to zoom.",
      summaryTitle: "Your spec",
      quoteButton: "Request a quote",
      attachNote:
        "Uploaded images cannot travel through a WhatsApp link. After you press send, attach your artwork file in the chat.",
      noPreview: "The 3D preview is not available on this device. Your spec and artwork notes still work below.",
      lowTier: "Simplified preview for this device.",
    },
    materials: [
      { id: "kraft", label: "Kraft" },
      { id: "white", label: "Matte white" },
      { id: "black", label: "Gloss black" },
    ],
    page: {
      eyebrow: "Live preview",
      heading: "Configure your packaging",
      note: "This is a preview. The full configurator with artwork upload and pricing is coming soon, so for now send us your specs with a quote request.",
      noWebgl: "Your device can't show the 3D preview, but you can still send us these specs.",
      sendSpecs: "Request a quote with these specs",
      back: "Back home",
    },
  },

  quote: {
    eyebrow: "Request a quote",
    heading: "Tell us what you are packing. We will reply with a quote.",
    fields: {
      name: "Your name",
      phone: "Phone number",
      product: "What are you packing?",
      productPlaceholder: "Choose a product",
      quantity: "Quantity",
      message: "Anything else we should know?",
    },
    submit: "Send request",
    success: {
      title: "Your message is ready in WhatsApp.",
      body: "Press send in WhatsApp to finish. Nothing has been sent until you do.",
      openAgain: "Open WhatsApp again",
      emailInstead: "Send by email instead",
      again: "Edit request",
    },
    /** Message header used for WhatsApp / email (the fields are appended). */
    messageIntro: "Hello, I would like a quote.",
    messageLabels: {
      name: "Name",
      phone: "Phone",
      product: "Product",
      quantity: "Quantity",
      message: "Notes",
      spec: "Spec",
    },
    emailSubject: "Quote request",
    whatsappCta: "Or message us on WhatsApp",
  },

  footer: {
    blurb: "Custom boxes, cartons and pouches, designed in 3D and made to order.",
    productsTitle: "Products",
    companyTitle: "Explore",
    contactTitle: "Contact",
    rights: "All rights reserved.",
  },

  loader: {
    messages: [
      "Folding the cardboard...",
      "Cutting the dieline...",
      "Adding lights...",
      "Taping the seams...",
      "Ready to ship.",
    ],
  },
};

export type SiteContent = typeof en;
export type Locale = "en";

/** Register additional languages here (e.g. `ur`). */
export const locales: Record<Locale, SiteContent> = { en };

export const site: SiteContent = locales.en;
