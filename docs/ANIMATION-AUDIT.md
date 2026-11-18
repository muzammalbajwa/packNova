# Animation and 3D quality audit (2026-11-19)

Reviewed as an art director from contact sheets (12 progress points) and frame sequences (10 frames across a transition) of: the homepage film including the shipping stages, one page per recipe (rigid, corrugated, folding, paper bag, pouch, label-tag, tray-sleeve), an event page (Halloween) and the configurator, at 1440x900 and 390x844. Images: `docs/screenshots/pages-v1/animation-quality/before/`. Tool: `node scripts/anim-audit.mjs --tag before|after`.

Skills used: **frontend-design** (loaded through the Skill tool) for the visual direction; critique and polish were applied by hand (the `impeccable` modes are not loadable through the Skill tool here, and its launcher binary was not run).

## What already works

Structure is strong: every recipe has a clear beginning, middle and rest pose; panels fold around real hinges; the shipping chapter is one continuous camera move; captions are readable; performance is far inside budget. The weakness is **craft**: the films look like clean technical models, not product films.

## Ranked problems (worst first)

| # | Where | What looks wrong and why |
|---|---|---|
| 1 | All film pages | **Flat, low-depth lighting.** Key, fill and rim are all fairly even; form shading is weak, and kraft products sit on a cream plate at almost the same value, so silhouettes do not separate. The product does not "pop". |
| 2 | All | **No environment, no tone control.** There is no reflection source, so foil, gloss and film read as matte plastic; highlights clip; kraft is a saturated orange rather than a believable brown. |
| 3 | Step 1 and 2 of every recipe, home stages 1 to 4 | **Flat sheets look like painted rectangles.** Board thickness is real but not visible: no edge highlight, no soft shadow beneath, nothing says "stiff board". |
| 4 | All | **Weak contact shadows.** One soft blob: objects (lids, flaps, belt cartons) feel like they float; the shadow does not tighten as an object comes to rest. |
| 5 | Corrugated, kraft, paper bag, tray | **Material grain is missing at film scale.** No kraft grain, no roughness variation, flute only visible as a printed line; paper, board and film all share one smooth look. |
| 6 | Pouch | **Film reads as grey glass.** The side panels are translucent grey, foil reads as black plastic, specular spots are hot and small; no wrinkle or crinkle. |
| 7 | Rigid, tray-sleeve, event | **Pieces enter from beyond the stage and are cut by its edge** (the lid arrives as a thin sliver at the top of the plate). It reads as a hard cut-out, not an entrance. |
| 8 | Every fold step | **Folds are symmetrical smoothsteps.** All walls travel together with the same curve; no anticipation, no overshoot, no settle; closing a box feels mechanical. |
| 9 | All films | **Camera is static or constant-distance within a step**, then re-frames between steps. No slow drift, no parallax, nothing says "camera". |
| 10 | Home stage 8 to 10 | **Pops at hand-offs.** The lead carton floats alone before the belt appears; the master carton disappears between frames; objects overlap the next step's pieces for a frame or two. |
| 11 | Captions (film pages and home) | **Caption swaps at the step boundary**, one to two frames before or after the key action starts; it does not settle with the action; a fast flick shows the caption of the wrong step for a moment. |
| 12 | Home, Shipped chapter | **Flat grey backdrops.** The sky is one grey rectangle with a feathered edge, clouds are grey low-poly, ground and plane are matte white/grey: muted next to the saturated Made stages and the forest section. |
| 13 | Configurator | **Fold slider: the top flaps stay vertical while the rest closes, then snap shut**; the cream box is uniformly matte and flat lit. |
| 14 | Hero idle and card hover | **Plain sine sway** and default CSS easing; no settle after a pointer lean; hover moves are mechanical. |
| 15 | Thin lines (die-line stage, foil strip, print edges) | **Shimmer and aliasing** on thin high-contrast lines when scrolling; large textures without anisotropy. |

## Planned fix order

Quality is judged on the whole set at once, so the engine-level fixes come first (every recipe benefits), then the motion system, then per-scene fixes:

1. **Lighting and grade (1, 2):** neutral tone mapping, a small procedural environment (one tiny PMREM texture, reused), rebalanced key, fill and rim, a warmer ground bounce, a slightly deeper stage plate. High and mid tiers only.
2. **Contact shadows (4):** a two-layer shadow texture (tight dark core, soft wide penumbra), reused by every blob.
3. **Materials (3, 5, 15):** kraft grain bump and roughness variation (one small shared texture), anisotropy and mipmaps on large textures.
4. **Motion system (8, 9, 14):** shared easing functions (`film/ease.ts`); fold with a slight overshoot and settle; a slow camera drift and parallax as a pure function of progress; idle sway with a settle.
5. **Transitions and captions (7, 10, 11):** entrances that start inside the frame; hand-offs; caption timing tied to the action start.
6. **Per-scene (6, 12, 13):** pouch film, homepage shipping backdrops, configurator flaps.

Everything stays a pure function of progress, with no allocations per frame; extras are lazy in the 3D chunks and skipped on the low tier.

## Outcome (after the work)

