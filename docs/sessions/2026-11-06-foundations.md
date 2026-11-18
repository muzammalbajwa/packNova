# 2026-11-06: foundations

Commits: `ff687f4` to `cf4ea73` (reconstructed from git history; the original prompts were not kept).

## What was built

1. **Phase 1 (`ff687f4`)**: Next.js static export, an R3F canvas, device tiers (`none`/`low`/`mid`/`high`), a loader and the scroll foundation (GSAP + Lenis).
2. **Phase 2 (`aaa8808`)**: the first home page design, a procedural box, story scenes, a products section and a configurator teaser.
3. **Phase 3 (`6183aec`)**: the content moved into `site.ts` (name, contact, copy), a logo, a process section, the quote form, a model library, a configurator preview, SEO, poster and OG renders.
4. **Honest quote form (`0c8794d`)**: a form that opens WhatsApp with the message ready, with an email fallback; nothing is sent until the visitor presses send.
5. **Real configurator v1 (`3cdf12e`)**: artwork per panel, open/close, quantity, spec summary, debounced rebuilds, low-tier and no-WebGL paths.
6. **Stand-up pouch rebuilt (`fcbf033`)**: flat faces, wedge profile, boat base, heat-seal band, tear notches, 1.9k triangles.
7. **Visual pass (`93201be`)**: bevelled edges, normal maps, a procedural room environment, a footprint contact shadow.
8. **Launch groundwork (`cf4ea73`)**: the `?debug=1` overlay, `robots`, `sitemap`, `public/_headers`, `PHONE-TEST.md`, `DEPLOY.md`, the `serve:out` script.

## Decisions

- Everything 3D is generated in code (no photos, no models): no licences and no downloads. Credits are in `CREDITS.md`.
- The 3D code is a separate lazy chunk so the page paints first; a poster stands in.
- The quote form is deliberately honest: no fake "we reply in 24 hours", no backend, the visitor sends the message themselves.
- Performance budget set: initial JS under 300 kB gzip, hero model under 3 MB, under 100 draw calls, 60 fps desktop and 30 fps low-end phones.

## Not tested / open

Real devices (the `PHONE-TEST.md` checklist was written, not run against a phone), Safari, Firefox.

Next: [templates and story](2026-11-09-templates-and-story.md). Back to the [index](README.md).
