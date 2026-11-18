# 2026-11-19: animation and 3D quality (audit and first pass)

Commits: `d6f7c47` (quality 1) and the commit with this note (quality 2, audit outcome).

## What was asked

Raise the visual and motion quality of all 3D animations (homepage film and shipping stages, every recipe, the configurator, hero idle, hover) to a premium product-film level, without regressing performance. Phase 1: audit with contact sheets and frame sequences, a ranked list of 15 problems. Phase 2: fix worst first in small commits. Phase 3: verify budgets and report honestly.

## What was done

- Audit tooling: `scripts/anim-audit.mjs` (12-point contact sheets and 10-frame transition sequences for home, 7 recipes, an event page and the configurator at 1440 and 390), `scripts/stage-crop.mjs`. The ranked list and fix order: [../ANIMATION-AUDIT.md](../ANIMATION-AUDIT.md).
- Engine: tier-aware light balance, a tiny procedural environment (high tier), slow yaw and zoom drift. Kit: two-layer contact shadow, board relief from the sheet's own grain, anisotropy 8. Chain: fold overshoot and settle. New `film/ease.ts` and `film/env.ts`.
- Per scene: rigid lid enters inside the frame and decelerates; pouch seals satin; dark-theme day sky is a sage gradient; film captions arrive 12% into a step.

## Decisions

- Neutral tone mapping was tried first and **rejected** after comparing full-size crops: it made the kraft golden and muddy and softened the flute lines. Depth comes from the light balance, board relief and shadows instead.
- Extras are skipped on the low tier (original look), and nothing new is allocated per frame.

## Numbers and honest result

See the Outcome section of the audit. Short version: initial JS unchanged; film lazy JS +7.1 kB; shared 3D chunk unchanged; draw calls and texture counts unchanged; 1440 px 60 fps and p99 16.8 ms on every recipe; leak, sweeps and round trips pass. The 390 px 4x-throttle frame times could not be verified on a quiet machine (load 10 to 30 from VS Code); an A/B of the previous and current build under the same load showed no difference. Several of the 15 problems are only partly fixed or untouched (flat sheet thickness, hand-offs on the homepage, configurator flaps, hero and hover easing).

## Problems met

- Full-size comparison images were blank at first: the screenshot clip must use page coordinates (`y + scrollY`).
- `git stash` leaves untracked files in place; fine for A/B builds, but a second build of the previous commit needs `node_modules` copied (`cp -Rc`).

## Not tested

Real phones, Safari, Firefox; a human fast flick on a trackpad; first-frame cost of building the environment (not measured).

Previous: [configurator, hubs and docs](2026-11-18-configurator-hubs-and-docs.md). Back to the [index](README.md).
