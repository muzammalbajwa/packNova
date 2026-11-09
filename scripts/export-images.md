# Re-exporting the poster and social image

Both are rendered from the live 3D scene by a script, for a given theme:

```
npm run build
npm run serve:out                      # in another terminal (port 8080)
node scripts/export-images.mjs --theme a
```

It writes `public/textures/hero-poster.webp` (800x800, transparent, the closed hero box with its ground shadow) and
`public/og.png` (1200x630: theme background, accent glow, the box on the right, eyebrow + headline + brand name on the left,
all colors read from the live CSS variables of that theme). Use the theme you set as `DEFAULT_THEME` in `src/lib/palette.ts`.

The poster is only a placeholder shown before the live canvas is ready, so on a non-default theme it briefly shows the default theme's box.
