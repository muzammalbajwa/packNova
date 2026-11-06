# PackCo: cinematic 3D packaging site

Scroll-driven 3D marketing site (placeholder brand "PackCo"). Next.js static export, deployable on Cloudflare Pages.

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
    npx serve out    # preview the export

Deploy: Cloudflare Pages, build command `npm run build`, output directory `out`.
Append `?tier=low|mid|high|none` to the URL to force a device tier while testing.

## Structure

    src/app/                 layout, page, globals.css (design tokens as CSS variables)
    src/components/canvas/   Scene (R3F canvas, own chunk), Box3D, Loader, SceneZone, SceneLoader
    src/components/sections/ Hero, Products, Story, Configurator, Quote, Footer
    src/components/ui/       Navbar, Marquee, Button
    src/lib/                 deviceTier.ts, store.ts (zustand), scroll.ts (Lenis + ScrollTrigger)
    public/models, public/textures   compressed GLB / KTX2 (see scripts/optimize-models.md)
    scripts/optimize-models.md       gltf-transform / gltfpack / KTX2 commands

## How it works

- The canvas is loaded with `next/dynamic` (`ssr: false`), so three.js is in a separate chunk and the page paints without it.
- One fixed canvas serves the whole page. Regions that need it are wrapped in `SceneZone`; the canvas stops rendering (`frameloop="never"`) when none is on screen.
- `deviceTier.ts` classifies the device (low / mid / high / none). Low: dpr <= 1.25, no shadows, no post-processing, `frameloop="demand"`. None (no WebGL): static 2D fallback, all text and the quote path intact.
- A static poster (`public/textures/hero-poster.svg`) is eager + `fetchpriority=high`; it fades out once the live canvas is ready.
- `prefers-reduced-motion`: Lenis off, the box rests in its open pose, CSS animations frozen.

## Measuring

`window.__gl` exposes the three.js renderer in the browser console, e.g. `__gl.info.render.calls` (draw calls) and `__gl.info.render.triangles`.
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
