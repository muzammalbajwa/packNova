# 2026-11-16: the two-cartons bug, the film first screen, eco only, mobile speed

Commits: `801e954` (part 1), `bbce755` (part 2), `4bf4db0` and `67150fc` (part 3). Pushed to `main` as `ffec08a..67150fc` the same day.

## What was asked

Two problems found on staging plus earlier pending tasks, in order, each committed separately with numbers:

1. After leaving and returning to the homepage the hero showed **two cartons**. Reproduce it with a script, find the cause (five plain-word lines), fix it properly (reset state on mount, dispose on unmount), add a regression test, add scene object counts to `?perf=1` and the leak test, and do the same round trips for every film page and the configurator.
2. The **first screen of every film page was empty**: one composition, text left and the live stage right, a workbench surface, the real finished product swaying, a "Scroll to see how it is made" cue, a first-viewport audit of every page type at 1440x900 and 390x844 with fixes for blank pages.
3. Keep **eco** as the main homepage: tag `backup-4-templates`, remove the other three templates and all code only they used, then fix **homepage mobile speed** (Lighthouse 67, TBT 1,710 ms) with a performance trace.

## Part 1: lifecycle (`801e954`)

Cause in plain words: the store outlives canvases across client navigation; a context-loss flag set when one canvas was destroyed stayed on, and the next homepage visit treated it as a real loss and drew a second hero. Fix: `ContextWatch.tsx`, state reset in `Experience.tsx`, `detach()` clears handlers, the shadow texture is reference-counted, scene object counts in the overlay and `leak-test.mjs`. Guard: `roundtrip-test.mjs` (10 round trips plus Back/Forward, exact pixels under reduced motion). Screenshots: `docs/screenshots/pages-v1/lifecycle/`. Details: [3d-and-animation.md](../3d-and-animation.md#5-scene-lifecycle-the-2026-11-16-bug).

## Part 2: film pages first screen (`bbce755`)

Text left and the live stage right in about 60% of a 900 px viewport (phones: stage under the headline at 45% or more); step 1 starts at scroll 0; a workbench plate; an idle sway (8 to 12 degrees) that runs only on screen and with the tab visible, is capped at 30 fps on low tier and stops under reduced motion. The audit (`scripts/first-view.mjs`, screenshots in `docs/screenshots/pages-v1/first-view/`) flagged one page over the 25% blank limit, the desktop quote page (25.7%); it got a two-column layout with a side panel (now 12.5%). Hub grids got a filler card, and the configurator preview moved first on phones. Budget results: initial JS +0.1 kB, no empty frames, p99 16.8 ms, draw calls at most 33.

## Part 3: eco only and speed (`4bf4db0`, `67150fc`)

- Tag `backup-4-templates` created and pushed. Removed 76 files and about 2,900 lines (see [templates-history.md](../templates-history.md)). Homepage JS 217.6 → 216.6 kB. `scripts/dead-code.mjs` lists unreachable files.
- Speed: profile with `scripts/home-profile.mjs` found one 700 ms task building the whole journey scene in a React render. Fixes: `JourneyScene.buildSteps` is a generator built in idle slices, and on mid/low tier the story canvas is created on the visitor's first input. Lighthouse mobile at load 6 to 9: TBT 1,382 → 599 to 811 ms, score 69 → 74 to 79, long tasks 2,000 → 1,083 to 1,307 ms total, longest 617 → 211 to 272 ms. LCP unchanged (about 3.0 s simulated; the observed paint is about 175 ms). The story frames were identical to the previous build (0.000% differing pixels over 18 progress values, desktop and phone).
- `scripts/legacy-compare.mjs` needed a second old build and was replaced for this check by `story-compare.mjs`.

## Problems met on the way

- A pixel metric could not separate broken from fixed because the idle float dominated: fixed by comparing under reduced motion and asserting `glLost` and poster opacity too.
- A leaked-texture false alarm was the shared shadow texture (now reference-counted).
- Turbopack will not build a worktree whose `node_modules` is a symlink; copy it (`cp -Rc`).
- Test scripts still pointed at `/t/<template>/`; they were repointed to `/`.

## Not tested

Real phones, Safari, Firefox; Lighthouse on a quiet machine (the load was above 4 for most runs).

Previous: [phases 3 to 6](2026-11-16-phases-3-to-6.md). Next: [page end and design passes](2026-11-17-page-end-and-design-passes.md).
