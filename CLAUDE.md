# CLAUDE.md: PackNova (packaging3D)

Project memory for Claude Code. Read this first, then `AGENTS.md` (Next.js 16 has breaking changes: read the matching guide in `node_modules/next/dist/docs/` before writing Next-specific code) and `README.md`.

PackNova is a scroll-driven, 3D marketing site for a custom-packaging manufacturer (cartons, folding cartons, rigid boxes, pouches, courier bags, paper bags). "PackNova" and all contact details are **dummy placeholders** (see `CONTENT-TODO.md`). It ships as a **static export** (no server) to Cloudflare Pages.

---

## 1. Stack

- Next.js 16.4.5 (App Router, `output: 'export'`, `trailingSlash: true`, `images.unoptimized`), React 19.3, TypeScript, Tailwind CSS 4 (via `@tailwindcss/turbopack` rule in `next.config.ts`), ESLint 9
- 3D: three 0.187, @react-three/fiber 9, @react-three/drei 10
- Motion: GSAP + ScrollTrigger, Lenis smooth scroll
- State: zustand 5. Utilities: react-intersection-observer
- Dev only: r3f-perf, @gltf-transform/cli, gltfpack
- Node >= 20.19 required (`.nvmrc` pins 22). Use `nvm use 22`.
- Fonts via `next/font`, self-hosted: Bricolage Grotesque (display), Instrument Sans (body); each template can also load its own (`templates/*/fonts.ts`).

## 2. Commands

```
npm run dev          # http://localhost:3000
npm run build        # static export to ./out
npm run lint
npm run serve:out    # serve ./out on 0.0.0.0:8080 (phone testing; no compression)

node scripts/perf-measure.mjs --base http://localhost:8080 [--cpu 4] [--net slow4g] [--mobile]
bash scripts/perf-matrix.sh                 # throttled matrix + Lighthouse (quiet machine)
node scripts/screenshots.mjs                # desktop + mobile shots -> docs/screenshots/
node scripts/making-shots.mjs --theme a --mode desktop
node scripts/perf-making.mjs --cpu 1|4      # fps / draw calls / initial JS of the making-of section
node scripts/contrast.mjs                   # WCAG AA check of the four palettes (Node 22)
node scripts/export-images.mjs --theme a    # re-render hero poster + og.png
node scripts/story-sweep.mjs / cold-jump.mjs / template-shots.mjs / hover-shots.mjs / loading-shots.mjs
```

URL flags for testing: `?debug=1` (fps/draw-call overlay), `?tier=low|mid|high|none` (force device tier), `?theme=a|b|c|d` (palette, persisted in localStorage), `?themes=1` (floating theme switcher), `?preview=1` (used by the picker links).

## 3. Current architecture (what exists today)

The site went from a single home page (phases 1 to 3) to **four interchangeable templates** sharing one engine. The root `/` is now a **template picker**, not the home page.

### Routes (`src/app`)
| Route | File | Purpose |
| --- | --- | --- |
| `/` | `app/page.tsx` | Template picker: 4 cards with screenshots from `public/templates/<id>.jpg`. `robots: noindex`. No 3D loads. |
| `/t/[template]/` | `app/t/[template]/page.tsx` | Statically generated for `editorial`, `cinematic`, `industrial`, `eco` (`dynamicParams = false`). Per-template OG image `/og-<id>.png`. |
| `/t/[template]/configurator/` | `app/t/[template]/configurator/page.tsx` | That template's configurator page. |
| `/configurator/` | `app/configurator/page.tsx` | Legacy link; renders the editorial template's configurator. `ConfiguratorClient.tsx` reads `?type=&l=&w=&h=&m=`. |
| `robots.txt`, `sitemap.xml` | `app/robots.ts`, `app/sitemap.ts` | Generated from `site.brand.url`. |

### Templates (`src/templates/`)
`registry.ts` lists `TEMPLATE_IDS`, `TEMPLATE_META` (picker metadata, no code imported) and `TEMPLATE_LOADERS` (lazy `import()` per template, so a page ships only its own CSS/JS). Each template folder has: `index.tsx` (exports `Home`, `ConfiguratorPage`), `Home`, `Hero`, `Navbar`, `Story`, `Products`, `Process`, `ConfiguratorTeaser`, `ConfiguratorPage`, `QuoteSection`, `Footer`, `fonts.ts`, `tokens.css` (CSS variables), `config.ts` (a `Story3DConfig`). `editorial` also has `Ticker`.

