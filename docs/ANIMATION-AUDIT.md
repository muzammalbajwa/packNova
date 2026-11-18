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

## Result

The results, per item, are recorded at the end of this file after the work (see "Outcome").
