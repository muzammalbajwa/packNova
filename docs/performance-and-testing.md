# Performance and testing

Budgets, the numbers that were measured, and every script in `scripts/` with what it checks. How to set up the machine is in [local-setup.md](local-setup.md).

## 1. Budgets (all currently met)

| Metric | Target | Where it is checked |
|---|---|---|
| Initial JS per route (gzip, modern browsers) | under 300 kB; in practice home about 216 kB, product pages about 144 kB, hubs about 143 kB, configurator about 155 kB, quote about 148 kB | `route-size.mjs` |
| Draw calls | under 100 (film pages max 33; story max 83, journey stages at most 66) | `film-sweep.mjs`, `journey-calls.mjs` |
| Empty frames in a film | none | `film-sweep.mjs`, `story-sweep.mjs` (Test A and C) |
| Frame rate | 60 fps desktop; p99 frame under 25 ms at 1440 px and at 390 px with 4x CPU throttle | `perf-film.mjs`, `idle-perf.mjs` |
| Layout shift | CLS 0 on film pages and hubs | `lh.sh`, page tests |
| Lighthouse accessibility | 100 | `lh.sh` |
| Leaks | geometries, textures, programs, scene objects and JS heap do not grow over 20 navigations | `leak-test.mjs` |
| Pages added to hubs | under 2 kB gzip of extra JS (measured +0.5 kB) | `route-size.mjs` |

Other fixed numbers: nomodule polyfills add about 38.7 kB for old browsers only (not counted above).

## 2. Measured results (Mac, Chrome, 2026-11-13 to 2026-11-18)

Always read these with the machine load in mind; the load average was between 2 and 10 during many runs (the scripts refuse to run timing tests above 4 unless forced, and the logs say when they were forced).

**Lighthouse (mobile emulation, simulated 4x slowdown), accessibility 100 on every page listed:**

| Page | Performance | LCP | TBT | CLS |
|---|---|---|---|---|
| Homepage (start of the speed work) | 67 (base run 69) | 3.0 s | 1,382 to 1,710 ms | 0.001 |
| Homepage (after speed work and later passes) | 77 to 86 | 3.0 s | about 340 to 690 ms | 0.001 |
| Product pages | 89 to 96 | 2.4 to 2.6 s | 260 to 380 ms | 0 |
| Hubs (all four) | 96 to 97 | 2.4 to 2.6 s | 110 to 150 ms | 0 |
| Configurator | 93 | 2.6 s | 240 ms | 0 |
| Quote, contact | 96 | 2.6 s | 110 ms | 0 |

Desktop: homepage 89 to 100, other pages 100, TBT 0 to 270 ms.

Notes: Lighthouse's **simulated** LCP for the homepage stays about 3.0 s while the **observed** LCP in the trace is about 175 ms (the poster paints immediately); the gap is Lighthouse's model, not a slow paint. Raw JSON for the phase 6 runs: `docs/lighthouse/`, table in `docs/lighthouse/phase6-table.txt`.

**Homepage mobile speed work (2026-11-16)**, same machine, load 6 to 9: total blocking time 1,382 → 599 to 811 ms; long tasks over 50 ms: 2,000 ms total with a longest of 617 ms → 1,083 to 1,307 ms total with a longest of 211 to 272 ms. Cause found with `home-profile.mjs`: one 700 ms task building every journey object inside a React render. Fixes: time-sliced build, and on phones the story canvas waits for the first input.

**Film frame rate:** all 7 recipes hold 60 fps with p99 16.8 ms at 1440 px and at 390 px with 4x CPU throttle, including when the machine was busy (load 5.7 to 6.9; those runs were forced and labelled). The first screen idle loop: 60 fps desktop, 30 fps on the low-tier emulation, and it stops when scrolled away, off screen or in a hidden tab.

**Sweeps:** 8 film pages at 1440 and 390: no empty frames; draw calls 3 to 33; story sweeps pass (zero empty pinned frames; 300 progress values clean).

**Poster vs live hero:** about 2.5% of pixels differ at 1440 and at 390 (the idle sway).

**Story film unchanged check:** 18 progress values at desktop and phone compared pixel by pixel between the build before and after the speed work: 0.000% differing.

Phase 6 full verification record: `docs/final-verification.txt`.

## 3. The standard checks before you push

```bash
npm run lint && npm run build
npm run serve:out                           # in another terminal
node scripts/link-check.mjs
node scripts/a11y-test.mjs
node scripts/roundtrip-test.mjs --only home --rounds 10 --reduced 1
node scripts/roundtrip-test.mjs --only film
node scripts/leak-test.mjs --seq "<9 film pages>,/,<9 film pages>,/"
node scripts/route-size.mjs / /material/rigid-boxes/ /industry/ /configurator/ /quote/
bash scripts/lh.sh / mobile
```

Add the page-specific test for what you changed (`hub-test`, `page-end-test`, `process-test`, `configurator-layout-test`, ...). `scripts/final-verify.sh` runs the long whole-site pass.

## 4. How the scripts work

