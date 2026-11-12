# Content TODO

Everything below is **dummy content** that is shown on the live site as if it were real.
Replace it before launch. All brand values and copy live in **`src/content/site.ts`**: one edit there updates every place listed.

## 1. Brand and contact values (edit `src/content/site.ts`)

| Value | Dummy | `site.ts` key | Where it appears |
| --- | --- | --- | --- |
| Company name | PackNova | `brand.name` | Logo (navbar, footer) `ui/Logo.tsx`; footer copyright `sections/Footer.tsx`; page titles/Open Graph `app/layout.tsx`, `app/configurator/page.tsx`; the logo printed on the 3D carton in the making-of story `lib/dieline.ts` |
| Tagline | Packaging that makes your product unforgettable. | `brand.tagline` | Open Graph image alt text `app/layout.tsx` |
| Short description | Custom boxes, cartons and pouches, designed in 3D and made to order. | `brand.description`, `footer.blurb` | Footer `sections/Footer.tsx` |
| Site URL | https://example.com | `brand.url` | Absolute Open Graph URLs `app/layout.tsx` (set to the real domain) |
| Phone | +92 300 0000000 | `contact.phone`, `contact.phoneHref` | Footer; quote section `sections/Quote.tsx` |
| WhatsApp | +92 300 0000000 | `contact.whatsapp`, `contact.whatsappHref` (`https://wa.me/<digits>`) | Footer; quote section |
| Email | hello@example.com | `contact.email` | Footer; quote section; "Request a quote with these specs" mailto on `/configurator/` (`app/configurator/ConfiguratorClient.tsx`) |
| Address | Plot 00, Industrial Area, Lahore, Pakistan | `contact.address` | Footer |
| Working hours | Mon to Sat, 9:00 AM to 6:00 PM | `contact.hours` | Footer; quote section |
| Social links | `#` (Instagram, Facebook, LinkedIn) | `social[]` | Footer |
| SEO title / description | see file | `seo.title`, `seo.description` | `<title>`, meta description, Open Graph, Twitter card |

## 2. Images that contain the brand (regenerate after renaming)

- `public/og.png` (1200x630 social preview) has the name, headline and tagline **baked into the picture**.
- `public/textures/hero-poster.webp` is a render of the 3D box (no text), so it only needs redoing if the box design changes.

Both were rendered from the live 3D scene. Steps to redo them: `scripts/export-images.md`.

## 3. Copy I wrote (review and approve or rewrite, all in `site.ts`)

Hero eyebrow and scroll hint; the one-line description, spec line and "best for" tags of the six products (the headline lines and "best for" lists you supplied are used as given); the four process step descriptions; configurator page notes; quote form labels and success message; footer link groups; loader messages; page titles and meta descriptions.

## 4. Things still to provide (nothing is invented for these)

- [ ] Real logo file (the current one is a text wordmark plus a small SVG box mark in `ui/Logo.tsx`)
- [ ] Real brand colors if different (CSS variables at the top of `src/app/globals.css`)
- [ ] Real social profile URLs
- [ ] Real product photos / sample photos (none are used; see `CREDITS.md`)
- [ ] Real products and **prices** (no prices are shown anywhere)
- [ ] **Certifications** (ISO, FSC, etc.): none are claimed; add a section only with documents
- [ ] **Testimonials and client logos**: none are shown; add only real ones with permission
- [ ] **Statistics** (years in business, orders delivered, etc.): none are shown
- [ ] Real 3D models for the hero box and products, if you want something other than the procedural ones (compression steps: `scripts/optimize-models.md`)
- [ ] Urdu translation (add a second object in `site.ts`; see the comment at the top of that file)

## 5. Engineering TODOs

- [ ] **Quote form service.** The form has no backend. A valid submit opens a prefilled WhatsApp chat (number from `site.ts`) and offers a mailto fallback; nothing is sent until the visitor presses send there. Add a real form service later (marked `TODO(form-service)` in `src/components/sections/QuoteForm.tsx`) so requests are captured without relying on WhatsApp.
- [ ] Full configurator (artwork upload, pricing). `/configurator/` is a live 3D preview only.
- [ ] Privacy/cookie text, if analytics or a backend are added.

## 4. Reviews and clients (intentionally empty)

`site.reviews.items` and `site.reviews.clients` in `src/content/site.ts` are empty arrays, so the section is not shown. Add **real** entries only, with permission to publish them. Never add invented testimonials, statistics, client logos or certifications.

## 5. Making-of story copy

`site.making` (seven stage titles and lines, the final CTA, `quoteProduct`/`quoteNote`). The story shows a 12 x 6 x 18 cm folding carton, the same as the configurator default, and passes that type and size to the quote message.

## 6. Colors

Pick the final theme (`?theme=a|b|c|d`, compare with `?themes=1`) and make it the default in `src/lib/palette.ts` (`DEFAULT_THEME`), then re-run `node scripts/export-images.mjs --theme <id>`.

## 7. Shipping-journey copy (stages 8 to 12), review and approve or rewrite

All in `site.making` (`stages` 8 to 12, `chapters`, `scene`, `cta`): "Counted and checked", "Packed in a master carton", "Loaded on board", "On its way", "Delivered to your door", their one-line descriptions, the chapter names ("Made", "Shipped"), the new end CTA ("Ready to receive yours?") and the text printed inside the 3D scene (shipping label "TO: Your location", map end point "Your location"; the brand name also prints on the label and map).
The scene shows a generic plane and van. No carrier, delivery time, tracking or price is mentioned or implied; keep it that way unless you have real facts.

## 8. Eco template refresh: needed from the owner

The eco page (`src/templates/eco`) was redesigned and its headlines rewritten (`src/templates/eco/copy.ts`). Facts shared with the other templates still come from `site.ts`. A real packaging manufacturer states the following, and none of it is on the page yet because nothing may be invented. Each item is marked `TODO(owner)` in `src/templates/eco/copy.ts`.

**Needed from the owner**

- [ ] Board weight (GSM) and the board types you stock, per product line
- [ ] Minimum order quantity, per product line
- [ ] Typical lead time (production, and delivery)
- [ ] Print methods and finishes you offer (offset, flexo, digital, lamination, foil, spot UV)
- [ ] Factory location and years in business
- [ ] The product spec lines (`products.items[].spec` in `site.ts`: "3, 5 and 7 ply", "Tamper-evident", ...) are not shown on the eco page any more because they were never confirmed; confirm them before they are shown anywhere
- [ ] Real **product photos**: add them to `site.media.products` (files in `public/`, with `alt`, `width`, `height`). A "Our packaging" section appears by itself; it is hidden while the list is empty
- [ ] A real **factory or team photo**: set `site.media.factory` (same fields, optional `caption`). A "Where it is made" section appears by itself; it is hidden while it is `null`
- [ ] Real **customer logos and reviews**: `site.reviews.items` / `site.reviews.clients` (section hidden while empty; permission to publish needed)

**Dummy contact details still in `site.ts` (kept on purpose, replace before launch)**

| Value | Dummy | `site.ts` key |
| --- | --- | --- |
| Phone | +92 300 0000000 | `contact.phone`, `contact.phoneHref` |
| WhatsApp | +92 300 0000000 | `contact.whatsapp`, `contact.whatsappHref` |
| Email | hello@example.com | `contact.email` |
| Address | Plot 00, Industrial Area, Lahore, Pakistan | `contact.address` |
| Hours | Mon to Sat, 9:00 AM to 6:00 PM | `contact.hours` |
| Social links | `#` | `social[]` |
| Site URL | https://staging.artinstallation.uk (staging) | `brand.url` |
