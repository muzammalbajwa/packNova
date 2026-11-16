/**
 * The single source of truth for every product page behind the nav bar (31 pages in 4 groups).
 * Each page = one process `recipe` (the 3D "how it is made" film) + one `skin` (material, colors, print, size, props).
 * This file has no three.js import: the nav, the hub pages and the sitemap read it without loading any 3D code.
 *
 * ALL copy here is placeholder. It is deliberately plain and contains no invented numbers, awards or clients.
 * MOQ and lead time say that they are confirmed with the quote until the owner fills real values in
 * (see CONTENT-TODO.md section 9: replace `specs` values, uses, finishes and FAQ answers with real ones).
 */

export type GroupId = "industry" | "shape-and-style" | "material" | "event";
export type RecipeId = "rigid-box" | "corrugated-box" | "folding-carton" | "paper-bag" | "pouch" | "label-tag" | "tray-sleeve";
export type MaterialLook = "kraft" | "white" | "black" | "color" | "film";
export type PrintStyle = "none" | "wordmark" | "band" | "stripes" | "dots" | "full";
export type LidKind = "tuck" | "lid-base" | "magnet" | "shoulder" | "gable" | "pillow" | "flap" | "none";
export type PropKind = "pumpkin" | "bat" | "ribbon" | "bow" | "snowflake" | "star" | "leaf" | "confetti";
export type CardLook = "tag" | "sticker" | "";

export interface Skin {
  material: MaterialLook;
  /** Outside color of the board / paper / film. */
  base: string;
  /** Print and trim color. */
  accent: string;
  /** Second accent (foil, ribbon, seasonal color). */
  second: string;
  print: PrintStyle;
  /** Length : width : height of the finished product (a ratio, not a promise of size). */
  ratio: [number, number, number];
  lid: LidKind;
  window: boolean;
  handle: boolean;
  foil: boolean;
  props: PropKind[];
  /** label-tag recipe: a hang tag with a string, or a sticker on a backing. */
  card?: CardLook;
}

