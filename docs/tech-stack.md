# Tech stack

Source of truth for versions: `package.json`. Last checked 2026-11-18.

## Runtime and framework

| Piece | Version | Role | Notes |
|---|---|---|---|
| Node.js | `>= 20.19` (`.nvmrc` pins 22) | build and tests | Tailwind's Turbopack loader needs `require(esm)`. The test scripts use the global `WebSocket`, which Node 20 lacks, so **use Node 22 for tests**. |
| Next.js | 16.4.5 | framework | App Router, `output: "export"` (static HTML in `out/`), `trailingSlash: true`, `images.unoptimized`, Turbopack for dev and build. Read `node_modules/next/dist/docs/` before writing Next-specific code (this version has breaking changes; see `AGENTS.md`). |
| React | 19.3.0 | UI | Server components are used for most pages; client components only where needed. |
| TypeScript | 5 | language | `npx tsc --noEmit -p .` must be clean. |
| Tailwind CSS | 4 | styling | Through `@tailwindcss/turbopack` (rule in `next.config.ts`). Plus small hand-written CSS files per feature. |
| ESLint | 9 + `eslint-config-next` 16.4.5 | lint | `.claude/**` (installed agent skills) is ignored. |

## 3D and motion

| Piece | Version | Role |
|---|---|---|
| three | ^0.187 | WebGL. Imported from its source modules (`three/src/Three.js` alias in `next.config.ts`) so unused code is dropped: the shared 3D chunk went from 181 kB to 100 kB gzip. |
| @react-three/fiber | ^9.8.2 | React renderer for three. Used by the homepage canvases (hero and story). |
| @react-three/drei | ^10.7.9 | helpers (kept small). |
| GSAP + ScrollTrigger | ^3.15.1 | scroll progress for the pinned story and the hero, reveal animations. |
| Lenis | ^1.3.27 | smooth scrolling, homepage only (product pages do not load it). |
| zustand | ^5.1 | the small app store (`src/lib/store.ts`): device profile, loader state, scroll progress, 3D config. |
| react-intersection-observer | ^11 | "is this section on screen" for the story canvas. |

The **product film engine** (`src/film/`) does not use R3F: it is plain three.js with one persistent renderer, because it has to survive page navigation and stay small. See [3d-and-animation.md](3d-and-animation.md).

## Dev-only tools

`r3f-perf` (on-screen stats), `@gltf-transform/cli` and `gltfpack` (model optimisation notes in `scripts/optimize-models.md`).

## Fonts

Self-hosted, trimmed subsets, loaded with `next/font/local` with size-adjusted fallbacks (no layout shift):

- Headings: **Newsreader** 500 and 600 (`src/templates/eco/fonts/newsreader-500-600.woff2`)
- Body: **Source Sans 3** 400 and 700 (`src/templates/eco/fonts/sourcesans3-400-700.woff2`)

`scripts/make-fonts.py` rebuilds the subsets (Basic Latin, Latin-1, typographic punctuation and the arrows used in the copy).

## Hosting and delivery

A static folder (`out/`). Staging is deployed by a GitHub Actions workflow over SSH/rsync to a server running OpenLiteSpeed (CyberPanel); caching, compression and security headers come from a pasted `.htaccess`. `public/_headers` is for Cloudflare Pages only (an alternative documented in `DEPLOY.md`). See [deployment.md](deployment.md).

## Testing and measuring tools

No test framework. About 60 Node scripts drive a real Chrome through the DevTools protocol (`scripts/lib/cdp.mjs`, no extra packages), plus Lighthouse (`npx lighthouse@12`, via `scripts/lh.sh`). Chrome is expected at `/Applications/Google Chrome.app/...` or `CHROME_PATH`. See [performance-and-testing.md](performance-and-testing.md).

## Build-time configuration

| Setting | Where | Effect |
|---|---|---|
| `NEXT_PUBLIC_ALLOW_INDEXING=1` | env at build | Search engines may index the site (default: every page is `noindex`, `robots.txt` disallows). `src/content/launch.ts`. |
| `NEXT_PUBLIC_QUOTE_ENDPOINT`, `NEXT_PUBLIC_QUOTE_ACCESS_KEY` | env at build | Optional form service for the quote and contact forms. Values are public in the built JS: never put a secret there. |
| `prebuild` script | `package.json` | runs `scripts/gen-nav.mjs`, which regenerates `src/content/navData.ts` from the catalog. |

## Browser URL flags (for testing)

`?debug=1` or `?perf=1` (fps, draw calls, scene object counts overlay), `?tier=low|mid|high|none` (force the device tier).

## Not used (on purpose)

No database, no CMS, no server code, no analytics vendor (`track()` only logs in dev), no third-party 3D models or photos (everything 3D is generated in code; see `CREDITS.md`).
