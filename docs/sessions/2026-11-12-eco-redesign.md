# 2026-11-12 to 11-13: the eco redesign and the site root

Commits: `c4e42f0`, `8835d71`, `46cbddf`, `b661d1b`, `c1f0bb4`, `f393059`, `d6f9702`, `44e2785`, `b3a17fc`, `ba5ba5c` (reconstructed from git history and the root `CLAUDE.md`).

## What was built

- **Project memory (`c4e42f0`)**: `CLAUDE.md`, the first description of the architecture and the working rules.
- **Deploy workflow (`8835d71`)**: the GitHub Actions staging deploy (see [deployment.md](../deployment.md)).
- **Eco refresh (`46cbddf`, `b661d1b`, `c1f0bb4`, `f393059`, `d6f9702`)**: the page became cream with forest green and kraft (`ECO_PAGE` in `palette.ts`, mirrored in `tokens.css`); the pinned story stays deep forest (palette C, the `.tone-dark` block); `scripts/contrast.mjs` checks both. Fonts changed to Newsreader (headings) and Source Sans 3 (body). Plain layout: rules and 6 to 8 px radii, list-style products and process, no eyebrow chips, one short subtle motion (`data-reveal="subtle"`), new copy in `templates/eco/copy.ts` with `TODO(owner)` markers, empty photo slots, a narrower hero headline, re-rendered poster and a flat social image. Before/after screenshots: `docs/screenshots/refresh/`.
- **Header (`b3a17fc`)**: a contact bar, dropdown menus (Industry, Shape & style, Material, Event) and a mobile accordion menu.
- **Root becomes eco (`ba5ba5c`)**: `/` and `/configurator/` serve the eco design and the template picker page was removed (the other templates stayed under `/t/...` until 2026-11-16).

## Decisions

- Eco was chosen as the main design. The page palette is cream/forest/kraft/sage; no gradients, glass or emoji.
- Eco-only wording lives in `copy.ts` so the shared `site.ts` stays template-neutral.

Previous: [shipping journey and plane](2026-11-11-shipping-journey-and-plane.md). Next: [catalog and film engine](2026-11-13-catalog-and-film-engine.md). See also [templates-history.md](../templates-history.md).
