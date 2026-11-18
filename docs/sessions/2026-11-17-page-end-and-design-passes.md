# 2026-11-17: page ends, design passes, branded hero, sticky order steps

Commits: `1a06df7`, `45a8ec1`, `0c35902`, `1ae9fd1`, `aca3fe0`. Pushed to `main` as `67150fc..1a06df7` (page end) and `1a06df7..aca3fe0` (the rest).

## 1. Page end redesign (`1a06df7`)

Asked: redesign the bottom of every product page: Related products, the quote call to action, the footer. Built:

- **Related products** (`RelatedProducts.tsx`): serif heading with a line and "View all in <group>", 3 cards (4 from 1400 px, a scroll-snap row on phones) chosen by `relatedFor()` (same recipe first, then same group, never itself, no duplicates). Each card has a line drawing in the product's own colours (`ProductIllustration.tsx`), name, one line, an arrow link. Kraft-tinted paper surface with a faint grain, equal heights, CSS-only hover (lift 4 px, arrow slides, the drawing makes a packaging move), off for reduced motion.
- **Quote band** (`QuoteBand.tsx`, `InViewPlay.tsx`): forest band, "Ready to get <product> made?", one honest line, two buttons (prefilled quote, Design your box), a kraft box that opens and closes only while on screen; later given a pause button (the loop is longer than 5 seconds).
- **Footer**: four columns and a bottom bar with privacy, terms and back to top.
- Numbers: initial JS +0.1 kB on product pages; Lighthouse accessibility 100 and CLS 0 on six pages. Before/after screenshots: `docs/screenshots/pages-v1/page-end/`.
- Problems found by reviewing screenshots: a fourth card wrapped instead of showing as a column (Tailwind's arbitrary `min-[1400px]` variants did not apply; moved to plain CSS), drawings too small in their plates, a widowed word in the band headline, cards flush to the screen edge on phones (needed `scroll-padding`).
- The a11y script's "focus is not trapped in the menu" check was narrowed to the header, because the footer columns became `<nav>` landmarks.

## 2. Skills installed, and the design audit (`45a8ec1`)

Eleven agent skills were installed into `.claude/skills/` (project level, copied): `frontend-design`, `canvas-design`, `ad-creative`, `ads`, `copywriting`, `social`, `impeccable`, `web-design-guidelines`, `brand-guidelines`, `brand-strategy`, `ai-image-generation`. The `uizze` skill was looked at and **not** installed (UI-only, a paid MCP, unclear install contents). The `impeccable` launcher binary downloads and runs a program, so it was **not** run; its written method was followed by hand. `.claude/**` is ignored by ESLint. The audit is `docs/DESIGN-AUDIT.md`.

Fixed in that commit: the hero box leaves with the stage and no longer collides with the headline (it rides up after the pin ends; on phones it shrinks as it opens); the box leans toward the pointer; the homepage "What we make" list became six cards; film captions and step buttons got bigger.

## 3. Design pass 2 (`0c35902`)

Chosen by the owner: branded hero box, full-bleed film stage, one homepage ending, delivery clouds.

- **Branded carton**: forest panel with mark, wordmark and tagline on the front and both side walls (`brandPanelTexture`).
- **Posters**: the poster is now cropped from the live canvas at the poster image's own rectangle, with a separate phone poster; the poster slot was smaller than the live box before. About 2.5% of pixels differ poster against live (the idle sway).
- **Film stage**: no border or card; the edges feather into the dark section. Camera framing untouched (sweeps clean).
- **Homepage ending**: the configurator teaser folded into the quote band; the form's note field is one tap away (`ConfiguratorTeaser` removed).
- **Clouds**: self-lit so they read light and warm.
- **Guideline audit fixes**: pause control for the 9 s loop, `touch-action`, `translate="no"` on the brand, balanced headings, quantity autocomplete off, `theme-color` matched.

## 4. "How an order works" sticky section (`1ae9fd1`)

Pure CSS `position: sticky` for the heading column from 1024 px; steps scroll past; the step at the middle of the screen is active (one `IntersectionObserver`, no state), a progress line fills along the list edge. No JS pinning; nothing pins below 1024 px; no-JS shows all steps; reduced motion shows all steps at full opacity. +0.2 kB JS, CLS 0 from the section, `scripts/process-test.mjs` 15/15. Deviation from the brief: dimmed steps are 70% opacity (55% failed AA contrast and dropped Lighthouse accessibility to 96).

## 5. Three layout fixes from the owner's screenshots (`aca3fe0`)

The owner pointed at three flaws and was right: the carton wordmark ran past its panel (the last letter was cut off), the card drawings on "What we make" were too big, and the order steps had too much empty space. Fixed: the wordmark is measured and shrunk to fit, drawings are about half the size, steps are 30svh (was 48svh). Posters re-exported.

## Numbers

Homepage mobile Lighthouse 77 to 86 (earlier 67); accessibility 100 throughout; initial JS about 216 kB on the homepage. Full table in [performance-and-testing.md](../performance-and-testing.md).

## Not tested

Real phones, Safari, Firefox; CSS mask feathering and scroll-driven animations outside Chrome; widths between 1024 and 1440 for the order-steps section.

Previous: [lifecycle, first screen, speed](2026-11-16-lifecycle-first-screen-speed.md). Next: [configurator, hubs and docs](2026-11-18-configurator-hubs-and-docs.md).
