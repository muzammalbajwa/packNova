# Deployment

The site is a static folder (`out/`). This file describes how it gets onto a server, what the workflows do, and what has to be set up by hand.

> **Important:** `.github/workflows/deploy.yml` runs on **every push to `main`**. Pushing to `main` therefore starts a staging deploy. (This was confirmed from the workflow file; the run results could not be checked from the development machine because the GitHub CLI is not installed there. Check the Actions tab on GitHub.)

## 1. Staging: `.github/workflows/deploy.yml`

Triggers: push to `main`, or "Run workflow" by hand. One deploy at a time (`concurrency: deploy-staging`).

Steps:

1. check out the code
2. set up Node 22 with the npm cache
3. `npm ci`
4. `npm run lint`
5. `npm run build` (with the optional `NEXT_PUBLIC_QUOTE_ENDPOINT` and `NEXT_PUBLIC_QUOTE_ACCESS_KEY` secrets if set)
6. write the SSH key and known hosts from secrets
7. `rsync -az --delete out/` to `$SSH_USER@$SSH_HOST:/home/deploy/site-upload/`
8. run `sudo /usr/local/bin/packnova-deploy.sh` on the server (publishes the uploaded folder)

Secrets the repository needs: `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `SSH_USER`, `SSH_HOST` (and optionally the two `NEXT_PUBLIC_*` form secrets). The deploy user on the server needs permission to run the publish script with `sudo` without a password. Staging stays `noindex` (no `NEXT_PUBLIC_ALLOW_INDEXING`).

If lint or the build fails, nothing is uploaded. **Run `npm run lint && npm run build` locally before pushing.**

## 2. Production: `.github/workflows/deploy-production.yml`

Manual only (`workflow_dispatch`) and **not switched on**: it needs its own secrets and a repository variable `PRODUCTION_SITE_URL`. When run it asks you to type the word `production`, builds with `NEXT_PUBLIC_ALLOW_INDEXING=1` (so pages are indexable and `robots.txt` allows crawling) and uploads to the live site. Do the pre-launch checklist first: [content-guide.md](content-guide.md#before-going-live).

## 3. Server configuration

The staging server runs **OpenLiteSpeed under CyberPanel**. Paste `docs/server/htaccess.txt` at the top of the site's `.htaccess` (the five steps are written at the top of that file): it sets directory index and the 404 page, the trailing-slash rewrite the export needs (`/quote` → `/quote/`), long cache headers for hashed files under `/_next/static/`, one-week cache for posters, models and textures, no-cache for HTML, compression fallbacks, and security headers. Brotli/gzip must also be enabled in the OpenLiteSpeed settings (the file explains where). The deploy script leaves `.htaccess` alone.

`public/_headers` (cache rules in Cloudflare's format) is only for Cloudflare Pages; it does nothing on OpenLiteSpeed.

## 4. Alternative: Cloudflare Pages

`DEPLOY.md` in the repository root describes it (connect the Git repository or upload `out/` directly; no build secrets needed; custom domain; the headers file). It was the first plan and still works. Note that parts of `DEPLOY.md` predate the template removal (it may mention the picker).

## 5. After a deploy, check

- Open the staging URL on a phone and desktop: homepage, one product page, a hub, the configurator, `/quote/`.
- `curl -sI https://<domain>/_next/static/ -H 'Accept-Encoding: br'` shows a long cache header and compression; `curl -sI https://<domain>/quote/` shows the HTML headers.
- Unknown URLs show the custom 404; `/quote` redirects to `/quote/`.
- The forms: the WhatsApp and email buttons open with a prefilled message (and "Send request" appears only if a form service is configured).
- `view-source` shows `noindex` on staging.

## 6. Rolling back

Re-run the workflow on an earlier commit (Actions tab: choose the commit, "Run workflow"), or `git revert` the bad commit and push. The `backup-4-templates` tag is a reference to the four-template version only; it is not a deploy target.

## 7. Build facts that matter for hosting

- Output is plain files (`out/`), about 16 MB: HTML per route, `_next/static` JS/CSS/fonts, `textures/`, `models/`, `og-eco.png`, `robots.txt`, `sitemap.xml`, `404.html`.
- No server runtime, no environment variables at run time. `NEXT_PUBLIC_*` values are baked into the JavaScript at build time and are public.
- Every route is a directory with `index.html` (`trailingSlash: true`); the host must serve `index.html` for directories.
