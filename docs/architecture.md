# Architecture

How the code is organised and why. For the 3D details see [3d-and-animation.md](3d-and-animation.md); for pages see [pages-and-features.md](pages-and-features.md).

## 1. Big picture

```
                 src/content/*  (all copy and data, no React, no three.js)
                        │
     ┌──────────────────┼───────────────────────────────┐
     ▼                  ▼                               ▼
 src/app/ (routes)  src/catalog/ (product, hub,      src/configurator/
 server components  page-end components)             + src/lib/box*.ts
     │                  │                               │
     ▼                  ▼                               ▼
 src/templates/eco   src/film/  ◄── lazy recipe chunks ──┘
 (homepage pieces)   one persistent WebGL renderer
     │
     ▼
 src/shared/ + src/components/canvas/   (homepage hero canvas and the pinned story canvas, via R3F)
```

Principles:

1. **Static first.** Every page is pre-rendered HTML. 3D code is lazy-loaded and never blocks the first paint; a poster image stands in until it is ready (and forever on devices without WebGL).
2. **Content is data.** All copy lives in `src/content/`. Components never hard-code words. Data modules must not import three.js (so pages without 3D never download it).
3. **Scenes are pure functions of progress.** A film frame is computed from a number `p` (0..1), never from elapsed time, so jumping or scrolling backwards always draws the right frame.
4. **Cheap by default.** On-demand rendering, one renderer shared by all film pages, textures uploaded one per frame, reduced motion and low-tier paths everywhere.

## 2. Routes (`src/app`)

| Route file | Route | Notes |
|---|---|---|
| `page.tsx` | `/` | renders `templates/eco/Home`. Metadata comes from `site.ts`; `robots` from `launch.ts`. |
| `[group]/page.tsx` | `/industry/`, `/shape-and-style/`, `/material/`, `/event/` | `HubPage`. `generateStaticParams` from `GROUPS`. |
| `[group]/[slug]/page.tsx` | 31 product pages | `CategoryPage`. `generateStaticParams` from `PAGES`. |
| `configurator/page.tsx` | `/configurator/` | `ConfiguratorApp` inside `Shell`. |
| `quote/page.tsx`, `contact/page.tsx` | `/quote/`, `/contact/` | forms, no backend. |
| `privacy/`, `terms/` | placeholders | text from `legal.ts`. |
| `not-found.tsx`, `robots.ts`, `sitemap.ts` | 404, robots, sitemap | generated from the catalog. |

There is **no** `/t/...` route and no template picker any more (removed 2026-11-16; see [templates-history.md](templates-history.md)).

## 3. The content model (`src/content`)

| File | Holds |
|---|---|
| `siteCore.ts` | brand name, tagline, URL, phone, WhatsApp, email, address, hours, social links. Tiny and free of page copy, so the header and forms import it without the rest. |
| `site.ts` | homepage words, footer, the making-of stage titles and lines, quote texts, SEO. |
| `catalog.ts` | **the product catalog.** 4 groups (`GROUPS`), 31 pages (`ENTRIES` → `PAGES`), 7 process recipes, skins (material, colours, print, lid, window, handle, foil, seasonal props), spec/FAQ builders, `art` (which line drawing a card shows) and `tags` (filter chips) per page, `HUB` (hub copy), `PAGE_END` (page-end copy), `relatedFor()` (related pages), `hubChips()`. |
| `routes.ts` | route constants and `quoteHref()` (the quote link that carries a product name). |
| `navData.ts` | **generated** by `scripts/gen-nav.mjs` before every build: the menu and product list as plain data. Do not edit by hand. |
| `quoteWizard.ts`, `contactPage.ts`, `legal.ts` | the quote form's words, the contact page, privacy and terms. |
| `launch.ts` | the staging/production indexing switch (`NEXT_PUBLIC_ALLOW_INDEXING`). |

### Product page = recipe + skin

Each page picks **one recipe** (how it is made: `rigid-box`, `corrugated-box`, `folding-carton`, `paper-bag`, `pouch`, `label-tag`, `tray-sleeve`) and **one skin** (what it looks like). The recipe gives the 3D film and the process steps; the skin gives colours, print, lid type, window, handle, foil and seasonal props. 31 pages share 7 recipes.

## 4. Rendering layers

| Layer | Where | Used by |
|---|---|---|
| **Film engine** | `src/film/engine.ts` + `recipes/*` | every product page and (a variant) the configurator preview |
| **Homepage hero canvas** | `src/components/canvas/Scene.tsx`, `Box3D.tsx` (R3F) | the hero box on `/` |
| **Story canvas** | `src/components/canvas/making/MakingScene.tsx`, `CartonModel.tsx`, `JourneyScene.tsx`, `CargoPlane.ts` (R3F) | the pinned 12-stage film on `/` |

Only **one** WebGL context set is alive at a time where possible: the film engine frees its context when you leave film pages; the homepage and configurator release it first and wait for the other to let go (`waitForOtherContexts`).

### The film engine (`src/film`)

