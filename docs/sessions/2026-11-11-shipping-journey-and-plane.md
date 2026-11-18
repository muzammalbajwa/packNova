# 2026-11-11 to 11-13: the shipping journey and the cargo plane

Commits: `1f9452b` to `fe1e7ea` (journey, 11-11) and `89acd8e` to `e8a8821` (plane, 11-13). Partly reconstructed from git history and the notes in the root `CLAUDE.md`.

## What was asked (summary of the owner's brief)

Continue the "how your box is made" film after the finished box: the same box is counted into a batch, packed in a master carton, loaded on a cargo plane, flown (day to dusk, route map) and delivered to a door; one continuous camera; the same rules (pure function of progress, warmed up front, performance budgets); per-template colours; a two-chapter step indicator; the big call to action at the last stage; a 12-step fallback.

## What was built

- **Journey step 1 (`1f9452b`)**: a 12-stage progress model in two chapters ("Made" 1 to 7, "Shipped" 8 to 12) over one value `P`; `lib/making.ts` with `SPLIT = 0.58` and `toLegacy(P)` so the first seven stages stay pixel-identical (checked by `legacy-compare.mjs`); chapter-aware step indicators and 12-step fallbacks.
- **Journey step 2 (`af00633`)**: the shipped chapter as one continuous 3D film (`JourneyScene`, `lib/journey.ts`, `lib/journeyTextures.ts`): count, pack, load, fly, deliver, with a camera spline.
- **Journey step 3 (`ea9a173`)**: draw calls brought into budget (max 83; journey stages at most 66), invariant test option, draw-call script.
- **Plane (`89acd8e`, `e24962c`)**: built from one `PLANE_SPEC` with named anchors, mirrored halves, T-tail at the tail tip, lofted wings and fin, nacelles on pylons, lathe nose; `scripts/plane-test.mjs` asserts the geometry in plain Node.
- **Side-door loading (`b261a44`)**: no rear ramp; the carton crosses a roller conveyor and a feeder to a scissor-lift high-loader, up to the door sill and into the hold; a world-space clip plane cuts the carton at the fuselage skin; the plane taxis in before the Load stage and its gear extends again for the landing.
- Screenshots of all 12 stages in every template, desktop and mobile, and frame-stat results in `docs/perf/journey-*.json`.

## Decisions

- Every new object is a pure function of `P`, instanced when repeated, built and warmed up front, and tagged `userData.bg` when it is a backdrop so the invariant test ignores it.
- Timing tests refuse to run when the machine load is above 4.

Previous: [templates and story](2026-11-09-templates-and-story.md). Next: [eco redesign](2026-11-12-eco-redesign.md).