- They launch a real Chrome (`scripts/lib/cdp.mjs`: `launch({ width, height, dpr, mobile, cores, eager })` returns `{ send, ev, waitFor, kill, on }`) and talk the DevTools protocol directly.
- A phone profile means 390x844, device pixel ratio 2, touch emulation, a Pixel user agent, 4 hardware cores, and (for speed tests) `Emulation.setCPUThrottlingRate` 4.
- Timing scripts check the machine load first. Screenshot scripts write to `docs/screenshots/...`.
- Test hooks exposed by the site: `window.__film` (film renderer), `window.__gl`, `window.__glMaking`, `window.__makingR3F`, `window.__makingSet(p)`, `window.__makingVisible()`, `window.__appStore`, `window.__eagerStory`.

## 5. Script reference (62 scripts)

### Layout, lifecycle and leaks

| Script | What it does |
|---|---|
| `roundtrip-test.mjs` | Scene lifecycle regression test: leaving the homepage and coming back must give the SAME scene as the first load. |
| `leak-test.mjs` | Client-side navigation test: home -> rigid -> corrugated -> folding -> home -> rigid -> ... (10 transitions, real link clicks). |
| `context-loss-test.mjs` | Forces a WebGL context loss (and later a restore) on a film page, the configurator and the homepage, and checks that the poster |
| `visitor-story.mjs` | A phone visitor, not a test harness (no eager flag): the story canvas must NOT exist right after load (that is the speed gain), |
| `prefetch-test.mjs` | Is the film (engine + recipe chunk) already downloaded when the page opens? For each trigger (hover, focus, touch start) |
| `perf-overlay-test.mjs` | ?perf=1 overlay: present with the flag (production build), absent and inert without it. |

### Film and story correctness

| Script | What it does |
|---|---|
| `film-sweep.mjs` | For each page: sweep the film progress 0..1 and check that something is in view at every step (no empty frames), |
| `story-sweep.mjs` | Test A (fast sweep, empty-frame detector) and Test C (visibility invariant) for the making-of canvas. |
| `cold-jump.mjs` | Cold-jump test: for each progress point, load the page cold, jump the scroll straight to that point |
| `legacy-compare.mjs` | Regression check: the first 7 stages ("Made") must look exactly as they did before the shipping journey was added. |
| `story-compare.mjs` | Pixel compare of the story canvas between two builds (before on :8081, after on :8080) at the same progress values, |
| `plane-test.mjs` | Geometry checks for the cargo plane (Node 22, no browser): builds the real plane and asserts its layout. |
| `journey-calls.mjs` | Draw calls and triangles of the story canvas at every stage (and at 3 points inside each), load independent. |

### Page behaviour and accessibility

