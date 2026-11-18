# Templates: history, decision and how to get the old ones back

## The experiment (2026-11-09 to 2026-11-13)

The site started as one homepage and grew into **four interchangeable templates** that shared one engine (the same 3D box, the same 12-stage story, the same content), differing only in layout, tokens, fonts and framing. The root `/` was a **template picker** with a screenshot card for each, and every template lived under `/t/<id>/` (with its own `/t/<id>/configurator/`).

| id | Name | Look | Palette |
|---|---|---|---|
| `editorial` | Editorial Light | ivory paper, serif headlines, thin rules, magazine layout | A "Ivory and Ink" |
| `cinematic` | Midnight Cinematic | dark, full-bleed 3D, giant headlines, captions over the box | B "Midnight and Gold" |
| `industrial` | Industrial Blueprint | spec-sheet look: visible grid, hard borders, mono type, dimension lines | D "Paper and Cobalt" |
| `eco` | Playful Eco, later refreshed | rounded friendly shapes, then (after the refresh) cream/forest/kraft | C "Forest and Kraft" |

Shared parts that made this possible still exist: `StoryEngine`, `HeroStage`, `TemplateFrame`, the per-template `Story3DConfig`, the palette system.

## The decision

- **2026-11-12 / 11-13: eco refresh.** The eco template was redesigned to a cream page with forest green and kraft, Newsreader headings and Source Sans 3 body, small radii and 1px rules, list-style sections and subtle motion. The header got a contact bar, dropdown menus and a mobile accordion. Commit `ba5ba5c` made **eco the site root** and removed the picker page.
- **2026-11-16: the other three templates were removed** (commit `4bf4db0`) at the owner's request ("keep eco as the main homepage").

## What was removed

76 files, about 2,900 lines:

- `src/templates/editorial/`, `cinematic/`, `industrial/` and `src/templates/registry.ts`
- the whole `src/app/t/[template]/` route tree (including the duplicate `/t/eco/` copy)
- `PreviewBack` (the "Back to templates" pill) and the `previewBack` prop
- unreachable files: the old configurator client, `PreviewScene`, `PackModel`, `ArtworkPanel`, `lib/artwork.ts`, `eco/ConfiguratorPage`, `eco/index`
- images: `og-editorial.png`, `og-cinematic.png`, `og-industrial.png`, `public/templates/*`, the three other hero posters
- palettes A, B and D from `lib/palette.ts` (the default theme became `c`), unused exports (`createPackMaterial`, `logoTexture`, `OPENABLE`, `specFromSearch`, `loadArtwork`, ...)
- test scripts were repointed from `/t/<template>/` to `/` and default to eco

**Measured effect:** homepage initial JS 217.6 kB → 216.6 kB gzip. It barely moved because the other templates were already lazy-loaded and never part of the homepage bundle. The gain is source size and clarity. Homepage visuals were checked unchanged (at most 0.22% of pixels differing, which was the idle sway), link-check 0 broken, lint 0 errors.

## How to get the old templates back

Before the removal a tag was created and pushed:

```bash
git fetch --tags
git tag -l backup-4-templates          # exists on origin
git checkout backup-4-templates        # browse or build the four-template version
git diff backup-4-templates..main -- src/templates   # see what changed
git checkout backup-4-templates -- src/templates/editorial   # restore one folder into your branch
```

To bring a template back into the current code you would also need to restore `src/templates/registry.ts`, the `/t/[template]` routes, the palette entries it used, and its fonts and tokens. Plan this as a small project, not a revert; the tag is meant as a safety net and a reference.

## Where the leftovers are

`src/shared/TemplateFrame.tsx` still wraps the homepage (it applies tokens, hands the 3D config to the engine, adds the sticky quote bar) and `data-template="eco"` is still set on the root because `tokens.css` selects on it. The doc comment in `lib/palette.ts` and the section "Templates" in the root `CLAUDE.md` were updated to say so.