- `engine.ts`: one persistent `WebGLRenderer` on one canvas that moves between pages; renders **on demand** (only when progress, size or a pointer changes); sliced mount (textures uploaded one per frame, shaders warmed in a side scene, then a swap frame, then the old recipe is disposed in a later frame); an **idle mode** (finished product gently swaying) for the first screen.
- `recipes/*.ts`: pure `update(p, camera)` functions, each with `dispose()`. A recipe is built from the page's `skin` and `steps`.
- `loaders.ts`: lazy chunk loading, prefetch on hover/focus/touch of cards and menu items (`prefetchFilm`), context hand-off.
- `kit.ts`, `props.ts`, `closed.ts`, `chain.ts`: shared geometry/material helpers (with reference counting for the shared shadow texture), seasonal props, the finished-product pose, chaining stages.
- `configurator.ts`: the preview used by `/configurator/` (same engine, driven by the box configuration).

### Homepage story (`src/shared/StoryEngine.tsx`)

A pinned section (1200vh on desktop, 780vh on mobile) writes one progress value `P` (0..1) to the store. The first 58% (`SPLIT = 0.58`) is the original 7-stage "Made" film (`CartonModel`); the rest is the 5-stage "Shipped" journey built by `JourneyScene` (counted into a batch, packed in a master carton, loaded onto a cargo plane through a side door, flown from day to dusk over a route map, delivered to a door). Details in [3d-and-animation.md](3d-and-animation.md).

## 5. State (`src/lib/store.ts`, zustand)

`profile` (device tier), `reducedMotion`, loader `progress` and `ready`, scene zones and `sceneActive`, `glLost`, `heroProgress` and `makingProgress` (0..1), `themeId`, `story3d` (framing config), `quotePrefill`.

Rules: fast-changing values (`heroProgress`, `makingProgress`) are read with `useAppStore.getState()` inside `useFrame`, never subscribed to with a hook. The store **outlives canvases** across client navigation, so every canvas resets its flags on mount (`Experience.tsx`, `ContextWatch.tsx`); this was the cause of the "two cartons after returning home" bug (see the 2026-11-16 session note).

## 6. Device tiers and fallbacks (`src/lib/deviceTier.ts`)

| Tier | Meaning | Behaviour |
|---|---|---|
| `none` | no WebGL | static 2D page: poster, all text, a working quote form, the step list instead of the film |
| `low` | weak phones | pixel ratio ≤ 1.25, no shadows, no post-processing, demand rendering, fewer props, 30 fps idle cap |
| `mid` | typical | pixel ratio ≤ 1.5, shadows |
| `high` | desktop | pixel ratio ≤ 2, post-processing, the story canvas mounts in idle time right after load |

Override with `?tier=`. On mid and low tiers the story canvas waits for the visitor's first input (scroll, touch, key, pointer) to keep the page load light. `prefers-reduced-motion` turns off smooth scroll and the film (the step list shows instead), idle sway and card movement. WebGL context loss and restore are handled (`src/lib/contextLoss.ts`, `ContextWatch.tsx`): the poster returns, then the scene.

## 7. Forms (no backend)

- `/quote/`: a five-step wizard (`components/quote/*`, logic in `lib/quote.ts`, `quoteBuild.ts`, `quoteMessage.ts`). The draft lives in the visitor's `localStorage` and is deleted after sending. It produces one readable message and opens WhatsApp (`wa.me`) or email (`mailto:`).
- `submitQuote()` (`lib/submitQuote.ts`) posts JSON to `NEXT_PUBLIC_QUOTE_ENDPOINT` when that variable is set at build time (honeypot field and time-to-fill check included).
- The homepage quote band (`components/sections/QuoteForm.tsx`) and the contact page form follow the same pattern. Nothing is stored on the website.

## 8. Configurator (`src/configurator`, `src/lib/box*.ts`)

`ConfiguratorApp` holds a `BoxConfig` (type, size, material, colour, print areas and artwork, finish, quantity). `lib/box.ts` has the types, limits, summary lines and URL (de)serialisation; `lib/boxDieline.ts` draws the flat dieline and the downloadable SVG for each type; the preview is the film engine's configurator mode. The page is two rows: options + sticky preview, then dieline + summary. It is a **preview only**: no prices, no artwork upload to a server.

## 9. SEO and launch

`app/robots.ts` and `app/sitemap.ts` come from the catalog and `siteCore.brand.url`; `lib/jsonld.ts` builds structured data; `catalog/seo.ts` builds per-page metadata. Everything is `noindex` until `NEXT_PUBLIC_ALLOW_INDEXING=1` is set for the production build.

## 10. Conventions

- Copy only in `src/content/`. Colours only in `src/lib/palette.ts` and `src/templates/eco/tokens.css` (they must match; `scripts/contrast.mjs` checks).
- No `setState` in `useFrame`; reuse geometries and materials; instance repeated objects; dispose on unmount; no allocations per frame.
- A page without a 3D canvas must not pull in GSAP, Lenis or the homepage engine (`catalog/PageFrame.tsx` is the light shell for them).
- Before finishing UI work: `npm run lint` and `npm run build`; for 3D work also the sweeps and leak tests (see [performance-and-testing.md](performance-and-testing.md)).