Before and after contact sheets and transition frame sequences for the homepage, all seven recipes, an event page and the configurator, at 1440 and 390 px: `docs/screenshots/pages-v1/animation-quality/before/` and `.../after/`. **Honest summary: the films are clearly better shaded and move a little more naturally, but this is a first pass, not a transformation. Half of the 15 items are only partly fixed or not touched.**

| # | Status | What was done, or why not |
|---|---|---|
| 1 Flat lighting | **Partly fixed** | Mid and high tier: stronger key and rim, softer fill, a warm ground bounce under shaded sides (`film/engine.ts`). Faces now separate more clearly. The stage plate was not changed, so kraft on cream is still low-contrast in places. |
| 2 No environment / tone | **Partly fixed** | A tiny procedural studio environment (64 px PMREM, built once) on the high tier only (`film/env.ts`). Neutral tone mapping was tried and **rejected**: it turned the kraft golden and muddy. |
| 3 Flat sheets, no thickness cue | **Not fixed** | Only helped indirectly by the board relief and shading. Real chamfered edges need new geometry in the shared chain; not done. |
| 4 Weak contact shadows | **Partly fixed** | Two-layer shadow texture (tight core plus soft penumbra) for every blob (`kit.ts`). No new per-object shadows were added, so some floating pieces still lack their own. |
| 5 Missing material grain | **Partly fixed** | Board relief from the sheet's own grain and flute lines on kraft, white and colour skins (mid and high tier; no new texture). Paper, foil and film have no new detail. |
| 6 Pouch reads as glass | **Partly fixed** | The side seals are now satin and nearly opaque. The flat seal frame around the swollen pouch, film wrinkles and foil crinkle are **not** done. |
| 7 Pieces cut by the stage edge | **Partly fixed** | Fixed for the rigid-box lid (it enters inside the frame and slows into place, `ease.ts` `glide`). The other recipes were not changed. |
| 8 Mechanical folds | **Fixed for folds** | Every wall, glue flap and tuck flap overshoots by a few degrees and settles back (`ease.ts` `settle`, used in `chain.ts`). The other helpers in `ease.ts` (cut, press, rise) exist but only the lid uses one. |
| 9 Static camera | **Fixed** | A slow parallax: a few degrees of yaw and a 3% push in and out as a pure function of progress (`ease.ts` `drift`, mid and high tier). Per-step camera choreography was **not** redone. |
| 10 Pops at hand-offs (home 8 to 10) | **Not fixed** | Left as is. |
| 11 Caption sync | **Fixed for film pages** | A step's caption now arrives 12% into the step, when its key action is under way, and the previous caption stays until then. The homepage film captions were not changed. |
| 12 Flat shipping backdrops | **Partly fixed** | The day sky is a soft sage-to-cream gradient tied to the palette (was flat grey); clouds were lightened in an earlier commit. The sky is still a feathered rectangle. |
| 13 Configurator flaps | **Not fixed** | Same fold behaviour as before (flaps stay up, then close late). |
| 14 Hero idle and hover easing | **Not fixed** | Not touched. |
| 15 Shimmer on thin lines | **Partly fixed** | Anisotropy raised from 4 to 8 on sheet textures (mid and high tier). Not measured against shimmer. |

Everything is still a pure function of progress and allocation-free per frame; the low tier keeps the original look (original lights, no relief, no environment, no drift, anisotropy 4).

### Numbers

| Budget | Result |
|---|---|
| Initial JS | unchanged: product page 144.3 kB (was 144.4), configurator 155.2 kB, homepage 216.1 kB |
| Film page lazy JS | 316.3 → 323.4 kB gzip in total (+7.1 kB). Shared 3D chunk 100.2 kB (no change), engine chunk 20.8 → 20.9 kB, a folding-carton recipe chunk 37.7 → 38.0 kB. Under the 15 kB cap. |
| Texture memory | no new canvas textures; one extra 64 px PMREM environment texture on the high tier (under 1 MB). Leak test texture counts unchanged (8, 6, 5, 4, 4, 4, 3, 8, 5). |
| Draw calls | unchanged: 3 to 33 on film pages (sweeps at 1440 and 390 px) |
| Empty frames | none (film sweeps, both sizes; story sweep: zero empty pinned frames, 300 progress values clean) |
| Frame time, 1440 px | all 7 recipes 60 fps, p99 16.8 ms (load 3.4 at the start of the run) |
| Frame time, 390 px with 4x throttle | **Not verified on a quiet machine.** The machine load was 10 to 30 (VS Code language servers), far above 4. An alternating A/B of the previous and the current build under that same load showed no difference: both swung between 55 and 60 fps and p99 17 to 50 ms and converged to 60 fps and 16.8 ms as the load fell. Re-run on a quiet machine to confirm. |
| 20-navigation leak test, scene object counts | passes (geometries, textures, programs, scene objects and heap stable; homepage scenes identical on every visit) |
| Home to other page to home round trips (10 rounds) and film Back/Forward | pass |
| Fast scroll through steps | the story and film sweeps jump and sweep progress quickly: pass; a human flick on a real trackpad was not tested |

### Still weak (be honest)

Flat sheets still look thin; materials other than kraft are not much richer; stage-edge entrances in most recipes; homepage hand-offs and captions; the configurator flaps; hero and hover easing; the shipping chapter is still low-poly matte; no real-device, Safari or Firefox testing.
