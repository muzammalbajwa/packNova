# 3D and animation

How every moving or 3D thing works, the rules it follows, and the traps found along the way. Everything 3D is generated in code (procedural geometry and canvas textures): no photos, no third-party models, no licences.

## 1. Hero box (`components/canvas/Box3D.tsx`, `Scene.tsx`, `shared/HeroStage.tsx`)

- A corrugated carton (`W 1.6 × H 1.0 × D 1.2`, board thickness 0.035) with four flaps that open as the hero scrolls (`computePose`: open from 8% to 85% of the hero progress, rotation 0.55 → 1.95 rad). The scene reads `heroProgress` from the store with `getState()` in `useFrame` (never a hook).
- **Brand print**: a forest panel (mark, wordmark in the display face, a rule and "Custom packaging, made to order") on the front and both side walls, painted into a canvas texture (`brandPanelTexture` in `lib/textures.ts`). The wordmark shrinks until it clears the panel edge. The texture repaints once page fonts load.
- **Pointer lean**: fine pointers only, damped, off for reduced motion and tier `none`. Two numbers per move, no per-frame allocation.
- **Ride with the stage**: the hero is pinned for the first 58.3% of its 240vh track (`HERO_PIN_END = 1 - 1/2.4`); after that the fixed canvas moves the box up by one viewport height over the rest of the track, so the box leaves together with the text. (Before this fix the headline slid through the box.)
- On phones the opened box shrinks by 20% and lifts a little as it opens so it never covers the headline.
- **Poster**: `public/textures/hero-poster-eco.webp` (desktop) and `hero-poster-eco-m.webp` (phone, `<picture>` below 768 px). Regenerate both after any change to the hero box or its framing: `node scripts/export-images.mjs --template eco` and `... --phone` (site served on 8080). The script crops the poster from the live canvas at the rectangle the poster `<img>` occupies, so the swap lines up by construction; it also writes `og-eco.png`.

## 2. The 12-stage story film

Files: `shared/StoryEngine.tsx`, `components/canvas/making/{MakingScene,CartonModel,JourneyScene,CargoPlane}.tsx|ts`, `lib/making.ts`, `lib/journey.ts`, `lib/journeyTextures.ts`.

- One progress value `P` (0..1) over a pinned section (1200vh desktop, 780vh mobile), written by ScrollTrigger to the store. React state changes only when the stage changes; the scene reads `P` per frame.
- `lib/making.ts`: `SPLIT = 0.58`, `toLegacy(P)` maps the first 58% back to the original 7-stage timeline, which `CartonModel` reads (so those stages are pixel-identical to before the shipping chapter was added; `scripts/story-compare.mjs` and `legacy-compare.mjs` guard this). `CTA_AT = 0.985` (the big call to action sits at the last stage).
- **Made (7)**: Board, Print, Finish, Die-cut, Fold, Glue, Ship: a procedural hinged dieline carton with printed panels, a die press, folds and a glued seam.
- **Shipped (5)**: Count, Pack, Load, Fly, Deliver (`JourneyScene`): the finished carton is the lead box of a batch counted on a belt, packed into a corrugated master carton, loaded onto a cargo plane through a side door with roller conveyors and a scissor-lift high-loader (the carton is clipped at the fuselage skin by a world-space clip plane), flown from day to dusk over a route map, and delivered to a house with a delivery van. One continuous camera spline (`cameraPose`, Hermite key frames in aspect-aware extents; the first key equals the Made camera so nothing cuts). Everything is a pure function of `P`.
- **Plane** (`CargoPlane.ts`): built from one `PLANE_SPEC` (fractions of the fuselage length) with named anchors; lofted wings, swept fin, T-tail, nacelles on pylons, side cargo door; geometry merged per material (12 meshes, about 6.4k triangles); `scripts/plane-test.mjs` builds it in plain Node and asserts symmetry and anchor positions.
- **Budgets**: under 100 draw calls (max measured 83; journey stages ≤ 66); objects instanced; everything built and warmed before it is needed.
- **Edge feathering**: the stage has no border or card; a CSS mask feathers its edges into the dark section (`.story-stage`). The camera framing (`eco/config.ts`: `story.wide`, `narrow`, `wideAspect`) was not changed by that.
- **Time-sliced build** (2026-11-16): `JourneyScene.buildSteps` is a generator that yields between sections; `buildInSlices` runs about 6 ms per idle slot and mounts the result, then `making/warm.ts` warms shaders and textures again. Before this, the build was one 700 ms task (at a 4x slowdown) inside a React render.
- **Deferred mount on phones**: on mid and low tier the story canvas is created on the first input (scroll, wheel, touch, pointer, key); on high tier it mounts in idle time after load. Test scripts set `window.__eagerStory` to skip the wait.