| id | Name | Look | Palette |
| --- | --- | --- | --- |
| editorial | Editorial Light | ivory paper, serif headlines, thin rules, magazine layout | a |
| cinematic | Midnight Cinematic | dark, full-bleed 3D, giant headlines, captions over the box | b |
| industrial | Industrial Blueprint | spec-sheet: visible grid, hard borders, mono type, dimension lines | (own tokens) |
| eco | Playful Eco | rounded shapes, lime stickers, bouncy chips on deep green | c |

**To add a template:** new folder in `src/templates/`, an entry in `registry.ts` (`TEMPLATE_IDS`, `TEMPLATE_META`, `TEMPLATE_LOADERS`), a picker screenshot in `public/templates/`, an OG image `public/og-<id>.png`.

### Shared engine (`src/shared/`)
- `StoryEngine.tsx`: pinned "how your box is made" scroll section. Wires GSAP ScrollTrigger progress into the store, lazy-loads `MakingScene` (`next/dynamic`, `ssr:false`), exposes `useStoryLinks(base)` (CTA hrefs + `track()` + quote prefill) and a `StoryApi`.
- `story3d.ts`: `Story3DConfig` (theme, camera, story/hero framing as viewport fractions, key/rim light positions, shadow multipliers, board roughness). `DEFAULT_STORY3D` equals the original framing. The model, 7 stages, timing and fold order are identical in every template; only framing, light, shadow and board finish vary.
- `HeroStage.tsx`, `TemplateFrame.tsx`, `links.ts` (`templateHref` maps `/configurator/` to `<base>/configurator/` and keeps hash targets local), `PreviewBack.tsx`, `useHideOnScroll.ts`.

### Content (single source of truth): `src/content/site.ts`
ALL copy, brand and contact values: `brand`, `contact`, `social`, `seo`, `footer`, `configurator`, `making` (7 stage titles/lines, final CTA, `quoteProduct`, `quoteNote`), `reviews`. Urdu-ready structure (comment at top of file). **Never hard-code copy in components.** `site.reviews.items` and `.clients` are intentionally empty so the section renders nothing.

### Libraries (`src/lib/`)
| File | Role |
| --- | --- |
| `deviceTier.ts` | Classifies `none` (no WebGL) / `low` / `mid` / `high`; DPR range, shadows, post-processing (high only), geometry `detail` 0..2. Overridable with `?tier=`. |
| `store.ts` | zustand: `profile`, `reducedMotion`, loader `progress`/`ready`, scene `zones`/`sceneActive`, `heroProgress`, `makingProgress`, `themeId`, `story3d`, `quotePrefill`. |
| `scroll.ts` | Lenis + ScrollTrigger init, reveal animations, `trackProgress`. |
| `palette.ts` | Four palettes A "Ivory and Ink" (default), B "Midnight and Gold", C "Forest and Kraft" (eco story; eco page colors are `ECO_PAGE`), D "Paper and Cobalt". One object drives CSS variables (generated in `layout.tsx`), 3D lights, kraft color, shadows, foil/die-line inks and the loader. `DEFAULT_THEME` lives here. |
| `making.ts` | `STAGES` (board, print, finish, diecut, fold, glue, ship) with from/to/anchor ranges, `CTA_AT` 0.94, `QUOTE_BUTTON_AT` 0.55, `FOLD` windows per hinge, `seg`/`lin` helpers. |
| `dieline.ts` | Flat sheet of hinged panels and its canvas painters (logo printed on the carton uses `brand.name`). |
| `textures.ts` | Procedural canvas textures and PBR materials (kraft, white, black, corrugation relief, logo and shipping-label decals). |
| `geometry.ts` | Procedural geometry helpers (bevelled edges etc.). |
| `configurator.ts` | `ModelId` (carton, folding, rigid, pouch, courier, paperbag), `MaterialId`, `Spec`, per-model `LIMITS` in cm, `QUANTITY_LIMITS` 1..1,000,000, printable `PANELS`, `OPENABLE`, `clampDim`. |
| `artwork.ts`, `artwork-data.ts` | Per-panel artwork (upload / text / color) for the configurator. |
| `quoteMessage.ts`, `storyQuote.ts` | Build the prefilled WhatsApp / mailto text from spec or story. |
| `track.ts` | `track(event, props)`; no vendor, logs in dev, push to `sinks` to connect analytics. |
| `useDebounced.ts` | Debounced spec for model rebuilds. |

