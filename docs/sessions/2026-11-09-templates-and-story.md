# 2026-11-09 to 11-10: palettes, the scroll story and four templates

Commits: `92ebca2` to `a25383a` (reconstructed from git history).

## What was built

1. **Measuring tools (`92ebca2`)**: DevTools-protocol scripts for performance and screenshots.
2. **Palette system (`c95687c`)**: four themes (`?theme=a|b|c|d`, a floating `?themes=1` switcher), the 3D reads the palette, a WCAG AA check (`scripts/contrast.mjs`).
3. **"How your box is made" story (`7055413`)**: a scroll-driven section with a procedural hinged dieline carton, 7 stages, a step indicator, a call to action and a no-WebGL list; it replaced the earlier Design/Print/Deliver scenes.
4. **Conversion pieces (`61f2e24`)**: the sticky "Get a quote" button and WhatsApp button, a shorter prefilled quote form, an empty reviews section, the `track()` helper.
5. **Posters (`1523939`)**: the hero poster and `og.png` re-rendered; `export-images` and `perf-making` scripts.
6. **Templates foundation (`18d5b93`)**: `StoryEngine`, `HeroStage`, `TemplateFrame`, a per-template 3D config, the `/t/[template]` routes and the **Editorial Light** template.
7. **Midnight Cinematic (`b3ab37a`)**, then **Eco and Industrial**, the template picker at `/`, per-template posters and OG images and a bundle fix that kept data modules free of three.js (`f4d0773`).
8. **Product icon hover animations (`3f94d0e`)**: one shared layered `ProductIcon`, one stylesheet, card lift, hover/focus/touch triggers, reduced-motion fallback.
9. **Story as a pure function of scroll progress (`58d220c`)**: the canvas mounted and warmed in idle time, the board in frame from progress 0, an instant caption swap, sweep and cold-jump tests. Then an opaque story frame (no hero ghost) and loading screenshots (`a25383a`).

## Decisions

- Scene state is a function of scroll progress only (never of elapsed time), so scrubbing backwards is always right. This rule shaped everything after.
- Four templates share one engine; only layout, tokens, fonts and framing differ (see [templates-history.md](../templates-history.md)).
- The 3D bundle must stay out of pages that do not need it (`data` modules never import three).

## Open at the end

Which template to keep was undecided (resolved on 2026-11-12/13 and 2026-11-16).

Previous: [foundations](2026-11-06-foundations.md). Next: [shipping journey and plane](2026-11-11-shipping-journey-and-plane.md).
