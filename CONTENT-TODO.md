# Content TODO

Everything below is **dummy content** that is shown on the live site as if it were real.
Replace it before launch. All brand values and copy live in **`src/content/site.ts`**: one edit there updates every place listed.

## 1. Brand and contact values (edit `src/content/site.ts`)

| Value | Dummy | `site.ts` key | Where it appears |
| --- | --- | --- | --- |
| Company name | PackNova | `brand.name` | Logo (navbar, footer) `ui/Logo.tsx`; footer copyright `sections/Footer.tsx`; page titles/Open Graph `app/layout.tsx`, `app/configurator/page.tsx`; the logo printed on the 3D box in the "Print" scene `lib/textures.ts` |
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