### Components
- `components/Experience.tsx`: boots `detectDevice`, Lenis, reveal, loader, canvas. Progress creeps while the 3D chunk downloads; loader must clear in about 8 s.
- `components/canvas/`: `Scene` (hero canvas, own chunk), `Box3D` (animated hero box), `PreviewScene` (configurator), `SceneZone` (wraps regions needing the shared canvas), `SceneLoader`, `Loader`, `SceneLights`, `RoomEnv` (procedural environment), `models/PackModel` (all 6 packaging models), `making/MakingScene` + `making/CartonModel` (its own lazily loaded canvas).
- `components/ui/`: `ProductIcon` (+ shared `product-icons.css`, hover/focus/touch animation, reduced-motion fallback), `SpecControls`, `ArtworkPanel`, `QuoteHandoff`, `StickyCta`, `TrackedA`, `StageArt`, `Logo` (text wordmark + SVG mark), `Button`, `DebugOverlay`.
- `components/sections/`: `QuoteForm`, `Reviews` (templates hold the rest of the section layouts).

## 4. How the main features work

### Hero + shared canvas
`Scene` is loaded with `next/dynamic` (`ssr:false`) so three.js is a separate chunk and the page paints without it. One fixed canvas serves the hero; regions that need it are wrapped in `SceneZone`; it sets `frameloop="never"` when no zone is on screen. A static poster (`public/textures/hero-poster.webp`, rendered from the 3D scene) is eager with `fetchpriority=high` and fades out when the live canvas is ready.

### "How your box is made" scroll story
One pinned section (700vh desktop, 450vh mobile). A single progress value 0..1 is written to the store (`makingProgress`) by GSAP ScrollTrigger and read with `getState()` inside `useFrame`; React state changes only when the stage changes. The scene is a pure function of scroll progress (jumping or scrubbing backwards always renders the right frame). Own canvas, mounted and warmed in idle time, renders only on screen. Shows a 12 x 6 x 18 cm folding carton (same as the configurator default) and hands that type and size to the quote message. No WebGL or reduced motion: a 7-step illustrated list with the same copy and CTA.

### Configurator (`/configurator/`, `/t/<id>/configurator/`)
Live 3D preview of 6 models: size sliders (clamped to `LIMITS`), material (kraft/white/black), quantity, open/close animation for carton, folding and rigid, artwork per panel (image upload with size/type validation, text, color), spec summary, debounced rebuilds. Low-tier and no-WebGL fallbacks. It is a **preview only**: no pricing, no artwork submission. "Request a quote" opens WhatsApp with the spec filled in (nothing is sent until the visitor presses send), with an email fallback.

### Conversion flow
Sticky "Get a quote" (bottom bar below xl, top right from xl) and a WhatsApp button, numbers from `site.ts`. `QuoteForm` asks name, phone, what you are packing, quantity (message optional); a valid submit opens a prefilled WhatsApp chat and offers a mailto fallback. CTAs set `quotePrefill` in the store and call `track()`. **No form backend yet** (`TODO(form-service)` in `QuoteForm.tsx`).

### Performance and fallbacks
- Tiers: low = dpr <= 1.25, no shadows, no post-processing, `frameloop="demand"`; none = static 2D page with all text and a working quote form.
- `prefers-reduced-motion`: Lenis off, the box rests in its open pose, CSS animations frozen.
- Browser console hooks: `window.__gl` (hero renderer) and `window.__glMaking`, e.g. `__glMaking.info.render.calls`.
- Budget: initial JS < 300 kB gzip (3D in a separate chunk); hero GLB < 3 MB; < 100 draw calls; 60 fps desktop, 30 fps low-end phones.
- **R3F rules:** no `setState` in `useFrame` (mutate refs); reuse geometries/materials; instance repeated objects; no allocations in `useFrame`; dispose on unmount; read fast-changing store values via `getState()`, never subscribe with a hook.
- `data` modules (`artwork-data.ts`, template `config.ts`) must stay free of three.js imports so the picker and non-3D pages do not pull in the 3D bundle (fixed in commit e485cdc).

