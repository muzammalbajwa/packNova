# Pages and features

Every page type, what is on it, which files own it, and how it behaves. Screenshots for each live in `docs/screenshots/pages-v1/` (folder names are given where useful).

## Shared on every page

Header (contact bar, nav with four dropdowns, "Get a quote" button), sticky "Get a quote" + WhatsApp bar (bottom below `xl`, top right from `xl`), skip link, footer (4 columns + bottom bar). Files: `templates/eco/Navbar.tsx`, `Footer.tsx`, `components/ui/StickyCta.tsx`, `catalog/Shell.tsx`.

## 1. Homepage `/`

Owner: `templates/eco/Home.tsx`. Order of sections:

1. **Hero** (`Hero.tsx`, `shared/HeroStage.tsx`, `components/canvas/Box3D.tsx`): left text, right a live 3D kraft carton **printed with the PackNova panel**. The box opens as you scroll (240vh track, pinned), leans toward the pointer (fine pointers only), and rides up with the stage when the pin ends. Until the 3D is ready (and when there is no WebGL) a poster image stands in; the poster is cropped from the live canvas so the swap lines up (a separate phone poster is used below 768 px).
2. **What we make** (`Products.tsx`): six cards, one per product family, with large animated line icons.
3. **Product photos** slot (`Photos.tsx`): renders nothing until real photos exist (`site.media`).
4. **The film** (`Story.tsx`, `shared/StoryEngine.tsx`): the pinned 12-stage scroll film (see [3d-and-animation.md](3d-and-animation.md)). Captions on the left, the 3D stage on the right with feathered edges, a step list along the bottom (chapter "Made", 7 steps; chapter "Shipped", 5 steps). No WebGL or reduced motion: a 12-step illustrated list with the same copy.
5. **How an order works** (`Process.tsx`, `ProcessList.tsx`, `process.css`): from 1024 px the heading column is pinned with pure CSS `position: sticky` while the four steps scroll past; the step at the middle of the screen becomes active (forest green, kraft underline, others dimmed to 70%) and a thin line along the list fills. Below 1024 px nothing pins. Without script all steps are fully visible.
6. **Factory photo** slot and **Reviews** (both render nothing while empty; testimonials and client logos are intentionally never invented).
7. **Quote band** (`QuoteSection.tsx`, `components/sections/QuoteForm.tsx`): forest band with the headline, the "Try your size in 3D" hand-off to the configurator, WhatsApp, phone, email, and a short form (name, phone, product, quantity; the note is one tap away).
8. **Footer.**

Screenshots: `screenshots/pages-v1/final/`, `design-pass/`, `how-it-works/`.

## 2. Hub pages `/industry/`, `/shape-and-style/`, `/material/`, `/event/`

Owner: `catalog/HubPage.tsx` (+ `HubFilter.tsx`, `HubTeaser.tsx`). Header: breadcrumb, serif headline, intro, a count line ("12 industries", also the live region) and filter chips (real buttons, `aria-pressed`). The grid is server-rendered (the full list works without script); the first card is the **feature card** (two columns on wide screens, with a longer description and uses); each card has a line drawing in the product's own colours, name, one line, tags and "See how it is made". Hover lifts the card and the drawing makes a packaging move; on phones each card is a compact row. Below the grid: the "Every one is made the same way" strip (cut, fold, finish) with a line that draws on scroll, then the forest quote band.

Data: `art` and `tags` per page, plus `HUB` copy, in `content/catalog.ts`. Tests: `scripts/hub-test.mjs`. Screenshots: `screenshots/pages-v1/hubs/`.

## 3. Product pages `/<group>/<slug>/` (31 pages)

Owner: `catalog/CategoryPage.tsx`, `ProductFilm.tsx`, `ProductFilmPinned.tsx`, `ProductPoster.tsx`.

- **First screen** (`filmLayout.ts`): text left (breadcrumb, title, one line of promise, one line of description, "Get a quote for X" and "Design your box"), live 3D stage right on a workbench surface with the product's finished form gently swaying and a "Scroll to see how it is made" cue with a step counter; on phones the stage goes under the headline and buttons. Step 1 starts at scroll 0.
- **The film**: 3 to 6 steps driven by scroll, a pure function of progress. Reduced motion or no WebGL: a step list.
- **Details** (specs, finishes, good for), **Styles** (overview pages only), **Questions** (FAQ in `<details>`).
- **Page end**: `RelatedProducts` (same recipe first, then same group, never itself, no duplicates), `QuoteBand` ("Ready to get X made?", prefilled quote link and "Design your box"), footer.

The seven recipes and which pages use them are in `content/catalog.ts` (`recipe` per entry). Screenshots: `first-view/` (audit of every first screen), `page-end/`.

## 4. Configurator `/configurator/`

Owner: `configurator/ConfiguratorApp.tsx`, `DielineView.tsx`, `configurator.css`, `lib/box.ts`, `lib/boxDieline.ts`, `film/configurator.ts`.

- **Row 1**: options on the left (product, size with sliders and a cm/inch toggle, material, colour, print areas with logo upload (stays in the browser), finish, quantity) and the preview on the right, **sticky inside this row only** (top = header height + gap, max-height so it never exceeds the viewport). Controls: "Flat sheet / Folded" slider, "Reset view", drag or arrow keys to turn. Below 1024 px the preview is a compact bar (about a third of the screen) that stays while the options scroll.
- **Row 2** (full width): the dieline on a blueprint plate with the sheet size called out, and the summary as a spec sheet with a kraft bar, **Send to quote** (primary, carries the configuration into the quote form) and **Download SVG** (secondary, true-size dieline, loaded on click).
- A preview only: no prices, no artwork sent anywhere. The page says so.

Tests: `configurator-test.mjs`, `configurator-extra.mjs`, `configurator-layout-test.mjs`. Screenshots: `configurator-fix/`.

## 5. Quote `/quote/`

Five-step wizard (product and size, material and finishes, artwork, your details, review and send). Draft kept in `localStorage`, deleted after sending. Output: one readable message, sent through WhatsApp or email; with `NEXT_PUBLIC_QUOTE_ENDPOINT` set, also a "Send request" button. Page layout: headline, lead and a side panel on desktop. Files: `app/quote/page.tsx`, `components/quote/*`, `content/quoteWizard.ts`. Tests: `quote-unit.mjs` (96 checks), `quote-e2e.mjs`.

## 6. Contact `/contact/`

Phone, WhatsApp, email, address, hours, a map placeholder (a real map link goes in `contactPage.ts`), a short message form, FAQ. Files: `app/contact/page.tsx`, `components/contact/*`, `content/contactPage.ts`.

## 7. Privacy and Terms, 404

`/privacy/` and `/terms/` are **placeholder texts marked as not reviewed by a lawyer** (`content/legal.ts`). The 404 page offers links to the groups and the quote page.

## 8. Cross-cutting features

- **Prefetch**: hovering, focusing or touching a product card or menu item downloads the page's film chunks ahead of the click.
- **Debug overlay**: `?perf=1` shows fps (average and p99), film draw time, draw calls, triangles, geometries, textures, scene object counts and JS heap.
- **Analytics hook**: `track(event, props)` logs in dev; push to `sinks` in `lib/track.ts` to connect a vendor. No vendor is connected.
- **Indexing switch**: staging is `noindex`; production sets `NEXT_PUBLIC_ALLOW_INDEXING=1`.
- **Fallbacks**: poster images, step lists, `?tier=none`, reduced motion, WebGL context loss and restore.
