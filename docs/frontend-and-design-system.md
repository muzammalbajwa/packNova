# Frontend and design system (the "eco" theme)

PackNova has one visual design, **eco**: a cream page with forest green and kraft brown, and a deep-forest dark block for the pinned story. This file is the reference for colours, type, components and motion. Tokens live in `src/templates/eco/tokens.css`; the same hex values are mirrored in `src/lib/palette.ts` (the 3D scene reads the palette), and `scripts/contrast.mjs` checks that both agree and that every pair passes WCAG AA.

## 1. Colour tokens

Page (light):

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f0e6` | page background (cream) |
| `--surface` | `#fbf8f2` | cards, panels, fields |
| `--sand` | `#e9e0cf` | tinted bands, plates |
| `--fg` | `#17231d` | text |
| `--muted` | `#4a5a50` | secondary text |
| `--kraft` | `#b8803f` | kraft brown: rules, accents, lines (a material colour, not for small text) |
| `--kraft-ink` | `#6f4a1e` | kraft as readable text |
| `--accent` | `#1e4d3a` | forest green: buttons, links, active states |
| `--on-accent` | `#f5f0e6` | text on forest green |
| `--sage` | `#9db8a0` | soft green (hover/stage chips) |

Derived: `--line` (fg at 16%), `--line-strong` (fg at 40%), `--wash` (fg at 5%), `--field`.

Story (the `.tone-dark` block): `--bg #102a20`, `--surface #17372b`, `--fg #f5f0e6`, `--muted #b5c4b8`, `--kraft-ink #d0a265`, `--accent #9db8a0`, `--on-accent #102a20`.

Other tokens: radii `--r-card: 8px`, `--r-field: 6px`, `--r-btn: 6px`; `--header-h: 6.25rem` (the fixed header: contact bar plus nav; sticky elements sit below it).

Rules: no decorative gradients, no glassmorphism, no emoji icons, no stock slogans. The only gradients are functional (edge feathering masks, the stage floor shadow).

## 2. Typography

| Role | Family | Weights | Notes |
|---|---|---|---|
| Headings (`font-display`) | Newsreader | 500, 600 | sentence case; `text-balance` on headings to avoid widows |
| Body | Source Sans 3 | 400, 700 | 17px body size, line-height 1.6 (set on the template root, so `rem` stays 16px) |

Scale (Tailwind): page titles `text-4xl md:text-6xl`, section titles `text-3xl/4xl md:text-4xl/5xl`, card titles `text-2xl`, body `text-lg` for intros. Line length stays under about 65 characters for body text.

## 3. Layout

- Page container `max-w-6xl` (72rem), side padding `px-6`, section padding `py-16 md:py-24`.
- Page shell for pages without a hero canvas: `catalog/Shell.tsx` (Navbar, `main#main` with top padding for the header, Footer, sticky quote bar) on top of `catalog/PageFrame.tsx`.
- Sticky elements (hub filter is not sticky; the "How an order works" heading column and the configurator preview are) use `top: calc(var(--header-h) + gap)`.
- Skip link first in tab order; focus ring is a 2px (3px on cards) forest-green outline with offset, via `:focus-visible`.

## 4. Components

