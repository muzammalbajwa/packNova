# PackNova documentation (start here)

PackNova is a scroll-driven, 3D marketing and quote site for a custom-packaging manufacturer. **"PackNova", the phone numbers, the address and the logo are placeholders** (see [content-guide.md](content-guide.md)); the site is built so the owner can replace them in a few files.

This file is the main entry point. It holds the whole picture in short form and links to a detailed file for every topic. When something changes in the project, update the matching topic file and add a session note (see [How these docs are kept](#how-these-docs-are-kept)).

Last updated: 2026-11-18 (after commit `1d56023`).

## Contents

| # | File | What it covers |
|---|---|---|
| 1 | [tech-stack.md](tech-stack.md) | Every technology, its version and why it is used |
| 2 | [local-setup.md](local-setup.md) | Install, run, build, serve, test, URL flags, troubleshooting |
| 3 | [architecture.md](architecture.md) | Routes, content model, state, the 3D engines, forms, SEO |
| 4 | [frontend-and-design-system.md](frontend-and-design-system.md) | The eco theme: colours, type, spacing, components, motion rules |
| 5 | [templates-history.md](templates-history.md) | The four templates, why eco won, how the others were removed and how to get them back |
| 6 | [pages-and-features.md](pages-and-features.md) | Every page type and feature, section by section |
| 7 | [3d-and-animation.md](3d-and-animation.md) | Hero box, the 12-stage story film, the film engine, the configurator preview, lifecycle and fallbacks |
| 8 | [performance-and-testing.md](performance-and-testing.md) | Budgets, measured numbers, every test script and how to run them |
| 9 | [deployment.md](deployment.md) | GitHub Actions staging deploy, production workflow, server config |
| 10 | [content-guide.md](content-guide.md) | How to edit copy, add a product page, what is still placeholder |
| 11 | [sessions/README.md](sessions/README.md) | One note per working session, newest last, with a template |
| 12 | [DESIGN-AUDIT.md](DESIGN-AUDIT.md) | The design audit (scores, fixed and open findings) |
| 13 | [ANIMATION-AUDIT.md](ANIMATION-AUDIT.md) | The 3D and animation quality audit: 15 ranked problems, what was fixed, what was not |

Other files in `docs/`: `screenshots/` (before/after images per task), `lighthouse/` and `perf/` (raw measurements), `server/htaccess.txt` (server config to paste), `final-verification.txt` (the phase 6 verification record), `compare/` and `baseline-story-sweep.txt` (regression baselines), `content-notes-earlier.md` (older content notes).

## The project in one page

**What it is.** A static website (no server code) with 31 product pages in four groups, a live 3D "how it is made" film on every product page, a 12-stage scroll film on the homepage (7 stages "Made", 5 stages "Shipped": the carton is counted, packed, loaded on a cargo plane, flown and delivered), a 3D box configurator, a five-step quote form and a contact page. Quotes go out by WhatsApp or email (and optionally a form service); nothing is stored on the site.

**Stack.** Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind CSS 4, three.js with React Three Fiber, GSAP + ScrollTrigger, Lenis smooth scroll (homepage only), zustand. Details: [tech-stack.md](tech-stack.md).

**Design.** One template, "eco": cream `#f5f0e6`, forest green `#1e4d3a`, kraft brown `#b8803f`; Newsreader (headings) and Source Sans 3 (body). The story section is a deep-forest dark block. No gradients as decoration, no glass effects, no emoji icons. Details: [frontend-and-design-system.md](frontend-and-design-system.md).

**Routes.**

| Route | What |
|---|---|
| `/` | Homepage: hero, product cards, the 12-stage film, order steps, quote band |
| `/industry/`, `/shape-and-style/`, `/material/`, `/event/` | The four hub pages (filterable card grids) |
| `/<group>/<slug>/` | 31 product pages, each with its own 3D film |
| `/configurator/` | "Design your box": live 3D preview, dieline, summary |
| `/quote/` | Five-step quote form |
| `/contact/` | Contact details and a short form |
| `/privacy/`, `/terms/` | Placeholder legal pages |
| 404, `robots.txt`, `sitemap.xml` | Generated |

**Performance budget** (all met; numbers in [performance-and-testing.md](performance-and-testing.md)): initial JS under 300 kB gzip (home about 216 kB, product pages about 144 kB, hubs about 143 kB); under 100 draw calls; 60 fps desktop and 30 fps low-end phones; CLS 0; Lighthouse accessibility 100 on every page tested.

## Quick start

```bash
nvm use 22                 # the repo pins Node 22 in .nvmrc (>= 20.19 is required)
npm install
npm run dev                # http://localhost:3000
npm run lint && npm run build   # both must pass before you push
npm run serve:out          # serve the built ./out on http://localhost:8080 (production-like)
```

Tests are plain Node scripts that drive Chrome; they need Node 22 and the built site served on port 8080. Full instructions: [local-setup.md](local-setup.md) and [performance-and-testing.md](performance-and-testing.md).

## Where things live

```
src/app/            routes (page.tsx per route), layout, robots, sitemap
src/content/        ALL copy and data: siteCore.ts (brand, contact), site.ts, catalog.ts (31 pages),
                    quoteWizard.ts, contactPage.ts, legal.ts, launch.ts (indexing switch), navData.ts (generated)
src/catalog/        components of product pages, hubs, page ends (cards, band, drawings)
src/templates/eco/  the one template: Home, Hero, Navbar, Footer, Story, Products, Process, QuoteSection, tokens.css
src/shared/         StoryEngine (pinned film), HeroStage, TemplateFrame
src/film/           the product-film engine and its recipes (one persistent WebGL renderer)
src/components/     canvas (hero, story, journey scene), forms, ui pieces
src/configurator/   the /configurator/ app
src/lib/            store, device tiers, scroll, palette, box/dieline maths, quote logic, textures
scripts/            ~60 test, measure and screenshot scripts, the static server
public/             posters, og images, textures, models, _headers
docs/               this documentation
```

More in [architecture.md](architecture.md).

## Status and open items (2026-11-18)

Done: all six build phases, scene-lifecycle bug fix, first-screen redesign of film pages, template consolidation to eco, mobile speed work, page ends (related cards, quote band, footer), two design passes, the sticky "How an order works" section, configurator layout fix, hub redesign. Everything is pushed to `main` on GitHub (`origin`: `muzammalbajwa/packNova`).

Open (from [DESIGN-AUDIT.md](DESIGN-AUDIT.md) and the session notes):

1. **Owner content** (the biggest gap): real brand name, logo, contact details, photos, specs, privacy and terms text. See [content-guide.md](content-guide.md).
2. Homepage mobile LCP is about 3.0 s in Lighthouse's simulation (the observed paint is far earlier); mobile TBT is still several hundred ms. The remaining long tasks are the hero canvas's first render and the 3D chunk's evaluation.
3. The cream + serif + warm accent look is a common "generated" look by the frontend-design skill's own calibration. The palette was pinned by the owner, so it stays; differentiate through type and real photography when available.
4. Not tested anywhere: real phones, Safari, Firefox. Everything was measured in Chrome on a Mac (headless, with CPU throttling for phone profiles).
5. A few hub grids end with a short last row; a few drawings (trays and sleeves, the Christmas bow) are simple.

## How these docs are kept

- **Topic files** (1 to 10) describe the project as it is now. Change them in the same commit as the change they describe.
- **Session notes** in [sessions/](sessions/README.md) record what each working session did and decided. Copy `sessions/_TEMPLATE.md` at the end of a session, name it `YYYY-MM-DD-topic.md` and add one line to the index.
- Numbers in these docs were measured on the dates given, on one Mac, often with a busy machine (the load average is noted where it mattered). Treat them as the order of magnitude, and re-run the scripts for a current figure.
- The older root files `README.md`, `CLAUDE.md`, `CONTENT-TODO.md`, `DEPLOY.md` and `PHONE-TEST.md` are still useful but parts are out of date (they still mention the four-template picker in places, or old file names). When they disagree with `docs/`, trust `docs/`.
