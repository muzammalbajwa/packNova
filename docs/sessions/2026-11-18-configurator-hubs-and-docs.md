# 2026-11-18: configurator layout fix, hub redesign, documentation

Commits: `69acefd` (configurator), `1d56023` (hubs), and the commit that added this `docs/` content. The first two were pushed as `aca3fe0..1d56023`.

## A. Configurator layout bug (`69acefd`)

**Report (from a screen recording):** while scrolling `/configurator/`, the sticky preview panel stayed pinned into the dieline, the summary and the footer; the dieline title and the "Download SVG" and "Send to quote" buttons collided with it; the top of the 3D box was cut by the header.

**Cause:** the preview and the summary shared one tall sticky wrapper inside the same grid as the dieline, so the pinned block was taller than its row and ran over what came after.

**Fix:** the page is two rows. Row 1 is the options and the sticky preview only (top = `--header-h` + 1rem, max-height under the header), and it ends before the dieline. Row 2 is a full-width section: the dieline on a blueprint plate with sheet-size callouts, and the summary as a spec sheet with a kraft bar, **Send to quote** (primary) and **Download SVG** (secondary; the dieline code loads on click). Below 1024 px the preview is a compact sticky bar (about a third of the screen) that is released at the end of the row. No JS pinning, no z-index hacks; no ancestor with `overflow`/`contain`.

**Guard:** `scripts/configurator-layout-test.mjs` scrolls the page at 1440, 1024 and 390 px in 70 px steps: no overlap with the dieline, summary or footer, never under the header, no horizontal scroll, released at the dieline. Frames (top, mid options, end of row, dieline start, summary, footer) in `docs/screenshots/pages-v1/configurator-fix/`.

**Numbers:** configurator Lighthouse accessibility 100, CLS 0, mobile performance 93, desktop 100; initial JS 155.2 kB.

## B. Hub pages (`1d56023`)

**Asked:** redesign Industry, Shape & style, Material and Event: header with count and filter chips, an editorial grid with a feature card, a line drawing per page, hover and focus moves, a "how it is made" strip, a strong closing band, all copy in the catalog, a drawing for every one of the 31 pages, under 2 kB of extra JS.

**Built:** see [pages-and-features.md](../pages-and-features.md#2-hub-pages-industry-shape-and-style-material-event). Data: `art` and `tags` per page, `HUB` copy and `hubChips()` in `catalog.ts`. 24 drawings plus seasonal motifs from `skin.props`. Chips are real buttons with `aria-pressed`; the count line is the live region; the grid is server-rendered so the list works without script (chips stay invisible, with reserved space, until the script runs). The scroll-driven stagger is CSS (`animation-timeline: view()`) inside `@supports` and off for reduced motion. Phones get compact rows.

**Reviewed and fixed after looking at screenshots:** the feature card's text half was empty (now has the longer description and uses), the ribbon motif looked like scissors (redrawn as a bow), phone cards were too tall (now rows), some chips split nothing (tags adjusted).

**Test artifacts understood, not bugs:** a full-page screenshot freezes scroll-driven entrances (the shot script switches them off), and clicking a chip through script counts as an unprompted layout shift while a real click is exempt (CLS is asserted before any chip is used; it is 0).

**Numbers:** hubs +0.5 kB gzip JS (142.8 → 143.3 kB); Lighthouse accessibility 100 and CLS 0 on all four; mobile performance 96 to 97, desktop 100; `hub-test.mjs` passes; menu, prefetch (hub cards prefetch the film on hover), a11y and link checks pass. Screenshots: `docs/screenshots/pages-v1/hubs/`.

## C. Documentation (this commit)

Created the `docs/` guide set: [main README](../README.md), tech stack, local setup, architecture, frontend and design system, templates history, pages and features, 3D and animation, performance and testing (with the full script table), deployment, content guide, and these session notes. Added pointers from the root `README.md` and `CLAUDE.md`, plus a working rule to add a session note at the end of each session. Facts were taken from the repository (package.json, config, workflows, source tree, git history), not from memory.

## Skills and tools used in the session

`frontend-design` (loaded through the Skill tool); critique, polish and `web-design-guidelines` were applied by hand from their written rules (the `impeccable` modes are not loadable through the Skill tool and its launcher was not run).

## Not tested

Real phones, Safari, Firefox; the scroll-driven entrances and CSS masks outside Chrome; hub grids end with a short last row on some hubs (accepted).

Previous: [page end and design passes](2026-11-17-page-end-and-design-passes.md). Back to the [index](README.md).