### Shipping journey (stages 8 to 12, added 2026-11-11)
The story is now 12 stages in two chapters ("Made" 1-7, "Shipped" 8-12) on one progress value P over 1200vh desktop / 780vh mobile. `lib/making.ts`: `SPLIT = 0.58`, `toLegacy(P)` maps the first 58% back to the original 7-stage timeline (CartonModel reads it, so those stages are pixel-identical: `scripts/legacy-compare.mjs`), `STAGES` (12, total-progress units), `CHAPTERS`, `CTA_AT = 0.985`.
- `lib/journey.ts` (three-free): layout constants, `beltSlot/masterSlot/boxPos/leadPose/masterState/planePose/vanState`, environment amounts (`skyAmount`, `duskAmount`, `cloudsParted`, `routeAmount`, `pinPulse`), `sampleKeys` (Hermite) and `cameraPose` (key frames in aspect-aware extents; the first key is exactly the Made camera so nothing cuts). Pure functions of P only.
- `JourneyScene.tsx` builds everything at mount and writes transforms per frame; `CargoPlane.ts` is the vehicle behind a `Vehicle` interface; `lib/journeyTextures.ts` makes the label, map, belt and box-face textures once.
- The finished `CartonModel` is the lead box of the batch (`leadPose`); its reference viewport is computed from `cam.z` and fov (not `state.viewport`, which R3F recomputes from the moving camera). Inner panels are hidden once it lies closed (draw-call budget).
- Sky: transparent objects draw after opaque ones, so the sky fades in through `gl.setClearColor(horizon, alpha)`; an opaque gradient quad (userData.bg) takes over once it is fully in.
- Rules that still apply to every new object: pure function of P, no tweens/damp, built and warmed up front, instanced repeats, < 100 draw calls (max measured 83, journey stages <= 66), `userData.bg` on backdrops so the invariant test ignores them.
- Test/measure scripts: `legacy-compare.mjs`, `story-sweep.mjs [--only-c --n N]`, `cold-jump.mjs --points ...` (use stage progress values, e.g. 0.62,0.7,0.8,0.9,0.97), `journey-calls.mjs`, `journey-shots.mjs`. Timing tests refuse to run at load average > 4.

### Assets
All 3D, textures, icons and images are **generated in code or rendered from the code** (no photos, no third-party models, so no licenses; see `CREDITS.md`). `public/models` and `public/textures` hold compressed outputs (`scripts/optimize-models.md`). `public/_headers`: hashed `/_next/static/*` cached one year immutable; poster/OG/models/textures one week; HTML always revalidated.

## 5. Build history (reconstructed from git, oldest first)

I did not have the original prompt transcripts when writing this file; this is the development path as recorded in commits. **Append the real prompts to section 7.**

1. Initial commit from Create Next App
2. Phase 1: static export, R3F canvas, device tiers, loader, scroll foundation
3. Phase 2: home page design, procedural box, story scenes, products, configurator teaser
4. Phase 3: PackNova content in `site.ts`, logo, process, quote form, model library, configurator preview, SEO, poster/OG renders
5. Honest quote form (WhatsApp hand-off + email fallback)
6. Real configurator (artwork per panel, open/close, quantity, spec summary, debounced rebuilds, low-tier and no-WebGL paths)
7. Rebuilt stand-up pouch (flat faces, wedge profile, boat base, heat-seal band, tear notches; 1.9k tris)
8. Visual pass: bevelled edges, normal maps, procedural room environment, footprint contact shadow
9. Groundwork for launch: `?debug=1` overlay, robots, sitemap, `_headers`, `PHONE-TEST.md`, `DEPLOY.md`, `serve:out`
10. Perf measurement and screenshot tooling
11. Four-theme palette system (`?theme=`, `?themes=1`), 3D reads palette, WCAG AA check
12. Scroll-driven "how your box is made" story (procedural hinged dieline carton, 7 stages, step indicator, CTA, no-WebGL list); replaced Design/Print/Deliver scenes
13. Sticky quote button + WhatsApp, shorter prefilled quote form, empty reviews section, `track()` helper
14. Re-rendered hero poster and `og.png`; `export-images` and `perf-making` scripts
15. Templates foundation: StoryEngine / HeroStage / TemplateFrame, per-template 3D config, `/t/[template]` routes, Editorial Light
16. Midnight Cinematic template
17. Eco and Industrial templates, template picker, per-template posters/OG, bundle fix, perf scripts and results
18. Product icon hover animations (layered shared `ProductIcon`, one stylesheet, card lift, hover/focus/touch, reduced-motion fallback)
19. Story scene is a pure function of scroll progress; canvas mounted and warmed in idle time; board in frame from progress 0; instant caption swap; sweep/cold-jump tests
20. Opaque story frame (no hero ghost), instant caption swap, loading screenshots (6762ca4)
21. Journey step 1: 12-stage progress model, chapters, copy, chapter-aware step indicators and 12-step fallbacks (f189bc8)
22. Journey step 2: the shipped chapter as one continuous 3D film, camera spline, plane/van/house (a96b91e)
23. Journey step 3: draw calls in budget, invariant/draw-call scripts (5dab64a)

