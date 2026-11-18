# Content guide (for the owner and for developers)

Everything a visitor reads or sees is in a few data files. This guide says which file to open, how to add a product page, and what is still placeholder. **Never invent testimonials, statistics, prices, certifications or client logos**: those sections stay empty until real material exists.

## 1. Which file holds which words

| To change | Open | Look for |
|---|---|---|
| Brand name, tagline, site URL, phone, WhatsApp, email, address, hours, social links | `src/content/siteCore.ts` | the values at the top |
| Homepage words, footer, the film's stage titles and lines, quote texts, SEO title | `src/content/site.ts` | the same words you see on the page |
| A product page (text, specs, FAQ, colours, seasonal props, card drawing, filter tags) | `src/content/catalog.ts` | the page title, e.g. `"Rigid Boxes"` |
| Hub page copy (count words, filter label, "how it is made" strip) | `src/content/catalog.ts` | `HUB` |
| Page-end copy (related heading, quote band headline and line) | `src/content/catalog.ts` | `PAGE_END` |
| Homepage-only wording of the eco design (hero, products heading, process steps, quote) | `src/templates/eco/copy.ts` | `TODO(owner)` marks |
| Quote page words and privacy note | `src/content/quoteWizard.ts` | |
| Contact page words, FAQ, map link | `src/content/contactPage.ts` | |
| Privacy policy and terms | `src/content/legal.ts` | |
| Staging/production indexing | `src/content/launch.ts` (read-only logic; set the env variable at build) | |

Only change the text between the quote marks. Keep commas and quote marks. If a page breaks after an edit, undo it and read the error `npm run dev` prints. After changing page titles or adding pages, `npm run build` regenerates the menu data (`scripts/gen-nav.mjs`); you can also run it by hand.

## 2. Add a new product page

1. Open `src/content/catalog.ts`. Find a similar entry in `ENTRIES` (for example `slug: "tuck-boxes"`) and copy the whole `{ ... }` block.
2. Change `slug` (the address, lowercase with dashes), `group`, `title`, `noun` (singular, for sentences), the texts (`headline`, `short`, `what`), `uses`, `finishes` and the FAQ line (`extra`).
3. Choose the film and look:
   - `recipe`: how it is made (`rigid-box`, `corrugated-box`, `folding-carton`, `paper-bag`, `pouch`, `label-tag`, `tray-sleeve`).
   - `skin`: material, colours (`base`, `accent`, `second`), print style, size ratio, lid, window, handle, foil, seasonal `props`.
   - `art`: which line drawing the card shows (one of the 24 kinds listed in `IllustrationKind`).
   - `tags`: the product family first (Boxes, Cartons, Bags, Pouches, Tags, Labels), then material and features. Tags used by at least two pages of a hub (and not all of them) become filter chips on that hub.
4. Add its address to the `related` list of two or three other pages if you want hand-picked links (related products are also chosen automatically by recipe and group).
5. Save. The menu, the hub page, the sitemap, the quote form's product list and the 3D page all update. Run `npm run build` to check.

## 3. Add a new illustration

Add a `case` to `Drawing` in `src/catalog/ProductIllustration.tsx` using the `box()` helper and the `ic-*` classes (`ic-l`, `ic-r`, `ic-t`, `ic-in`, `ic-ac`, `ic-s`), add the new key to `IllustrationKind` in `catalog.ts`, and give a page that `art` value. Parts that should move on hover carry a class (`ic-lid`, `ic-handle`, `ic-puff`, `ic-swing`, `ic-sleeve`, `ic-peel`, `ic-flapA/B`); `pageEnd.css` animates them.

## 4. What is still placeholder

| Item | Where | Note |
|---|---|---|
| Brand name "PackNova", tagline, URL `https://example.com` | `siteCore.ts` | `public/og-eco.png` and the hero posters have the brand baked in; regenerate with `scripts/export-images.mjs` (see [3d-and-animation.md](3d-and-animation.md)) after renaming |
| Phone, WhatsApp (`+92 300 0000000`), email (`hello@example.com`), address, hours, social links | `siteCore.ts` | the WhatsApp link format is `https://wa.me/<digits>` |
| Logo | `components/ui/Logo.tsx` | a text wordmark with a small SVG box mark |
| Photos (products, factory) | `site.media` | empty slots render nothing |
| Reviews and client logos | `site.reviews` | intentionally empty |
| MOQ, lead time, prices, certifications | product `specs` | say "confirmed with the quote" until real values are supplied |
| Privacy policy and terms | `legal.ts` | placeholder, marked "not reviewed by a lawyer" |
| Map | `contactPage.ts` | placeholder block until a real map link is added |
| Form service | env variable | WhatsApp and email work without it |

`CONTENT-TODO.md` in the repository root is the longer version of this list (some file names in it are older than the current code).

## 5. Before going live

1. Replace the placeholders above (brand, contact, legal, photos if available, real specs).
2. Regenerate `og-eco.png` and the posters after renaming the brand.
3. Decide on the form service (or keep WhatsApp and email only).
4. Set the production secrets and the `PRODUCTION_SITE_URL` variable, then run the production workflow ([deployment.md](deployment.md)). The production build sets `NEXT_PUBLIC_ALLOW_INDEXING=1`.
5. Submit `sitemap.xml` to search engines; check the privacy text if analytics or a form service is added.
6. Test on a real phone (`PHONE-TEST.md`), and in Safari and Firefox (not tested so far).

## 6. Tone of the copy

Sentence case, plain verbs, specific labels ("Get a quote for Rigid Boxes", not "Submit"), no invented claims, no promised reply times, errors say what to do next.
