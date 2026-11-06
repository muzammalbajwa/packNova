# Credits

## 3D models, textures and imagery
All 3D models, textures, illustrations and images in this project are **generated in code or rendered from the code**:

- Box, carton, rigid box, pouch, courier bag and paper bag models: Three.js geometry (`src/components/canvas/`).
- Kraft, white and black materials, corrugation relief, logo and shipping-label decals: drawn on a canvas at runtime (`src/lib/textures.ts`).
- Product icons and the logo mark: hand-written SVG (`src/components/ui/`).
- Hero poster (`public/textures/hero-poster.webp`) and social image (`public/og.png`): rendered from the live scene.

No photographs and no third-party 3D assets, so no licenses apply.

## Fonts (SIL Open Font License 1.1, loaded through `next/font`, self-hosted at build time)
- Bricolage Grotesque (display)
- Instrument Sans (body)

## Software
Next.js, React, three.js, @react-three/fiber, @react-three/drei, GSAP, Lenis, Zustand, react-intersection-observer, Tailwind CSS: all MIT licensed.