## 3. The product film engine (`src/film`)

See [architecture.md](architecture.md#the-film-engine-srcfilm) for the structure. Behaviours worth knowing:

- **Recipes** (`recipes/*.ts`): `rigid-box`, `corrugated-box`, `folding-carton` (plus `pillow`), `paper-bag`, `pouch`, `label-tag`, `tray-sleeve`. A recipe returns `{ root, update(p, cam), dispose() }`; `update` sets every transform, visibility and uniform from `p`.
- **Mounting**: sliced across frames; a "swap frame" replaces the old recipe; the old one is disposed in a later frame. The first non-empty frame appears in under a second in the sweeps.
- **First screen idle mode**: the finished product (closed pose from `film/closed.ts`) sways about 8 to 12 degrees while the page idles at scroll 0, with a smooth blend into step 1. It runs only while on screen and the tab is visible, is capped to 30 fps on the low tier, stops under reduced motion and allocates nothing per frame (`scripts/idle-perf.mjs`).
- **Pillow boxes** close with curved sides, then crimped ends (a curling sheet morph); flap boxes close with two inner flaps then two outer flaps.
- **Seasonal props** (`props.ts`): pumpkin, bat, ribbon, bow, snowflake, star, leaf, confetti for event pages, instanced (fewer on the low tier).
- **Context lifecycle**: the engine frees its WebGL context when you leave film pages (a 150 ms grace for film-to-film navigation); `kit.ts` reference-counts the shared shadow texture.

## 4. Configurator preview (`film/configurator.ts`)

Same engine in "configurator" mode: builds the dieline carton for the chosen type, size, colours, print and logo, folds it with the "Flat sheet / Folded" slider, shows L/W/H labels, drag or arrow-key rotation, a rebuild without a frame hitch (`configurator-hitch.mjs` measures it), a poster while it loads and a "preview not available" message with no WebGL.

## 5. Scene lifecycle (the 2026-11-16 bug)

**Symptom:** leaving the homepage and coming back showed two hero cartons. **Cause (plain words):** the Zustand store outlives canvases across client navigation, and a context-loss flag set when one canvas was destroyed stayed on; the next homepage visit treated it as a real loss and drew a second hero. **Fix:** `ContextWatch.tsx` (resets the flag on mount and on cleanup; ignores the context loss R3F triggers itself on unmount), `Experience.tsx` resets `heroProgress`, `makingProgress` and `glLost` on mount, the engine's `detach()` nulls its handlers, `kit.ts` reference-counts the shadow texture. **Guard:** `scripts/roundtrip-test.mjs` (10 round trips plus Back/Forward, visible meshes, draw calls and an exact-pixel comparison under reduced motion) and the scene object counts in the `?perf=1` overlay and the leak test.

## 6. Rules for any new 3D

1. A pure function of progress; no tweens or damping inside the scene except the hero's pointer and pose smoothing.
2. Built and warmed before it is needed; instance repeated objects; under 100 draw calls.
3. No `setState` in `useFrame`; read fast store values with `getState()`.
4. Dispose everything on unmount; add a leak-test line if it creates a scene.
5. Every moving thing has a reduced-motion path and a no-WebGL path.
6. After changing framing or the hero box: run the sweeps (`story-sweep.mjs`, `film-sweep.mjs`), `roundtrip-test.mjs`, `leak-test.mjs`, then re-export the posters and compare poster against live (`?tier=none` against `?tier=high`).