export interface ProcessStep {
  /** Which 3D action plays (named per recipe in components/canvas/film/recipes). */
  action: string;
  title: string;
  caption: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface CatalogPage {
  slug: string;
  group: GroupId;
  /** Route: /{group}/{slug}/ */
  href: string;
  /** Nav label and page title. */
  title: string;
  /** Singular name for sentences ("jewelry box"). */
  noun: string;
  short: string;
  hero: { headline: string; sub: string };
  what: string;
  specs: Spec[];
  finishes: string[];
  uses: string[];
  faq: Faq[];
  seo: { title: string; description: string };
  recipe: RecipeId;
  skin: Skin;
  steps: ProcessStep[];
  /** hrefs of related pages. */
  related: string[];
  /** Overview pages list their styles here (hrefs). */
  variants?: string[];
  /** Handed to the quote form. */
  quote: { product: string; note: string };
}

export interface GroupMeta {
  id: GroupId;
  label: string;
  href: string;
  heading: string;
  lead: string;
  seo: { title: string; description: string };
}

export const GROUPS: readonly GroupMeta[] = [
  {
    id: "industry",
    label: "Industry",
    href: "/industry/",
    heading: "Packaging by industry",
    lead: "Start from what you sell. Each page shows the box or bag we usually make for it, and how it is built.",
    seo: { title: "Packaging by industry", description: "Custom packaging for apparel, bakery, chocolate, jewelry, food, cosmetics, electronics and more." },
  },
  {
    id: "shape-and-style",
    label: "Shape & style",
    href: "/shape-and-style/",
    heading: "Packaging by shape and style",
    lead: "Start from the form you have in mind: windows, tuck tops, gables, trays, pillows, bags, tags and labels.",
    seo: { title: "Packaging by shape and style", description: "Window boxes, tuck boxes, gable boxes, pillow boxes, trays and sleeves, paper bags, hang tags and labels." },
  },
  {
    id: "material",
    label: "Material",
    href: "/material/",
    heading: "Packaging by material",
    lead: "Start from the board. Rigid, corrugated, kraft or printed retail carton: what each is good at and how it is made.",
    seo: { title: "Packaging by material", description: "Rigid boxes, corrugated boxes, kraft boxes and retail boxes, made to order." },
  },
  {
    id: "event",
    label: "Event",
    href: "/event/",
    heading: "Packaging for events",
    lead: "Seasonal and brand-moment packaging: the same boxes we make all year, dressed for the occasion.",
    seo: { title: "Packaging for events", description: "Seasonal packaging for Halloween, Christmas, brand anniversaries, Thanksgiving and New Year." },
  },
];

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<GroupId, GroupMeta>;

/* ------------------------------------------------------------------ process steps per recipe */

const T = (noun: string, s: string) => s.replaceAll("{noun}", noun);

interface StepDef { action: string; title: string; caption: string }

/** Default steps of each recipe. `{noun}` becomes the product name; a page can replace any caption. */
const RECIPE_STEPS: Record<RecipeId, StepDef[]> = {
  "rigid-box": [
    { action: "cut-board", title: "Thick board, cut to size", caption: "Stiff greyboard is cut into the base, the lid and the four walls." },
    { action: "wrap-paper", title: "Wrapped in printed paper", caption: "Glue goes on, the printed paper is laid over and pressed flat." },
    { action: "fold-corners", title: "Corners turned and set", caption: "The paper is folded over each edge so the corners are clean and tight." },
    { action: "make-lid", title: "Lid and base come together", caption: "The finished lid is fitted over the base. The two should meet with an even gap." },
    { action: "add-closure", title: "Closure added", caption: "The {noun} gets its closing detail: a magnet, a ribbon or a plain lift-off lid." },
    { action: "fit-insert", title: "Insert fitted", caption: "A cut insert holds the product in place so it does not slide." },
  ],
  "corrugated-box": [
    { action: "sheet", title: "A sheet of corrugated board", caption: "Flat board with a fluted layer inside: light, and strong across its length." },
    { action: "die-cut", title: "Cut with a steel die", caption: "A die cuts the outline of the {noun} and presses the fold lines in one stroke." },
    { action: "crease", title: "Creased along the folds", caption: "The creases let the board bend without cracking the paper." },
    { action: "fold", title: "Folded into a box", caption: "The walls come up and the flaps fold over the top and the bottom." },
    { action: "glue-flap", title: "One seam, glued", caption: "A single glued flap holds the wall together." },
    { action: "tape", title: "Sealed", caption: "The flaps are closed and sealed so the {noun} is ready to be packed." },
    { action: "stack", title: "Stacked for the pallet", caption: "Finished boxes are stacked flat or built, ready to ship to you." },
  ],
  "folding-carton": [
    { action: "print-sheet", title: "Printed flat, edge to edge", caption: "Your artwork is printed on the whole sheet before anything is cut." },
    { action: "die-cut", title: "Cut and creased in one press", caption: "A steel die cuts the outline and presses the fold lines in one stroke." },
    { action: "fold-lines", title: "Folded along the creases", caption: "Each panel of the {noun} bends along its crease, sides first." },
    { action: "glue", title: "One seam, glued", caption: "A thin line of glue joins the side so the carton keeps its shape." },
    { action: "close", title: "Closed", caption: "The top and bottom close with the {noun}'s own style of closing." },
    { action: "pack-flat", title: "Ready for your line", caption: "The finished cartons are counted and packed, flat or built." },
  ],
  "paper-bag": [
    { action: "roll", title: "A roll of paper", caption: "Kraft or coated paper is fed from a roll into the bag machine." },
    { action: "cut", title: "Cut to the bag length", caption: "The paper is cut and the side seam is lined up." },
    { action: "tube", title: "Formed into a tube", caption: "The paper wraps into a tube and the side seam is glued." },
    { action: "bottom-fold", title: "Bottom folded and glued", caption: "The base is folded flat and glued so the bag can stand and carry weight." },
    { action: "handle", title: "Handles attached", caption: "Twisted paper or cord handles are fixed inside the top edge." },
  ],
  pouch: [
    { action: "film-roll", title: "A roll of printed film", caption: "Layers of film that protect against air and moisture come on a roll." },
    { action: "print", title: "Your design printed", caption: "The artwork is printed on the film, then the film is laminated for protection." },
    { action: "seal", title: "Sealed on three sides", caption: "Heat presses the edges together to form the pouch." },
    { action: "zipper", title: "Zipper added", caption: "A press-to-close zipper goes along the top so it can be opened again." },
    { action: "fill", title: "Filled", caption: "On your line, the pouch is opened and filled with the product." },
    { action: "final", title: "Sealed shut", caption: "The top is sealed and the {noun} stands on the shelf." },
  ],
  "label-tag": [
    { action: "sheet", title: "A sheet of stock", caption: "Paper, card or sticker stock is loaded for printing." },
    { action: "print", title: "Printed with your design", caption: "The artwork is printed across the sheet, many at a time." },
    { action: "die-cut", title: "Cut to shape", caption: "A die cuts every {noun} to its outline in one pass." },
    { action: "string-or-peel", title: "Finished for use", caption: "Tags get a hole and a string; stickers are cut on a backing so they peel off cleanly." },
    { action: "apply", title: "Applied to the product", caption: "The {noun} goes onto the product or the pack, ready to sell." },
  ],
  "tray-sleeve": [
    { action: "sheet", title: "A sheet of board", caption: "One sheet for the tray and one for the sleeve, printed flat." },
    { action: "die-cut", title: "Cut and creased", caption: "The dies cut both shapes and press the fold lines." },
    { action: "fold-tray", title: "Tray folded up", caption: "The walls rise and lock in the corners to form an open tray." },
    { action: "slide-sleeve", title: "Sleeve slides over", caption: "The sleeve wraps around the tray and holds the product in view." },
  ],
};

/** Closing style names, used by the folding-carton and rigid-box steps. */
const CLOSE_TEXT: Record<LidKind, [string, string]> = {
  tuck: ["Tucked closed", "The top flap tucks into the front. No glue is needed to close it."],
  "lid-base": ["Lid and base", "A two-piece lid lifts off the base."],
  magnet: ["Magnet closure", "A hidden magnet in the lid snaps shut against the base."],
  shoulder: ["Lid over a shoulder", "A raised neck inside the base holds the lid snug."],
  gable: ["Gable top, with a handle", "The top folds into a roof shape with a handle you can carry it by."],
  pillow: ["Curved sides, then crimped ends", "The sides curve in to the pillow shape, then each end is pressed flat along an arched crimp."],
  flap: ["Two inner flaps, then two outer flaps", "The two short flaps fold in first. The two long flaps fold over them and meet in the middle."],
  none: ["Closed", "The carton closes with its own flaps."],
};

function stepsFor(recipe: RecipeId, skin: Skin, noun: string, notes: Record<string, string>): ProcessStep[] {
  return RECIPE_STEPS[recipe].map((s) => {
    let { title, caption } = s;
    if (recipe === "folding-carton" && s.action === "close") [title, caption] = CLOSE_TEXT[skin.lid];
    if (recipe === "folding-carton" && s.action === "die-cut" && skin.window) caption = "A steel die cuts the outline and the window opening, and presses the fold lines in one stroke.";
    if (recipe === "pouch" && s.action === "zipper" && skin.ratio[1] < 0.15) {
      title = "Peel-and-seal strip";
      caption = "A peel-off adhesive strip goes along the flap, so the bag seals once and shows if it was opened.";
    }
    if (recipe === "label-tag" && skin.card === "sticker") {
      if (s.action === "string-or-peel") { title = "Cut on a backing"; caption = "Each sticker is cut through the face only, so it lifts off the backing and sticks cleanly."; }
      if (s.action === "apply") title = "Peeled and stuck on";
    }
    if (recipe === "label-tag" && skin.card === "tag" && s.action === "string-or-peel") title = "Punched and strung";
    if (recipe === "rigid-box" && s.action === "add-closure") {
      title = skin.lid === "magnet" ? "Magnet closure" : skin.props.includes("ribbon") ? "Ribbon added" : "Closure added";
    }
    return { action: s.action, title, caption: T(noun, notes[s.action] ?? caption) };
  });
}

/* ------------------------------------------------------------------ skins */

const KRAFT = "#b8803f";
const KRAFT_LIGHT = "#c9a26b";
const FOREST = "#1e4d3a";
const INK = "#17231d";

const sk = (o: Partial<Skin> & Pick<Skin, "material" | "base" | "accent" | "ratio">): Skin => ({
  second: o.accent,
  print: "none",
  lid: "none",
  window: false,
  handle: false,
  foil: false,
  props: [],
  ...o,
});

/* ------------------------------------------------------------------ the pages */

interface Entry {
  slug: string;
  group: GroupId;
  title: string;
  /** Singular noun used in sentences. */
  noun: string;
  headline: string;
  short: string;
  what: string;
  recipe: RecipeId;
  skin: Skin;
  materials: string;
  uses: string[];
  finishes: string[];
  extra: Faq;
  notes?: Record<string, string>;
  related: string[];
  variants?: string[];
}

const ENTRIES: Entry[] = [
  /* ---------------- industry */
  {
    slug: "apparel-boxes", group: "industry", title: "Apparel Boxes", noun: "apparel box",
    headline: "A box that keeps the folds you made.",
    short: "Flat mailers and shirt boxes for clothing and textiles.",
    what: "Low, wide boxes that hold folded shirts, scarves and sets flat. They ship well, open easily and can carry your print inside and out.",
    recipe: "corrugated-box",
    skin: sk({ material: "kraft", base: KRAFT_LIGHT, accent: INK, print: "wordmark", ratio: [3, 2.2, 0.7] }),
    materials: "Corrugated mailer board, kraft or white outside",
    uses: ["Shirts and tops", "Scarves and accessories", "Online clothing orders", "Gift sets"],
    finishes: ["Printed inside the lid", "Matte lamination", "Tissue wrap (separate)"],
    extra: { q: "Can the box close without tape?", a: "Yes. A tab-and-slot lock can hold it closed, and we can add a sticker seal or a branded tape if you prefer." },
    notes: { fold: "The low walls come up and the lid folds over, so the {noun} lies flat on a shelf or in a courier bag." },
    related: ["/material/corrugated-boxes/", "/shape-and-style/paper-bags/", "/industry/cosmetic-boxes/"],
  },
  {
    slug: "bakery-and-cake", group: "industry", title: "Bakery & Cake", noun: "bakery box",
    headline: "Let the cake do the selling.",
    short: "Window boxes for cakes, pastries and cookies.",
    what: "Food-safe cartons with a clear window so the product shows. Built for cakes, pastries and cookie assortments that have to survive the trip home.",
    recipe: "folding-carton",
    skin: sk({ material: "white", base: "#f3ede2", accent: "#a2583f", second: KRAFT, print: "stripes", lid: "flap", window: true, ratio: [1.1, 1.1, 0.75] }),
    materials: "Food-safe paperboard with a clear window film",
    uses: ["Whole cakes", "Pastry assortments", "Cookies and brownies", "Takeaway orders"],
    finishes: ["Clear window", "Matte or gloss coating", "Grease-resistant lining (ask us)"],
    extra: { q: "Is the box safe for food?", a: "Tell us what goes inside and we will suggest a food-safe board and lining. Ask for the material details when you request a quote." },
    notes: { "die-cut": "A steel die cuts the outline and the window opening, then the clear film is glued behind it." },
    related: ["/shape-and-style/window-boxes/", "/industry/food-boxes/", "/industry/chocolate-boxes/"],
  },
  {
    slug: "mylar-bags", group: "industry", title: "Mylar Bags", noun: "mylar bag",
    headline: "Sealed against air, light and moisture.",
    short: "Stand-up foil pouches with a zipper, printed to your design.",
    what: "Stand-up pouches made from layered film that blocks air, light and moisture. A good fit for dry foods, tea, coffee and supplements.",
    recipe: "pouch",
    skin: sk({ material: "film", base: "#2a2f2c", accent: "#d8c9a0", second: FOREST, print: "band", ratio: [1, 0.45, 1.5] }),
    materials: "Laminated film, matte or gloss, with a foil layer",
    uses: ["Coffee and tea", "Spices and snacks", "Supplements", "Dry goods"],
    finishes: ["Matte or gloss film", "Clear window (optional)", "Tear notch and zipper"],
    extra: { q: "Can the bag stand on a shelf?", a: "Yes. A gusseted base lets it stand. Tell us the weight of the product so we can suggest a size." },
    related: ["/shape-and-style/paper-bags/", "/industry/food-boxes/", "/industry/health-boxes/"],
  },
  {
    slug: "chocolate-boxes", group: "industry", title: "Chocolate Boxes", noun: "chocolate box",
    headline: "The first piece should feel like a gift.",
    short: "Rigid boxes with cut inserts for chocolates and confectionery.",
    what: "Rigid lid-and-base boxes with a cut insert that gives each piece its own place. A strong choice for gifting and for seasonal ranges.",
    recipe: "rigid-box",
    skin: sk({ material: "color", base: "#4a2c1d", accent: "#d6b36a", second: "#d6b36a", print: "wordmark", lid: "lid-base", foil: true, props: ["ribbon"], ratio: [1.4, 1, 0.5] }),
    materials: "Rigid greyboard wrapped in coated or textured paper",
    uses: ["Gift assortments", "Seasonal ranges", "Wedding favours", "Corporate gifting"],
    finishes: ["Gold or silver foil", "Embossed logo", "Ribbon", "Cut insert"],
    extra: { q: "Can the insert hold different shapes?", a: "Yes. Send us the chocolates or a drawing and we will cut the insert to fit them." },
    related: ["/industry/jewelry-boxes/", "/material/rigid-boxes/", "/event/christmas/"],
  },
  {
    slug: "health-boxes", group: "industry", title: "Health Boxes", noun: "health box",
    headline: "Clear, clean and easy to read.",
    short: "Printed cartons for supplements, medicines and personal care.",
    what: "Folding cartons with a clean layout and room for the text your product needs. They protect the contents and keep the label easy to read.",
    recipe: "folding-carton",
    skin: sk({ material: "white", base: "#f4f2ec", accent: "#2f7a5a", second: "#9db8a0", print: "band", lid: "tuck", ratio: [0.6, 0.35, 1.5] }),
    materials: "White paperboard, coated for sharp print",
    uses: ["Supplements and vitamins", "Over-the-counter products", "Personal care", "Test kits"],
    finishes: ["Matte coating", "Spot gloss on the logo", "Braille (ask us)"],
    extra: { q: "Can you print the required legal text?", a: "We print what you supply. You are responsible for the regulatory wording; we will leave the space and keep it sharp." },
    related: ["/shape-and-style/tuck-boxes/", "/industry/cosmetic-boxes/", "/industry/mylar-bags/"],
  },
  {
    slug: "jewelry-boxes", group: "industry", title: "Jewelry Boxes", noun: "jewelry box",
    headline: "Small box, long memory.",
    short: "Compact rigid boxes with a magnetic lid and a soft insert.",
    what: "Small rigid boxes with a snug lid and an insert that holds rings, earrings or a necklace. Made to feel good in the hand.",
    recipe: "rigid-box",
    skin: sk({ material: "black", base: "#1e1f1d", accent: "#c9a96a", second: "#c9a96a", print: "wordmark", lid: "magnet", foil: true, ratio: [1, 1, 0.55] }),
    materials: "Rigid greyboard wrapped in soft-touch or textured paper",
    uses: ["Rings and earrings", "Necklaces and bracelets", "Watches", "Gift sets"],
    finishes: ["Soft-touch coating", "Foil logo", "Velvet or foam insert", "Magnet closure"],
    extra: { q: "Can the insert be a different color from the box?", a: "Yes. The insert can be foam, card or a wrapped board in a color that suits the box." },
    related: ["/industry/chocolate-boxes/", "/material/rigid-boxes/", "/event/brand-anniversary/"],
  },
  {
    slug: "food-boxes", group: "industry", title: "Food Boxes", noun: "food box",
    headline: "Takeaway that arrives looking right.",
    short: "Kraft and printed cartons for ready meals, snacks and gifts.",
    what: "Folding cartons for meals, snacks and hampers. They hold their shape, carry your print and can have a window so the food shows.",
    recipe: "folding-carton",
    skin: sk({ material: "kraft", base: KRAFT, accent: "#f1ebde", second: "#a2583f", print: "stripes", lid: "tuck", window: true, ratio: [1.2, 0.8, 0.6] }),
    materials: "Kraft or white food-safe paperboard",
    uses: ["Ready meals", "Snacks and sweets", "Hampers", "Delivery orders"],
    finishes: ["Kraft natural", "Window film", "Water-based coating", "One-color print"],
    extra: { q: "Can it hold hot food?", a: "Hot and oily food needs a suitable lining. Tell us what it is and we will advise before you order." },
    related: ["/industry/bakery-and-cake/", "/material/kraft-boxes/", "/shape-and-style/window-boxes/"],
  },
  {
    slug: "display-boxes", group: "industry", title: "Display Boxes", noun: "display box",
    headline: "A box that sells from the counter.",
    short: "Counter and shelf display boxes that hold several products.",
    what: "Boxes that open into a display so the products can sit on the counter. Useful for small items sold side by side.",
    recipe: "corrugated-box",
    skin: sk({ material: "white", base: "#efeadf", accent: FOREST, second: KRAFT, print: "band", ratio: [2, 1.2, 0.9] }),
    materials: "Corrugated or folding board, printed",
    uses: ["Counter displays", "Shelf-ready packs", "Candy and small items", "Product trays"],
    finishes: ["Printed outside and inside", "Matte coating", "Tear-off front"],
    extra: { q: "Can I fill the display myself?", a: "Yes. We make the empty box and ship it flat; you pack and stock it." },
    notes: { fold: "The back and sides come up and the front folds down, so the box opens as a display." },
    related: ["/material/retail-boxes/", "/shape-and-style/trays-and-sleeves/", "/industry/food-boxes/"],
  },
  {
    slug: "pizza-boxes", group: "industry", title: "Pizza Boxes", noun: "pizza box",
    headline: "Hot pizza, flat and ready.",
    short: "Flat corrugated boxes in common pizza sizes, printed with your logo.",
    what: "Flat corrugated boxes with a vented lid, made to carry pizza and keep it warm. They fold from flat and arrive in stacks.",
    recipe: "corrugated-box",
    skin: sk({ material: "kraft", base: "#c4955a", accent: "#7a2a1d", print: "wordmark", ratio: [2, 2, 0.16] }),
    materials: "Corrugated board, kraft or white",
    uses: ["Pizza restaurants", "Delivery brands", "Pastry and flatbread", "Party orders"],
    finishes: ["One-color print", "Kraft natural", "Vent holes"],
    extra: { q: "What sizes are available?", a: "We can make most common pizza sizes. Tell us the diameter of your pizza when you request a quote." },
    notes: { stack: "Finished boxes are stacked flat in tall piles, so a restaurant can store hundreds in a small space." },
    related: ["/material/corrugated-boxes/", "/industry/food-boxes/", "/industry/bakery-and-cake/"],
  },
  {
    slug: "candle-boxes", group: "industry", title: "Candle Boxes", noun: "candle box",
    headline: "A box that matches the scent.",
    short: "Snug cartons for jar candles, tins and gift sets.",
    what: "Tall, snug cartons that hold a candle or a set safely. Soft colors and quiet print suit a candle brand well.",
    recipe: "folding-carton",
    skin: sk({ material: "color", base: "#d9d2bf", accent: "#5b6b4e", second: "#b8803f", print: "wordmark", lid: "tuck", ratio: [0.9, 0.9, 1.0] }),
    materials: "Textured paperboard, cut insert for jars",
    uses: ["Jar candles", "Candle sets", "Wax melts", "Gift boxes"],
    finishes: ["Uncoated feel", "Foil logo", "Card insert to hold the jar"],
    extra: { q: "Can the box hold a heavy jar?", a: "A cardboard insert holds the jar in place. Tell us the weight and size and we will suggest the board." },
    related: ["/industry/cosmetic-boxes/", "/shape-and-style/tuck-boxes/", "/event/christmas/"],
  },
  {
    slug: "cosmetic-boxes", group: "industry", title: "Cosmetic Boxes", noun: "cosmetic box",
    headline: "Beauty starts at the box.",
    short: "Fine-print cartons for skincare, makeup and fragrance.",
    what: "Cartons with sharp print and quiet finishes for skincare and makeup. Often chosen with foil or spot gloss on the logo.",
    recipe: "folding-carton",
    skin: sk({ material: "color", base: "#e3c9bd", accent: "#4a2c27", second: "#c9a96a", print: "wordmark", lid: "tuck", foil: true, ratio: [0.45, 0.45, 1.3] }),
    materials: "Smooth paperboard, fine-print coated",
    uses: ["Skincare", "Makeup", "Fragrance", "Sample sets"],
    finishes: ["Foil stamping", "Spot gloss", "Soft-touch coating", "Embossing"],
    extra: { q: "Can the print match my brand color exactly?", a: "We match colors as closely as printing allows and show you a proof before the run." },
    related: ["/industry/health-boxes/", "/industry/candle-boxes/", "/shape-and-style/tuck-boxes/"],
  },
  {
    slug: "electronic-boxes", group: "industry", title: "Electronic Boxes", noun: "electronics box",
    headline: "Protect the device, present the brand.",
    short: "Rigid and corrugated boxes with fitted inserts for devices.",
    what: "Boxes with an insert cut to the device, accessories and cables. The lid fits snugly so the product arrives undamaged and well presented.",
    recipe: "rigid-box",
    skin: sk({ material: "white", base: "#e9e8e3", accent: "#2b3a33", second: FOREST, print: "wordmark", lid: "shoulder", ratio: [1.5, 1, 0.55] }),
    materials: "Rigid greyboard, cut EVA or card insert",
    uses: ["Phones and tablets", "Headphones", "Chargers and cables", "Smart devices"],
    finishes: ["Matte lamination", "Cut inserts", "Printed inside the lid"],
    extra: { q: "Can you make the insert from my CAD file?", a: "Send the drawing or the product, and we will cut the insert to match it." },
    related: ["/material/rigid-boxes/", "/industry/display-boxes/", "/industry/jewelry-boxes/"],
  },

  /* ---------------- shape and style */
  {
    slug: "window-boxes", group: "shape-and-style", title: "Window Boxes", noun: "window box",
    headline: "Show the product, keep it protected.",
    short: "Cartons with a clear window cut into the front.",
    what: "A carton with a cut-out and a clear film behind it. Customers see the product, and the box still carries your print.",
    recipe: "folding-carton",
    skin: sk({ material: "white", base: "#f1ebde", accent: FOREST, second: KRAFT, print: "band", lid: "tuck", window: true, ratio: [1, 0.6, 1] }),
    materials: "Paperboard with clear PET or biodegradable window film",
    uses: ["Food and sweets", "Toys", "Cosmetics", "Small gifts"],
    finishes: ["Clear film", "Matte coating", "Different window shapes"],
    extra: { q: "Can the window have any shape?", a: "Most shapes are fine if the die can cut them. Very thin shapes can be fragile, so we will tell you if it needs changing." },
    related: ["/industry/bakery-and-cake/", "/industry/food-boxes/", "/shape-and-style/tuck-boxes/"],
  },
  {
    slug: "tuck-boxes", group: "shape-and-style", title: "Tuck Boxes", noun: "tuck box",
    headline: "The simplest way to close a carton.",
    short: "Folding cartons that close with a tuck-in flap.",
    what: "The most common folding carton: a top flap tucks into the front panel. It needs no glue to close, ships flat and is cost-effective for most products.",
    recipe: "folding-carton",
    skin: sk({ material: "white", base: "#efe8d8", accent: "#a2583f", second: FOREST, print: "stripes", lid: "tuck", ratio: [0.8, 0.5, 1.2] }),
    materials: "Paperboard or kraft board, 1 to 4 color print",
    uses: ["Cosmetics", "Supplements", "Small electronics", "Retail products"],
    finishes: ["Matte or gloss coating", "Foil", "Spot UV", "Embossing"],
    extra: { q: "What is the difference between straight tuck and reverse tuck?", a: "A straight tuck opens on the same side at the top and bottom. A reverse tuck opens on opposite sides. We will show the style that suits your product." },
    related: ["/industry/cosmetic-boxes/", "/industry/health-boxes/", "/shape-and-style/window-boxes/"],
  },
  {
    slug: "gable-boxes", group: "shape-and-style", title: "Gable Boxes", noun: "gable box",
    headline: "A box with a handle built in.",
    short: "Roof-topped cartons you can carry by the top.",
    what: "A carton with a gabled roof and a carry handle. Popular for party favours, treats and small gifts, and a quick, friendly way to give a product.",
    recipe: "folding-carton",
    skin: sk({ material: "color", base: "#e4d9c1", accent: "#a2583f", second: FOREST, print: "dots", lid: "gable", handle: true, ratio: [0.9, 0.7, 1.0] }),
    materials: "Paperboard or kraft board",
    uses: ["Party favours", "Treat boxes", "Take-home gifts", "Small food gifts"],
    finishes: ["Printed outside", "Window on the side", "Matte coating"],
    extra: { q: "Can the gable box hold liquids?", a: "Not by itself. Add a sealed inner pack if the product is liquid." },
    related: ["/shape-and-style/pillow-boxes/", "/event/halloween/", "/industry/food-boxes/"],
  },
  {
    slug: "hang-tags", group: "shape-and-style", title: "Hang Tags", noun: "hang tag",
    headline: "The small card that finishes the product.",
    short: "Printed tags with a hole and string, for clothing and gifts.",
    what: "A printed card with a punched hole and a string or a ribbon. Hang tags carry the brand, the care notes or a short story.",
    recipe: "label-tag",
    skin: sk({ material: "kraft", base: KRAFT_LIGHT, accent: INK, second: FOREST, print: "wordmark", card: "tag", ratio: [0.5, 0.02, 1] }),
    materials: "Card stock, kraft or white, 300 to 400 gsm class",
    uses: ["Clothing", "Candles and soaps", "Handmade goods", "Gift wrap"],
    finishes: ["Matte or gloss coating", "Foil", "Rounded corners", "String or ribbon"],
    extra: { q: "Can the tag have a custom shape?", a: "Yes, as long as there is a die for it. A new die can be made for an extra cost." },
    related: ["/shape-and-style/labels-and-stickers/", "/industry/apparel-boxes/", "/shape-and-style/paper-bags/"],
  },
  {
    slug: "trays-and-sleeves", group: "shape-and-style", title: "Trays and Sleeves", noun: "tray and sleeve",
    headline: "Slide it out, slide it back.",
    short: "An open tray and a printed sleeve that holds it.",
    what: "A tray holds the product and a printed sleeve wraps around it. It is quick to pack, easy to open and shows the product when the tray slides out.",
    recipe: "tray-sleeve",
    skin: sk({ material: "white", base: "#eee8d9", accent: FOREST, second: KRAFT, print: "band", ratio: [1.3, 0.9, 0.35] }),
    materials: "Paperboard or kraft board for the tray, printed sleeve",
    uses: ["Soap and bath products", "Food and snacks", "Stationery", "Gift sets"],
    finishes: ["Matte coating", "Foil on the sleeve", "Kraft tray with printed sleeve"],
    extra: { q: "Does the sleeve hold the tray tightly?", a: "It should hold the tray with light friction. We can add a small notch or a finger cut-out if you want it easier to open." },
    related: ["/material/retail-boxes/", "/industry/display-boxes/", "/industry/food-boxes/"],
  },
  {
    slug: "folding-cartons", group: "shape-and-style", title: "Folding Cartons", noun: "folding carton",
    headline: "One flat sheet, many ways to close it.",
    short: "Printed cartons that ship flat and fold up on your line.",
    what: "The folding carton is the everyday retail box: printed on one flat sheet, cut and creased, then folded and glued. It ships flat, so it stores and travels cheaply. The style you pick (tuck, window, pillow or gable) changes how it closes and how it looks.",
    recipe: "folding-carton",
    skin: sk({ material: "white", base: "#efe8d8", accent: FOREST, second: KRAFT, print: "band", lid: "tuck", ratio: [0.9, 0.6, 1.3] }),
    materials: "Paperboard or kraft board, coated or uncoated",
    uses: ["Cosmetics and health", "Food and gifts", "Small electronics", "Retail products"],
    finishes: ["Matte or gloss coating", "Foil", "Spot UV", "Embossing", "Window film"],
    extra: { q: "How do I pick a style?", a: "Choose the closing for how the product is used. A tuck is the simplest, a window shows the product, a pillow suits small light gifts and a gable adds a handle. Tell us what is going in and we will suggest one." },
    related: ["/material/retail-boxes/", "/material/kraft-boxes/", "/industry/cosmetic-boxes/"],
    variants: ["/shape-and-style/tuck-boxes/", "/shape-and-style/window-boxes/", "/shape-and-style/pillow-boxes/", "/shape-and-style/gable-boxes/"],
  },
  {
    slug: "poly-and-courier-bags", group: "shape-and-style", title: "Poly & Courier Bags", noun: "courier bag",
    headline: "Light, sealed and ready to post.",
    short: "Printed poly mailers and tamper-evident courier bags.",
    what: "Thin, strong bags for clothing and soft goods that are posted rather than shelved. They are light, waterproof and seal shut with a peel-off strip, so the parcel shows if it was opened on the way.",
    recipe: "pouch",
    skin: sk({ material: "film", base: "#dfe5e1", accent: FOREST, second: KRAFT, print: "wordmark", ratio: [1.1, 0.04, 1.4] }),
    materials: "Poly film, matte or gloss, single or co-extruded layers",
    uses: ["Clothing and textiles", "Online stores", "Couriers and returns", "Soft goods"],
    finishes: ["Matte or gloss film", "Peel-and-seal strip", "Tamper-evident seal", "One to four colors"],
    extra: { q: "Are the bags waterproof?", a: "Poly film keeps out rain and splashes. If your goods are very sensitive to moisture, tell us and we will suggest a thicker film." },
    related: ["/industry/mylar-bags/", "/shape-and-style/paper-bags/", "/industry/apparel-boxes/"],
  },
  {
    slug: "pillow-boxes", group: "shape-and-style", title: "Pillow Boxes", noun: "pillow box",
    headline: "A soft shape for small gifts.",
    short: "Curved-end cartons for favours, jewelry and small gifts.",
    what: "A small carton whose ends curve and meet like a pillow. It is light, flat when shipped and pretty enough to need no wrapping.",
    recipe: "folding-carton",
    skin: sk({ material: "color", base: "#e9e0cf", accent: "#1e4d3a", second: KRAFT, print: "dots", lid: "pillow", ratio: [1, 0.6, 0.3] }),
    materials: "Paperboard or kraft board",
    uses: ["Wedding and party favours", "Jewelry", "Small gifts", "Sample products"],
    finishes: ["Printed outside", "Matte coating", "Window (optional)"],
    extra: { q: "How much can a pillow box hold?", a: "These suit light items. Tell us the weight and size of the product and we will tell you if a different shape is better." },
    related: ["/shape-and-style/gable-boxes/", "/industry/jewelry-boxes/", "/event/christmas/"],
  },
  {
    slug: "paper-bags", group: "shape-and-style", title: "Paper Bags", noun: "paper bag",
    headline: "A bag people reuse.",
    short: "Kraft and printed paper bags with twisted or flat handles.",
    what: "Paper carrier bags for shops and takeaways, printed with your logo. Strong enough to be reused and recycled with paper.",
    recipe: "paper-bag",
    skin: sk({ material: "kraft", base: KRAFT, accent: "#f1ebde", print: "wordmark", handle: true, ratio: [1, 0.5, 1.25] }),
    materials: "Kraft or coated paper, twisted paper or cord handle",
    uses: ["Retail shopping", "Takeaway food", "Gift bags", "Events"],
    finishes: ["Kraft natural", "One to four colors", "Cord or paper handles"],
    extra: { q: "How much weight can the bag hold?", a: "It depends on the paper and the handle. Tell us what it will carry and we will suggest the strength." },
    related: ["/industry/mylar-bags/", "/shape-and-style/hang-tags/", "/material/kraft-boxes/"],
  },
  {
    slug: "labels-and-stickers", group: "shape-and-style", title: "Labels & Stickers", noun: "label",
    headline: "The detail that finishes the pack.",
    short: "Printed labels and stickers on sheets or rolls, in any shape.",
    what: "Labels and stickers printed to any shape, on sheets or rolls. Useful for sealing a box, labelling a jar or branding a plain bag.",
    recipe: "label-tag",
    skin: sk({ material: "white", base: "#f4f0e6", accent: "#a2583f", second: FOREST, print: "wordmark", card: "sticker", ratio: [1, 0.01, 1] }),
    materials: "Paper or film sticker stock, matte or gloss",
    uses: ["Jars and bottles", "Sealing boxes", "Branding plain bags", "Shipping labels"],
    finishes: ["Matte or gloss", "Clear film", "Foil", "Kiss-cut or die-cut"],
    extra: { q: "Are the labels waterproof?", a: "Film labels resist water. Paper labels do not. Tell us where it will be used." },
    related: ["/shape-and-style/hang-tags/", "/industry/mylar-bags/", "/shape-and-style/paper-bags/"],
  },

  /* ---------------- material */
  {
    slug: "rigid-boxes", group: "material", title: "Rigid Boxes", noun: "rigid box",
    headline: "Board thick enough to feel like a decision.",
    short: "Thick, wrapped boxes for premium products and gifts.",
    what: "Boxes made from thick greyboard wrapped in printed paper. They do not fold flat, hold their shape for years and give a product a premium feel.",
    recipe: "rigid-box",
    skin: sk({ material: "color", base: "#264d3d", accent: "#d6b36a", second: "#d6b36a", print: "wordmark", lid: "lid-base", foil: true, ratio: [1.4, 1, 0.6] }),
    materials: "Greyboard, 1.5 to 3 mm class, wrapped in printed or textured paper",
    uses: ["Premium gifts", "Cosmetics and fragrance", "Electronics", "Subscription boxes"],
    finishes: ["Foil and embossing", "Magnet or ribbon closure", "Soft-touch coating", "Fitted insert"],
    extra: { q: "Do rigid boxes ship flat?", a: "No. They are made and shipped built, so they take more space than folding cartons. Some styles can be collapsible; ask us." },
    related: ["/industry/jewelry-boxes/", "/industry/chocolate-boxes/", "/industry/electronic-boxes/"],
  },
  {
    slug: "corrugated-boxes", group: "material", title: "Corrugated Boxes", noun: "corrugated box",
    headline: "Strong because of what is inside the board.",
    short: "Shipping and mailer boxes made from fluted board.",
    what: "Boxes made from board with a fluted layer between two flat sheets. Light and strong, they are the standard for shipping and for protecting products in transit.",
    recipe: "corrugated-box",
    skin: sk({ material: "kraft", base: "#c59a5d", accent: INK, print: "wordmark", ratio: [1.5, 1.1, 1] }),
    materials: "Single-wall or double-wall corrugated board, kraft or white",
    uses: ["E-commerce shipping", "Export cartons", "Mailers", "Bulk packing"],
    finishes: ["One-color print", "Full-color print", "Water-based coating", "Custom inserts"],
    extra: { q: "What do 3, 5 and 7 ply mean?", a: "It is the number of paper layers in the board. More layers make it stiffer and stronger. We will suggest what suits your product's weight." },
    related: ["/industry/pizza-boxes/", "/industry/apparel-boxes/", "/industry/display-boxes/"],
  },
  {
    slug: "kraft-boxes", group: "material", title: "Kraft Boxes", noun: "kraft box",
    headline: "Brown paper, honest and recyclable.",
    short: "Unbleached kraft cartons and mailers with a natural look.",
    what: "Boxes made from natural kraft paper. They look honest, print well in one or two colors and are easy to recycle with paper.",
    recipe: "folding-carton",
    skin: sk({ material: "kraft", base: KRAFT, accent: "#f1ebde", second: FOREST, print: "wordmark", lid: "tuck", ratio: [1, 0.7, 0.9] }),
    materials: "Kraft paperboard or corrugated kraft",
    uses: ["Eco-minded brands", "Food and bakery", "Soap and candles", "E-commerce"],
    finishes: ["Natural kraft", "One-color print", "White ink", "Water-based coating"],
    extra: { q: "Can kraft be printed in full color?", a: "Yes, but colors look warmer and softer on kraft than on white. We can show a proof." },
    related: ["/industry/food-boxes/", "/shape-and-style/paper-bags/", "/material/corrugated-boxes/"],
  },
  {
    slug: "retail-boxes", group: "material", title: "Retail Boxes", noun: "retail box",
    headline: "Made to stand out on a shelf.",
    short: "Printed folding cartons for products sold in shops.",
    what: "Printed cartons for products sold in shops. They are designed to be read from a distance, stack on a shelf and survive handling.",
    recipe: "folding-carton",
    skin: sk({ material: "white", base: "#f0ebe0", accent: "#a2583f", second: FOREST, print: "full", lid: "tuck", ratio: [0.8, 0.5, 1.3] }),
    materials: "Coated paperboard, full-color print",
    uses: ["Consumer goods", "Cosmetics and health", "Electronics accessories", "Gifts"],
    finishes: ["Full-color print", "Matte or gloss coating", "Spot UV", "Foil"],
    extra: { q: "Can you help with the dieline?", a: "Yes. Send the size and we will send a dieline you or your designer can print on." },
    related: ["/shape-and-style/tuck-boxes/", "/industry/display-boxes/", "/industry/cosmetic-boxes/"],
  },

  /* ---------------- event */
  {
    slug: "halloween", group: "event", title: "Halloween", noun: "Halloween box",
    headline: "Treat boxes with a little mischief.",
    short: "Treat boxes and bags in orange and black, with bats and pumpkins.",
    what: "Folding cartons for treats and party favours, in autumn colors and simple Halloween shapes. We can print your own design for a seasonal range.",
    recipe: "folding-carton",
    skin: sk({ material: "color", base: "#d9741f", accent: "#1c1a18", second: "#f1ebde", print: "dots", lid: "gable", handle: true, props: ["pumpkin", "bat"], ratio: [0.9, 0.7, 1.0] }),
    materials: "Paperboard, printed in orange and black",
    uses: ["Treats and sweets", "Party favours", "Seasonal retail", "Event gifts"],
    finishes: ["Spot gloss", "Window", "Handle", "Printed inside"],
    extra: { q: "When should I order a seasonal range?", a: "Plan early. Seasonal runs share the same production queue as everything else; ask us about timing when you request a quote." },
    notes: { "pack-flat": "Orange cartons are counted and packed. Bats and pumpkins are printed shapes: your own seasonal artwork goes in their place."  },
    related: ["/shape-and-style/gable-boxes/", "/event/thanksgiving/", "/event/christmas/"],
  },
  {
    slug: "christmas", group: "event", title: "Christmas", noun: "Christmas box",
    headline: "Wrapped before it is wrapped.",
    short: "Gift boxes in red and green, with ribbon and simple stars.",
    what: "Gift boxes with a ribbon and a festive print, for chocolates, candles and hampers. The same rigid boxes we make all year, dressed for the season.",
    recipe: "rigid-box",
    skin: sk({ material: "color", base: "#9c2b27", accent: "#f1ebde", second: "#1e4d3a", print: "stripes", lid: "lid-base", props: ["ribbon", "snowflake", "bow"], ratio: [1.3, 1, 0.55] }),
    materials: "Rigid greyboard wrapped in printed paper, ribbon",
    uses: ["Chocolates and sweets", "Candles", "Corporate gifts", "Hampers"],
    finishes: ["Ribbon", "Foil", "Embossing", "Printed inside"],
    extra: { q: "Can I use my own design instead of red and green?", a: "Yes. The colors shown are only an example. We print your artwork." },
    notes: { "fit-insert": "A cut insert holds the chocolates or the candle. The ribbon and the colors here are an example, not a fixed design."  },
    related: ["/industry/chocolate-boxes/", "/industry/candle-boxes/", "/event/new-year/"],
  },
  {
    slug: "brand-anniversary", group: "event", title: "Brand Anniversary", noun: "anniversary box",
    headline: "Mark the year, keep the box.",
    short: "Limited-edition boxes with foil and a commemorative print.",
    what: "A limited run that marks your brand's milestone: a special color, foil and a printed message. Often given to customers, partners or staff.",
    recipe: "rigid-box",
    skin: sk({ material: "black", base: "#20201e", accent: "#d6b36a", second: "#d6b36a", print: "wordmark", lid: "magnet", foil: true, props: ["star"], ratio: [1.2, 1, 0.5] }),
    materials: "Rigid greyboard, foil and embossing on a dark wrap",
    uses: ["Customer gifts", "Partner gifts", "Launch events", "Limited editions"],
    finishes: ["Gold foil", "Embossed year", "Magnet closure", "Numbered insert card"],
    extra: { q: "Can each box carry a number?", a: "Numbering is possible with an extra print step. Ask us when you request a quote." },
    notes: { "fit-insert": "A numbered card and a fitted insert go inside. The foil year and the star are replaced with your own mark."  },
    related: ["/industry/jewelry-boxes/", "/material/rigid-boxes/", "/event/new-year/"],
  },
  {
    slug: "thanksgiving", group: "event", title: "Thanksgiving", noun: "Thanksgiving box",
    headline: "Pack the pie and the thanks.",
    short: "Kraft cartons with a warm print and autumn leaves.",
    what: "Sturdy kraft boxes with a warm autumn print, for pies, baked goods and gift hampers that travel to someone's table.",
    recipe: "corrugated-box",
    skin: sk({ material: "kraft", base: "#c08a4a", accent: "#7a2a1d", second: "#d9741f", print: "dots", props: ["leaf"], ratio: [1.4, 1.2, 0.8] }),
    materials: "Kraft corrugated board, one or two colors",
    uses: ["Pies and baked goods", "Food hampers", "Corporate gifts", "Delivery orders"],
    finishes: ["Natural kraft", "One or two color print", "Window", "Inserts"],
    extra: { q: "Is it strong enough to ship?", a: "Corrugated board is made for shipping. Tell us what goes inside so we can match the board." },
    notes: { stack: "The boxes are stacked on the pallet with the autumn print facing out. Leaves are only decoration for this page."  },
    related: ["/event/halloween/", "/industry/bakery-and-cake/", "/material/kraft-boxes/"],
  },
  {
    slug: "new-year", group: "event", title: "New Year", noun: "New Year box",
    headline: "Start the year with something wrapped.",
    short: "Dark boxes with gold foil and a scatter of confetti print.",
    what: "Gift boxes for the turn of the year: a dark wrap, gold foil and a lively print. Suits gifts, sweets and corporate greetings.",
    recipe: "rigid-box",
    skin: sk({ material: "black", base: "#171b2a", accent: "#e0c27a", second: "#e0c27a", print: "dots", lid: "lid-base", foil: true, props: ["confetti", "star"], ratio: [1.3, 1, 0.5] }),
    materials: "Rigid greyboard, foil and printed paper",
    uses: ["Corporate greetings", "Sweets and gifts", "Client thank-yous", "Event favours"],
    finishes: ["Gold foil", "Embossing", "Ribbon", "Printed inside"],
    extra: { q: "Can you print a year or a greeting?", a: "Yes. Send the text and we will place it on the lid." },
    notes: { "fit-insert": "A fitted insert holds the gift. Gold foil, stars and confetti are an example of a seasonal print."  },
    related: ["/event/christmas/", "/event/brand-anniversary/", "/industry/chocolate-boxes/"],
  },
];

/* ------------------------------------------------------------------ build the pages */

function specsFor(e: Entry): Spec[] {
  return [
    { label: "What it is", value: e.short },
    { label: "Materials", value: e.materials },
    { label: "Sizes", value: "Made to your size. Send the product's length, width and height." },
    { label: "Print", value: e.skin.print === "none" ? "Plain, or printed to your artwork" : "Printed to your artwork" },
    { label: "Minimum order", value: "Depends on size and print. Tell us the quantity you have in mind." },
    { label: "Lead time", value: "Confirmed with your quote, after the artwork is approved." },
  ];
}

function faqFor(e: Entry): Faq[] {
  return [
    e.extra,
    { q: "What is the minimum order?", a: "It depends on the size, the board and the print. Send us the quantity you have in mind and we will tell you what is possible." },
    { q: "How long does an order take?", a: "We confirm the lead time with your quote, once the artwork is approved." },
    { q: "Can I get a sample first?", a: "Yes, ask for a sample or a plain white mock-up when you request your quote." },
    { q: "Can I order a size that is not on this page?", a: "Yes. Every size is made to order. Tell us the dimensions of your product." },
  ];
}

export const PAGES: readonly CatalogPage[] = ENTRIES.map((e): CatalogPage => ({
  slug: e.slug,
  group: e.group,
  href: `/${e.group}/${e.slug}/`,
  title: e.title,
  noun: e.noun,
  short: e.short,
  hero: { headline: e.headline, sub: e.short },
  what: e.what,
  specs: specsFor(e),
  finishes: e.finishes,
  uses: e.uses,
  faq: faqFor(e),
  seo: {
    title: `${e.title} | ${e.headline.replace(/\.$/, "")}`,
    description: `${e.short} ${e.what}`.slice(0, 200),
  },
  recipe: e.recipe,
  skin: e.skin,
  steps: stepsFor(e.recipe, e.skin, e.noun, e.notes ?? {}),
  related: e.related,
  variants: e.variants,
  quote: { product: e.title, note: `I am interested in: ${e.title}.` },
}));

export const PAGE_BY_HREF = Object.fromEntries(PAGES.map((p) => [p.href, p])) as Record<string, CatalogPage>;
export const pagesIn = (g: GroupId) => PAGES.filter((p) => p.group === g);
export const getPage = (group: string, slug: string) => PAGES.find((p) => p.group === group && p.slug === slug);

/* ------------------------------------------------------------------ nav + shared links */

export interface NavItem {
  label: string;
  href?: string;
  group?: GroupId;
  items?: { label: string; href: string; recipe: RecipeId }[];
}

/** Header menu, in order. Dropdowns are built from the pages above, so adding a page adds it to the menu. */
export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  ...GROUPS.map((g): NavItem => ({ label: g.label, href: g.href, group: g.id, items: pagesIn(g.id).map((p) => ({ label: p.title, href: p.href, recipe: p.recipe })) })),
  { label: "Design your box", href: "/configurator/" },
  { label: "Contact us", href: "/contact/" },
];

export const ROUTES = { quote: "/quote/", contact: "/contact/", configurator: "/configurator/" } as const;

/** Quote link that carries the product name to the quote form. */
export const quoteHref = (product?: string, note?: string) => {
  const q = new URLSearchParams();
  if (product) q.set("product", product);
  if (note) q.set("note", note);
  const s = q.toString();
  return s ? `${ROUTES.quote}?${s}` : ROUTES.quote;
};

/** The six homepage categories (site.products.items ids) and the page each one opens. */
export const HOME_CATEGORY_HREF: Record<string, string> = {
  corrugated: "/material/corrugated-boxes/",
  folding: "/shape-and-style/folding-cartons/",
  rigid: "/material/rigid-boxes/",
  pouches: "/industry/mylar-bags/",
  courier: "/shape-and-style/poly-and-courier-bags/",
  eco: "/shape-and-style/paper-bags/",
};