| Script | What it does |
|---|---|
| `a11y-test.mjs` | Accessibility checks in a real browser: skip link, heading order, desktop dropdown keyboard behaviour (arrows, Escape, Tab out), |
| `menu-test.mjs` | Mobile menu test at 390 px: open, accordion, scroll lock, close (button and Escape), link tap. Screenshots into --out. |
| `page-end-test.mjs` | Behaviour of the page end: hover lifts the card 4 px and moves the drawing, keyboard focus shows a ring, reduced motion moves nothing, |
| `hub-test.mjs` | Hub pages: filter chips (buttons, aria-pressed, live count), full list without script, hover lift, reduced motion, scroll-in, no horizontal scroll at |
| `process-test.mjs` | "How an order works": the heading column is pinned (CSS sticky) on desktop and released at the end of the list; the step at the middle of |
| `configurator-test.mjs` | Configurator checks. node scripts/configurator-test.mjs [--perf 1] [--mode desktop\|mobile] [--cpu 4] |
| `configurator-extra.mjs` | More configurator checks: logo upload and its limits, labelled controls, keyboard rotation, fallbacks, rebuild leaks. |
| `configurator-layout-test.mjs` | Configurator layout: scroll from top to bottom at 1440x900, 1024x768 and 390x844. At every step the sticky preview must not overlap the |
| `quote-unit.mjs` | Unit tests (no browser): the summary builder, links, phone and URL parsing, validation, submitQuote against a local mock server. |
| `quote-e2e.mjs` | End-to-end checks of /quote/ and /contact/ in a real browser. |
| `link-check.mjs` | Checks every internal link (a[href]) in the static export: node scripts/link-check.mjs [outDir] |
| `contrast.mjs` | WCAG AA check per template (Node 22). Also verifies that each template's tokens.css colors equal its palette |
| `first-view.mjs` | Audit of the FIRST VIEWPORT (no scrolling) of every page type at 1440x900 and 390x844: screenshot, the biggest empty rectangle (as a share of |

### Speed and size

| Script | What it does |
|---|---|
| `lh.sh` | Lighthouse (mobile by default) for one URL; prints scores and the main timings. Notes the machine load before and after. |
| `lh-all.sh` | Lighthouse mobile and desktop for the main routes, one after the other, each waiting for the machine load to be under 3.5. |
| `perf-matrix.sh` | Full performance matrix + Lighthouse against the production export. |
| `perf-film.mjs` | Frame rate of a product film while scrolling through it (down then back up). Refuses to run when the machine is busy. |
| `perf-journey.mjs` | Frame stats while scrolling steadily through the "Shipped" chapter (count, pack, load, fly, deliver), overall and per stage. |
| `perf-making.mjs` | Frame stats for the making-of section on the production export, plus initial JS size and draw calls. |
| `perf-measure.mjs` | Measures the production export in a real Chrome via the DevTools protocol (no extra packages). |
| `idle-perf.mjs` | Frame time of a product page's FIRST SCREEN while it idles (the finished product swaying, nothing scrolled), and proof that the idle loop stops: |
| `configurator-hitch.mjs` | The frame times around a rebuild: after a size or colour change settles, how long is the longest frame, and the p99 of a 2 s window. |
| `home-profile.mjs` | CPU profile of the homepage load on a phone profile (390x844, 4x CPU): long tasks over 50 ms with start time, and the heaviest functions by self time. |
| `route-size.mjs` | Initial JS (gzip) of a route = the <script src> files in its exported HTML. |
| `bundle-breakdown.mjs` | What is in the initial JS of a route: every <script src> of its exported HTML, gzip size, and which libraries it contains. |
| `film-chunks.mjs` | Sizes of the lazy chunks a film page downloads (three.js, the film engine, the recipe), by loading the page in Chrome. |
| `final-verify.sh` | The full verification pass (Phase 6). Needs: npm run build done, `node scripts/serve.mjs` running on :8080, Node 22. |

### Screenshots and assets

| Script | What it does |
|---|---|
| `screenshots.mjs` | Saves desktop + mobile screenshots of every section and the configurator to docs/screenshots/. |
| `page-shots.mjs` | node scripts/page-shots.mjs --base http://127.0.0.1:8080 --paths /industry/jewelry-boxes/,/industry/ --out docs/screenshots/pages-v1 [--mode desktop\|mobile] [--full 1] [--menu 1] |
| `quick-shot.mjs` | node scripts/quick-shot.mjs <url> <out.jpg> [scrollY \| #elementId] [--mobile] |
| `film-shots.mjs` | Screenshots of a product page's film at several progress points, plus a contact sheet. |
| `journey-shots.mjs` | Screenshots of all 12 story stages (7 "Made" + 5 "Shipped") per template and viewport. |
| `load-shots.mjs` | Screenshots of the Load stage (stage 10) at fixed points through the stage, by injecting the exact progress. |
| `loading-shots.mjs` | Scrolls fast through the story at 4 frames/s (screenshots) for each speed and writes docs/screenshots/loading/<template>-<speed>-NN.jpg |
| `making-shots.mjs` | Screenshots of the making-of section at given scroll progress values. |
| `template-shots.mjs` | Screenshots of one template: hero, every making-of stage, products and quote, desktop + mobile. |
| `refresh-shots.mjs` | Page walk screenshots of one template (everything except the pinned story, which scripts/journey-shots.mjs covers): |
| `hover-shots.mjs` | Product icon hover check. For every product card of a template: freezes the animation at 4 moments |
| `configurator-shots.mjs` | Screenshots of the configurator: one per product type (folded), plus flat and half-folded for one, and console errors. |
| `quote-shots.mjs` | Screenshots of every quote step, the validation errors, the review step and the contact page at 1440 and 390 px. |
| `final-shots.mjs` | Screenshots for docs/screenshots/pages-v1/final/: one page per recipe (contact sheet over the film), the configurator, quote and contact pages. |
| `page-end-shots.mjs` | Screenshots of the BOTTOM of pages (related products, quote band, footer), plus layout-shift and horizontal-overflow checks. |
| `hub-shots.mjs` | Full-page screenshots of the hub pages. node scripts/hub-shots.mjs --tag before\|after [--paths /industry/,/shape-and-style/] [--widths 1440,390] |
| `home-tour.mjs` | Screenshots of the homepage at fixed fractions of its height, to review the whole page. node scripts/home-tour.mjs [--out dir] [--path /] |
| `export-images.mjs` | Re-renders public/textures/hero-poster-<template>.webp and public/og-<template>.png from the live 3D scene. |

### Tooling

| Script | What it does |
|---|---|
| `serve.mjs` | Static server for ./out with Brotli/gzip compression and the same cache rules as public/_headers. |
| `gen-nav.mjs` | Writes src/content/navData.ts: the header menu and the product list as plain data, taken from the catalog. |
| `dead-code.mjs` | Lists the files in src/ that no page, layout or route reaches by imports (static or dynamic): candidates for deletion. |
| `make-fonts.py` | Basic Latin, Latin-1 Supplement, typographic punctuation and the arrows used in the copy |

## 6. Known limits of the testing

- Chrome only. **Not tested:** real phones, Safari, Firefox (the scroll-driven CSS entrances, CSS mask feathering and some `color-mix` uses are the first things to check there).
- Phone behaviour is an emulation (viewport, touch, 4x CPU throttle), not a device; real GPUs and thermal throttling differ.
- Lighthouse is run in simulated throttling; it is a model.
- Most timing runs were on a busy developer machine; the load is noted in the logs.