## 6. Known gaps and TODOs

- All brand/contact values are dummy (`site.ts`): name, URL (`https://example.com`), phone, WhatsApp, email, address, socials. `public/og.png` and `og-<id>.png` have the brand baked in; regenerate after renaming (`scripts/export-images.md`).
- Quote form has no backend (WhatsApp + mailto only).
- Configurator has no pricing or artwork submission.
- No real logo, product photos, prices, certifications, testimonials, client logos or statistics. **Never invent these.**
- Urdu translation not added.
- Final template and theme not chosen. When chosen, set `DEFAULT_THEME` in `palette.ts` and re-export images.
- Privacy/cookie text needed if analytics or a backend is added.
- Docs drift: `README.md` still describes the old single-home structure (`src/components/sections/Hero, Products...`, `Scene`-only home) and mentions `docs/PERFORMANCE.md`, which does not exist (perf JSON is in `docs/perf/`). `CONTENT-TODO.md` references `sections/Quote.tsx` / `Footer.tsx` that now live in `templates/*/`. Update them when touching those areas.
- `PHONE-TEST.md` checklist has not been recorded against a real device yet.

## 7. Prompt log (add the real prompts here)

Keep this section as the running record of what the owner asked for and what was decided, newest last. Format:

```
### YYYY-MM-DD: short title
Prompt: <the owner's request, verbatim or close>
Outcome: <what was built / decided, files touched>
```

### 2026-11-11: extend the film after the finished box (stages 8 to 12)
Prompt (summary of the owner's brief): continue the "how your box is made" scroll film so the same finished box is counted into a batch, packed in a master carton, loaded on a cargo plane, flown (day to dusk, route map) and delivered to a door; one continuous camera, same pure-function/warm-up/performance rules, per-template colours, two-chapter step indicator, big CTA moved to the last stage, 12-step fallback, tests over the whole range, screenshots of every stage in all 4 templates, honest measurements.
Outcome: see "Shipping journey" above and the three commits. Timing measurements (fps, sweep speeds, cold-jump ms, 4x CPU) require a quiet machine (load average <= 4) and are recorded separately.

### 2026-11-10: create CLAUDE.md
Prompt: "create a detailed claude.md file in which we have to put all the prompts and details how the website is developed and working for now."
Outcome: This file, written from the codebase, README/DEPLOY/CONTENT-TODO/PHONE-TEST docs and git history. Earlier prompts were not available, so section 5 is reconstructed from commits.

## 8. Working rules for Claude in this repo

- Edit copy only in `src/content/site.ts`; edit colors only in `src/lib/palette.ts` (and template `tokens.css` for template-specific tokens).
- Before declaring UI work done, run `npm run lint` and `npm run build`; for 3D/scroll changes, check `?debug=1` fps and draw calls and run the relevant `scripts/*` (story-sweep, perf-making).
- Do not add invented testimonials, stats, prices, certifications or client logos.
- Do not deploy, push, or commit unless asked. `next dev` rewrites the block in `AGENTS.md`; leave it.
- Keep the 3D bundle out of non-3D pages and keep the performance budget in section 4.

### Eco refresh (2026-11-13)
- Eco page is cream/forest/kraft/sage (`ECO_PAGE` in `lib/palette.ts`, mirrored in `templates/eco/tokens.css`); the pinned story re-declares the dark palette C through the `.tone-dark` class (`stickyClassName`). `scripts/contrast.mjs` checks both blocks.
- Fonts: Newsreader 500/600 (headings) + Source Sans 3 (body), `templates/eco/fonts.ts`. No eyebrow chips, 6 to 8 px radii, 1px rules, list-style products and process.
- Eco-only wording lives in `templates/eco/copy.ts` (owner TODOs marked `TODO(owner)`, listed in CONTENT-TODO.md section 8); `site.media` holds the empty photo slots.
- `data-reveal="subtle"` (lib/scroll.ts) is the one short fade; `TemplateFrame previewBack={false}` hides the preview link.
- `scripts/refresh-shots.mjs` takes the page-walk screenshots (`docs/screenshots/refresh/{before,after}`). `scripts/export-images.mjs --template eco` writes a flat social image.
