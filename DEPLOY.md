# Deploying to Cloudflare Pages

The site is a static export (`output: 'export'`), so Cloudflare Pages serves the `out` folder. No server, no functions.

## Before the first deploy

1. Edit `src/content/site.ts`: set `brand.url` to the real domain (used for the social preview, robots.txt and sitemap) and replace the dummy contact details (see `CONTENT-TODO.md`).
2. Check locally: `nvm use 22 && npm run lint && npm run build`.

## Option A (recommended): connect the Git repository

1. Push this project to GitHub or GitLab (the folder is already a git repository; add a remote and push).
2. Cloudflare dashboard, **Workers & Pages**, **Create**, **Pages**, **Connect to Git**, choose the repository.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Root directory:** leave empty (the repo root is the project)
4. **Environment variables** (Settings, Variables and Secrets, for both Production and Preview):
   - `NODE_VERSION` = `22` (Node 20.19 or newer is required; `.nvmrc` also says 22)
5. **Save and Deploy.** The first build takes a minute or two.

### Preview URLs you can open on any phone

Every branch and pull request that is **not** the production branch gets its own preview deployment automatically:

- Per branch: `https://<branch-name>.<project-name>.pages.dev`
- Per commit: `https://<commit-hash>.<project-name>.pages.dev`

To get one: create a branch (for example `git checkout -b preview`), push it, and open **Workers & Pages, your project, Deployments** in the dashboard.
The preview URL is shown next to that branch's deployment. It is public to anyone with the link; add Cloudflare Access (Settings, General, Access policy)
if you need to restrict it. Preview URLs use real HTTPS, Brotli compression and the cache headers in `public/_headers`, so this is the closest thing to production for phone testing.

## Option B: direct upload from your machine (no Git)

```bash
nvm use 22
npm run build
npx wrangler pages deploy out --project-name packnova --branch preview
```

- `wrangler` is not a dependency of this project; `npx` downloads it on first use. The first run asks you to log in to Cloudflare in the browser.
- The command prints the preview URL (`https://preview.packnova.pages.dev` for the branch `preview`). Use `--branch main` to publish to production instead.
- Replace `packnova` with your project name (it is created on first deploy).

## Custom domain

Workers & Pages, your project, **Custom domains**, **Set up a custom domain**. Cloudflare creates the DNS record and HTTPS certificate.
After it is live, make sure `brand.url` in `site.ts` matches the domain, then redeploy.

## Caching and headers

`public/_headers` is copied into `out/` and applied by Cloudflare Pages:
hashed files under `/_next/static/` are cached for a year (`immutable`); the poster, social image and future models/textures for a week;
HTML is always revalidated so a new deploy shows up immediately.

## After deploying, check

- `https://<your-domain>/robots.txt` and `/sitemap.xml` load.
- Paste the URL into a social-preview checker to see `og.png`.
- Open it on a phone and follow `PHONE-TEST.md`.
- The quote form hands off to WhatsApp and email only. There is no form backend yet (see `CONTENT-TODO.md`).
