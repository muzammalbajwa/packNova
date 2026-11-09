# PackNova: cinematic 3D packaging site

Scroll-driven 3D marketing site. Brand name, contact details and **all copy** live in `src/content/site.ts` (dummy values: see `CONTENT-TODO.md`). Next.js static export, deployable on Cloudflare Pages.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS 4, ESLint), `output: 'export'`
- 3D: three, @react-three/fiber, @react-three/drei
- Motion: GSAP + ScrollTrigger, Lenis smooth scroll
- State: zustand. Utilities: react-intersection-observer
- Dev only: r3f-perf, @gltf-transform/cli, gltfpack

Requires **Node >= 20.19** (Tailwind's Turbopack loader needs `require(esm)`). `.nvmrc` pins 22.

## Commands

    npm run dev      # dev server (http://localhost:3000)
    npm run build    # static export to ./out
    npm run lint
    npm run serve:out   # serve ./out with Brotli on 0.0.0.0:8080 (prints the phone URL)

    node scripts/perf-measure.mjs --base http://localhost:8080 [--cpu 4] [--net slow4g] [--mobile]
    bash scripts/perf-matrix.sh            # full throttled matrix + Lighthouse (run on a quiet machine)
    node scripts/screenshots.mjs           # desktop + mobile screenshots -> docs/screenshots/
    node scripts/making-shots.mjs --theme a --mode desktop     # every making-of stage -> docs/screenshots/making/
    node scripts/perf-making.mjs --cpu 1 | 4                   # fps / draw calls / initial JS for the making-of section
    node scripts/contrast.mjs                                  # WCAG AA check of all four themes (Node 22)
    node scripts/export-images.mjs --theme a                   # re-render hero poster + og.png for a theme

Add `?debug=1` to any page for a live fps / draw-call overlay. See `PHONE-TEST.md`, `DEPLOY.md`, `docs/PERFORMANCE.md`.

Deploy: Cloudflare Pages, build command `npm run build`, output directory `out`.
Append `?tier=low|mid|high|none` to the URL to force a device tier while testing.

## Structure

    src/app/                 layout, page, globals.css (design tokens as CSS variables)
    src/content/site.ts      ALL copy + brand/contact values (single place to edit; Urdu-ready)
    src/components/canvas/   Scene (hero canvas, own chunk), Box3D (animated hero box), PreviewScene,
                             models/PackModel (carton, folding carton, rigid box, pouch, courier bag, paper bag),
                             Loader, SceneZone, SceneLoader
    src/components/sections/ Hero, Products, MakingOf, Process, Reviews, Configurator, Quote(+Form), Footer
    src/components/ui/       Navbar, Logo, Marquee, Button, ProductIcon, SpecControls
    src/lib/                 deviceTier.ts, store.ts (zustand), scroll.ts (Lenis + ScrollTrigger),
                             textures.ts (procedural canvas textures + PBR materials), configurator.ts
    src/app/configurator/    live 3D preview page (reads ?type=&l=&w=&h=&m=)
    CONTENT-TODO.md, CREDITS.md
    public/models, public/textures   compressed GLB / KTX2 (see scripts/optimize-models.md)
    scripts/optimize-models.md       gltf-transform / gltfpack / KTX2 commands

## Themes

Four palettes live in **one file**, `src/lib/palette.ts`: A "Ivory and Ink" (default, light), B "Midnight and Gold", C "Forest and Lime", D "Paper and Cobalt".
`layout.tsx` generates the CSS variables from it, and the 3D lights, kraft color, shadows, foil/die-line inks and the loader read the same object, so a theme switch changes everything.

- `?theme=a|b|c|d` picks a theme (remembered in `localStorage`); add `?themes=1` for a small floating switcher.
- Add a theme by adding an entry to `THEMES`; check it with `node scripts/contrast.mjs`.
- The hero poster and `og.png` are renders of the default theme: re-run `scripts/export-images.mjs` after changing it.

## How your box is made (scroll story)

`MakingOf.tsx` is one pinned section (700vh desktop, 450vh mobile). A single progress value (0..1) is written to the zustand store by GSAP ScrollTrigger (`makingProgress`) and read with `getState()` in `useFrame`; React state changes only when the stage changes.
`lib/making.ts` holds the stage ranges and fold windows; `lib/dieline.ts` is the dieline (flat sheet of hinged panels) and its canvas painters; `components/canvas/making/CartonModel.tsx` is the procedural model.
It has its own lazily loaded canvas that renders only while on screen. Low tier: dpr 1, no sheen/foil shader, no stamp animation. No WebGL or reduced motion: a 7-step illustrated list with the same copy and CTA.
Copy is in `site.making`.

## Conversion

A sticky "Get a quote" (bottom bar below xl, top right from xl) and a WhatsApp button read the number from `site.ts`. The quote form asks for name, phone, what you are packing and quantity (message optional) and keeps the WhatsApp/email hand-off. CTAs call `track(event)` (`lib/track.ts`, no vendor, console in dev; push to `sinks` to connect analytics).
`site.reviews` is empty on purpose: that section renders nothing until real reviews/clients are added.

## How it works

- The canvas is loaded with `next/dynamic` (`ssr: false`), so three.js is in a separate chunk and the page paints without it.
- One fixed canvas serves the hero. Regions that need it are wrapped in `SceneZone`; the canvas stops rendering (`frameloop="never"`) when none is on screen. The making-of section has its own canvas (see above).
- `deviceTier.ts` classifies the device (low / mid / high / none). Low: dpr <= 1.25, no shadows, no post-processing, `frameloop="demand"`. None (no WebGL): static 2D fallback, all text and the quote path intact.
- A static poster (`public/textures/hero-poster.webp`, rendered from the 3D scene) is eager + `fetchpriority=high`; it fades out once the live canvas is ready.
- `prefers-reduced-motion`: Lenis off, the box rests in its open pose, CSS animations frozen.

## Measuring

`window.__gl` (hero) and `window.__glMaking` (making-of section) expose the three.js renderers in the browser console, e.g. `__glMaking.info.render.calls` (draw calls) and `.triangles`.
`r3f-perf` is installed as a dev dependency if you want an on-screen overlay.

## R3F performance rules

No setState in `useFrame` (mutate refs); reuse geometries/materials; instance repeated objects; no allocations in `useFrame`; dispose on unmount; read fast-changing store values with `getState()`.

## Performance budget

| Metric | Target |
| --- | --- |
| Initial JS (gzip), 3D in separate chunk | < 300 kB |
| Hero GLB | < 3 MB |
| Draw calls | < 100 |
| Frame rate | 60 fps desktop, 30 fps low-end phones |