| Component | Where | What it is |
|---|---|---|
| Header (`Navbar`) | `templates/eco/Navbar.tsx` | contact bar + nav, dropdown menus (Industry, Shape & style, Material, Event) with arrow-key support, mobile accordion menu with scroll lock, hides on scroll down |
| Footer | `templates/eco/Footer.tsx` | brand + blurb, Products, Explore, Contact (all from `site.ts`/`catalog.ts`), bottom bar with privacy, terms, back to top; kraft top rule |
| Sticky quote bar / WhatsApp | `components/ui/StickyCta.tsx` | bottom bar below `xl`, top-right button from `xl` |
| Product card (`rel-card`) | `catalog/pageEnd.css` | kraft-tinted paper surface with a faint grain, thin border, a "plate" with the faint blueprint grid, lift on hover |
| Line drawings | `catalog/ProductIllustration.tsx` | 24 isometric line drawings (rigid, mailer, shipper, tuck, folding, window, takeaway, gable, pillow, bag, pouch, courier, tag, sticker, tray, insert, jewelry, display, pizza, candle, bottle, medicine, device, retail) tinted by the page's own skin colours, plus small seasonal motifs from `skin.props` |
| `ProductIcon` | `components/ui/ProductIcon.tsx` | the animated homepage category icons (hover, focus, tap) |
| `RelatedProducts` | `catalog/RelatedProducts.tsx` | end of a product page: 3 cards (4 from 1400 px; a scroll-snap row on phones) chosen by `relatedFor()` |
| `QuoteBand` | `catalog/QuoteBand.tsx` | full-width forest band: product-specific headline, one honest line, two buttons, a kraft box that opens and closes (only while on screen, with a pause button) |
| `HubPage`, `HubFilter`, `HubTeaser` | `catalog/Hub*.tsx` | the four hub pages: header with count and chips, editorial grid with a feature card, "how it is made" strip |
| Stage plate (`.stage`) | `tokens.css` | the workbench surface behind live 3D on product pages: warm tone with a faint blueprint grid |
| `.story-stage` | `tokens.css` | the homepage film stage: no frame, feathered edges |
| Process list | `templates/eco/Process.tsx`, `ProcessList.tsx`, `process.css` | "How an order works": pinned heading column, active-step highlight, progress line |
| Configurator panels | `configurator/` | options form, sticky preview panel, blueprint plate for the dieline, spec-sheet summary |

## 5. Motion rules

1. **Animate only `transform` and `opacity`** (and `stroke-dashoffset`, colour). Never `transition: all`.
2. **Everything that moves respects `prefers-reduced-motion`**: smooth scroll off, film replaced by the step list, idle sway off, card lift and drawing moves off, scroll-driven entrances off, the band loop off. Colour/border changes may stay.
3. **Motion answers the visitor or does one job.** One orchestrated moment on first view is better than entrance animations everywhere. The scroll-driven stagger on hub cards and the line that draws in the hub strip use `animation-timeline: view()` inside `@supports`, so unsupported browsers just show the content.
4. A loop longer than 5 seconds next to other content has a pause control (the band box).
5. No layout shift: space is reserved (poster aspect, chips row, dieline placeholder); only opacity and transforms change.
6. Hover and focus on cards: lift 4 px, soft shadow, arrow slides 6 px, the drawing makes a packaging move (lid lifts on boxes, handles swing on bags, pouch puffs, tag swings, sleeve slides, flaps lift on mailers).

## 6. Accessibility baseline

Lighthouse accessibility is 100 on every page tested. Pass criteria used throughout: AA contrast for text (`scripts/contrast.mjs`), labelled controls, real buttons with `aria-pressed` for chips, `aria-live` regions for changing text (hub count, film captions), ordered lists for steps, correct heading order, keyboard focus order unchanged by layout tricks, skip link, `touch-action: manipulation` on controls, `translate="no"` on the brand name, headings `text-balance`.

One known trade-off: the order-steps section dims inactive steps to **70%** opacity (not 55%) because the grey body text fails AA at 55%.

## 7. Responsive behaviour

Checked at 1440, 1024, 768 and 390 px with no horizontal scroll (scripts: `hub-test.mjs`, `configurator-layout-test.mjs`, `page-end-shots.mjs`). Phone specifics: hub cards become compact rows, the configurator preview becomes a compact sticky bar (about a third of the screen), the order steps stop pinning, related products become a horizontal scroll-snap row, the footer is two columns plus contact.

## 8. Changing the design safely

- Colours: edit `src/lib/palette.ts` (`ECO_PAGE` for the page, `THEMES.c` for the story) **and** `tokens.css`, then run `node scripts/contrast.mjs`.
- Copy: only in `src/content/`.
- A new card or section should reuse `rel-card`/`rel-plate` and the `ic-*` drawing classes so it matches.
- After a 3D framing change, re-run the sweeps and re-export posters (see [3d-and-animation.md](3d-and-animation.md)).
