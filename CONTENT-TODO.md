# Before launch: what you must replace or decide

Everything the site shows today is **placeholder**. Nothing below has been invented as a fact (no prices, minimums, lead times, awards, clients,
reviews or numbers), but the names, contact details and specs are dummies. Tick each box when done. Older, more detailed notes are kept in
`docs/content-notes-earlier.md`.

## 0. Where things live (so you know which file to open)

| What | File |
| --- | --- |
| Brand name, phone, WhatsApp, email, address, hours, social links, "Get a quote" label, first line of a quote message, site address | `src/content/siteCore.ts` |
| Homepage copy, products, process, making-of story, journey stages, footer text, SEO title and description | `src/content/site.ts` |
| The 31 product pages (text, specs, FAQ, colours, process steps) | `src/content/catalog.ts` |
| Quote page text and privacy note | `src/content/quoteWizard.ts` |
| Contact page text, FAQ, map link, map coordinates | `src/content/contactPage.ts` |
| Privacy policy and Terms (placeholders) | `src/content/legal.ts` |
| Staging versus production (indexing switch) | `src/content/launch.ts` (set by the production workflow, do not edit) |
| Colours | `src/lib/palette.ts` and `src/templates/eco/tokens.css` |

## 1. Decisions I need from you

- [ ] **Which of the four homepage templates becomes the main one?** Today `/` is the **eco** template (cream, forest green, kraft). Editorial, cinematic and industrial live under `/t/...` and are all `noindex`.
- [ ] **Delete the other three** once you have chosen. Their code is shipped in the build but only the page you open downloads it, so the saving is mostly in repository size, build time and maintenance. Say "keep eco" and I will remove `src/templates/{editorial,cinematic,industrial}`, their routes, picker images and posters.
- [ ] Do you want the quote form to send straight to your inbox (a form service) or only through WhatsApp and email? See the README, "Connect the quote form".
- [ ] Urdu (or another language): wanted at launch? The text is structured for it but not translated (needs an Urdu font too).

## 2. Brand and contact (`siteCore.ts`)

- [ ] Real **company name** (now "PackNova"), tagline and description
- [ ] Real **logo** (now a text mark plus a small box icon in `src/components/ui/Logo.tsx`), favicon (`src/app/favicon.ico`)
- [ ] Real **phone, WhatsApp number** (`whatsappHref` must be `https://wa.me/<digits only>`), **email**, **address**, **working hours**
- [ ] Real **social links** (now `#`, so they are not clickable in a useful way)
- [ ] Real **site address** (`brand.url`): in staging it is the staging address; the production workflow sets it from a variable
- [ ] Re-render the social share image (`public/og-eco.png`) after renaming: `scripts/export-images.md`

## 3. Photos, specs and numbers (nothing here is invented, so these sections are empty or say "confirmed with the quote")

- [ ] Real **product photos** (`site.media.products`, files in `public/`); the "Our packaging" section appears by itself when filled
- [ ] A real **factory or team photo** (`site.media.factory`)
- [ ] **Customer logos and reviews** (`site.reviews`): empty on purpose; you need permission to publish them
- [ ] **Specs per product page** (`catalog.ts`: materials, sizes, finishes, uses, FAQ answer): replace the plain placeholders
- [ ] **Minimum order quantity** and **typical lead time** per product (every page currently says "confirmed with the quote")
- [ ] **Board weights (GSM)**, print methods and finishes you really offer, factory location and years in business
- [ ] The product spec lines on the homepage products (`site.products.items[].spec`) are not shown because they were never confirmed
- [ ] **FAQ answers** (`contactPage.ts`, 8 questions): minimum order, samples, delivery, payment, artwork. Now all defer to the quote
- [ ] A **reply time** in the quote success message (`quoteWizard.ts`, `success`), only if you can keep it. Left out on purpose
- [ ] Check the three-dimensional products really can be made as shown (box styles, closures, finishes): the 3D films are illustrations

## 4. Map and structured data (`contactPage.ts`)

- [ ] Real **map link** (`mapsHref`) and real **latitude/longitude** (`geo`; now the middle of Lahore, made up)
- [ ] Optionally replace the placeholder map drawing with a screenshot (`components/contact/MapPlaceholder.tsx`)
- [ ] The LocalBusiness data on `/contact/` is built from the values above (`src/lib/jsonld.ts`): check it after replacing them

## 5. Legal pages (placeholders exist and are linked in the footer)

- [ ] **Privacy policy** (`/privacy/`) and **Terms** (`/terms/`) are plain placeholders from `src/content/legal.ts`. Have them reviewed and finished (company name and address, how long requests are kept, your form provider)
- [ ] If you add analytics, cookies or a form service: update the privacy text and add a cookie notice if your country requires one

## 6. Quote form

- [ ] Choose and connect a form service (README), or keep WhatsApp and email only
- [ ] Review `quoteWizard.ts` (wording, privacy note), the country-code list (`lib/quote.ts`) and the first line of the WhatsApp message (`siteCore.ts`)
- [ ] Test one real WhatsApp message and one real email from a phone

## 7. Going live

- [ ] Server rules pasted into CyberPanel (`docs/server/htaccess.txt`), tested on the real host
- [ ] Set up the **production workflow** (`.github/workflows/deploy-production.yml`, manual only, nothing enabled yet): create the `production` environment, the `PROD_*` secrets and the `PRODUCTION_SITE_URL` variable (header of the file lists them). Staging stays `noindex`
- [ ] After the first production deploy: check `robots.txt`, `sitemap.xml`, a page's source (no `noindex`), and submit the sitemap in Google Search Console
- [ ] Real-device test on at least one iPhone and one Android phone (`PHONE-TEST.md`); the numbers in `docs/perf` are from desktop Chrome with simulated throttling, not real phones
