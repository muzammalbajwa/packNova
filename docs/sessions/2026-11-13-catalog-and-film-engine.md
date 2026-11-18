# 2026-11-13: the catalog and the product film engine (phases 1 and 2)

Commits: `beca8fd`, `708deae`, `65941d2`, `19a350e`, `56715a6`, `4ec30de`, `6c3f59f`, `efc523e` (reconstructed from git history).

## What was asked

Turn the nav items into real pages: a product catalog, a page per product with its own 3D "how it is made" film, hub pages, SEO files, a quote page and a contact page, and make the 3D light enough to be on every product page.

## What was built

- **Phase 1 (`beca8fd`)**: `content/catalog.ts` as the single source of truth; 29 product pages and 4 hubs; the nav wired to real pages; `robots`, `sitemap`, a 404, quote and contact pages, a link-check script.
- **Phase 2 (`708deae`)**: the **film engine** (`src/film`): one persistent renderer, lazy recipe chunks, the first three recipes (`rigid-box`, `corrugated-box`, `folding-carton`), a poster fallback, sweep and shot scripts.
- **Two more pages (`65941d2`)**: Folding Cartons overview and Poly & Courier Bags (31 pages), homepage categories link to their own pages, a mobile menu scroll lock, a menu test, link-check covering the homepage categories.
- **Prefetch (`19a350e`)**: the film downloads on hover, focus and touch of nav items, mobile menu items, hub cards, related cards and homepage category cards; a prefetch test.
- **`?perf=1` overlay (`56715a6`)**: fps average and p99, film draw time, draw calls, triangles, geometries, textures, JS heap; works in any build and does nothing without the flag.
- **Pillow and flap box closing (`4ec30de`)**: pillow boxes close with curved sides then crimped ends (a curling sheet morph); flap boxes close with two inner flaps then two outer flaps.
- **Context lifecycle (`6c3f59f`)**: the film renderer frees its WebGL context when you leave film pages (150 ms grace for film-to-film), the homepage and configurator release first and wait for the others; a leak and context test; a frame-rate script. Frame-rate results at 1440 px, 1x CPU (`efc523e`).

## Decisions

- Recipes are pure functions of progress with `dispose()`; the engine renders on demand and slices its mount over frames.
- 31 pages share 7 recipes; a page is `recipe + skin`.
- Hubs and product pages are server-rendered; the film is progressive enhancement.

## Numbers

Frame-rate and draw-call results are in `docs/perf/` and later in [performance-and-testing.md](../performance-and-testing.md).

Previous: [eco redesign](2026-11-12-eco-redesign.md). Next: [phases 3 to 6](2026-11-16-phases-3-to-6.md).
