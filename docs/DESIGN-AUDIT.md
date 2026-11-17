# PackNova design audit (2026-11-17)

How this was done: screenshots of every page type at 1440 and 390 px (homepage at 11 scroll depths each), the code behind each weak spot, and the written methods of the installed skills (`frontend-design`, `impeccable` critique and audit rubrics, `web-design-guidelines`). The `impeccable` launcher binary was **not** run (it downloads and executes a program); its written method was followed by hand. Scores are my judgement, not a tool's output. Severity: P1 = hurts the main job, P2 = noticeable, P3 = polish.

## Verdict

The site already has a strong core: a live 3D hero, a 12-stage manufacturing film that is the real differentiator, and a consistent cream / forest / kraft system with good accessibility (Lighthouse 100 on every page tested). The weaknesses were in the connective tissue: the hero stopped reacting after load, one section was a plain text list between two spectacular ones, the film's captions were small beside a large stage, and the opened hero box collided with the headline.

| Area | Score (of 5) | Why |
|---|---|---|
| First impression (hero) | 3.5 | Live 3D box, clear promise and CTAs. The box is an anonymous kraft carton, and it was static and could cover the headline. |
| Hierarchy and scanning | 4 | One idea per section, good serif/sans pairing. "What we make" was the flattest section. |
| 3D and motion | 4 | The film is excellent. Hero, cards and page ends had little or no response to the visitor. |
| Consistency | 4 | One card language now runs from the homepage to the end of every product page. |
| Accessibility | 4.5 | Lighthouse a11y 100, AA contrast, reduced motion respected everywhere motion was added. |
| Performance | 3.5 | Mobile Lighthouse 74 to 79 on the homepage (was 67). LCP stays about 3.0 s in Lighthouse's simulation. |
| Trust and content | 2.5 | Brand, phone, address and logo are placeholders by design; there are no photos, proof or real prices. Not fixable in code. |

## Findings

### Fixed in this pass

| # | Sev | Where | Flaw | Fix |
|---|---|---|---|---|
| 1 | P1 | Hero, all sizes | The box canvas is fixed, but the hero text unpins and scrolls away while the box keeps opening, so the headline slid through the box. On phones the opened box also covered the headline. | The box now rides up with the stage once the pin ends (leaves together with the text). On phones it shrinks and lifts a little as it opens. Closed pose is unchanged, so the poster still matches. |
| 2 | P1 | Homepage "What we make" | A text list with 72 px icons: weak hierarchy, no visual, easy to skim past, and unlike the page ends. | Six cards: big drawing on the grid plate (the existing animated drawings play on hover, focus and tap), name, one line, who it is for, action. Same card language as the related-products cards. |
| 3 | P2 | Hero | Static after load. The most "3D" first screen did not respond to the visitor. | The box leans toward the pointer (damped, fine pointers only). Off under reduced motion, off on touch, no per-frame allocation. |
| 4 | P2 | Film captions | Titles at 30 / 48 px and step buttons at 14 px beside a very large stage. | Titles 36 / 60 px, counter 24 px, line 20 px, step buttons 16 px. |
| 5 | P3 | Tooling | ESLint scanned the installed skills' scripts (112 warnings). | `.claude/**` ignored. |

Fixed earlier in this session: empty first screens on all film pages, no-gap Step 1, page ends (related cards, quote band, footer), hub grids with empty cells, quote page layout, configurator preview first on phones.

### Open (recommended next, not done)

| # | Sev | Where | Flaw | Suggested fix | Cost |
|---|---|---|---|---|---|
| 6 | P2 | Hero | The hero box is a plain kraft carton: it says "box", not "PackNova". The printed green carton only appears in the film. | Print the brand on the hero box and re-export the poster (`scripts/export-images.mjs`) so the swap still matches. | Medium |
| 7 | P2 | Film stage | The stage is a framed rectangle on the dark green, which makes the film feel like an embedded widget. | Full-bleed stage with soft edges; needs the camera framing in `eco/config.ts` retuned and re-swept. | Medium |
| 8 | P2 | Look | Cream page + high-contrast serif + warm accent is, by the `frontend-design` skill's own calibration, a common generated look. The palette was pinned by you, so it stays. | Differentiate through type (a more characterful display face), one bold forest/kraft section break, and real photography when it exists. | Medium |
| 9 | P2 | Homepage ending | The quote band plus form is a heavy block after a light "Try your size in 3D". | Merge the configurator teaser into the quote band, or shorten the form to three fields. | Small |
| 10 | P3 | Delivery stage | The low-poly clouds are grey-beige and flat next to the saturated print stages. | Warmer, lighter cloud material at dusk. | Small |
| 11 | P1 (business) | Whole site | Placeholder brand, contact, no logo, no photos, no proof. | Owner content: see `CONTENT-TODO.md`. Never invent. | Owner |
| 12 | P3 | Performance | Mobile LCP about 3.0 s (simulated), TBT 600 to 800 ms. | Hero canvas first render and 3D chunk evaluation are the remaining long tasks. | Medium |

## What was kept on purpose

The eco palette, the 12-stage film and its camera, the shipping stages and the plane, the poster-to-3D swap, the performance budgets, and all copy.
