# Local setup

How to get the project running on a Mac or Linux machine, build it, serve it like production, and run the tests.

## 1. Prerequisites

- **Git** and access to the repository `https://github.com/muzammalbajwa/packNova.git`.
- **Node.js 22** (recommended through `nvm`). The project works with Node >= 20.19, but the test scripts need Node 22.
- **Google Chrome** for the test scripts (`/Applications/Google Chrome.app` on macOS, or set `CHROME_PATH`).
- Optional: a phone on the same Wi-Fi for real-device testing (`PHONE-TEST.md` has the checklist).

```bash
nvm install 22
nvm use 22        # the .nvmrc file already says 22
node -v           # v22.x
```

If `node -v` still shows Node 20 in a new terminal, put Node 22 first on the PATH when running tests:

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.4/bin:$PATH"   # adjust the version folder to yours
```

## 2. Install and run

```bash
git clone https://github.com/muzammalbajwa/packNova.git packaging3D
cd packaging3D
npm install
npm run dev          # http://localhost:3000 (hot reload)
```

Notes:

- `next dev` rewrites a block inside `AGENTS.md`. Leave that block alone.
- The dev server is slower and heavier than production; judge performance only on the production build.

## 3. Build and serve like production

```bash
npm run lint         # must print 0 errors (warnings are known)
npm run build        # static export into ./out (the prebuild step regenerates src/content/navData.ts)
npm run serve:out    # http://localhost:8080 with Brotli/gzip and the production cache rules; also prints a phone URL
```

`scripts/serve.mjs` re-reads files when they change on disk, so a rebuild is picked up. If an old server process is still running, restart it: `pkill -f scripts/serve.mjs`, then start it again.

## 4. Environment variables (all optional)

Put them in `.env.local` for local runs (never commit secrets).

| Variable | Effect |
|---|---|
| `NEXT_PUBLIC_QUOTE_ENDPOINT` | Adds a "Send request" button to the quote and contact forms that posts JSON to this URL (Formspree, Web3Forms, own endpoint). Without it, only WhatsApp and email buttons show. |
| `NEXT_PUBLIC_QUOTE_ACCESS_KEY` | Access key for Web3Forms. |
| `NEXT_PUBLIC_ALLOW_INDEXING=1` | Production indexing switch. Leave unset on staging. |
| `CHROME_PATH` | Chrome binary for the test scripts. |

## 5. Running the tests

The test scripts need the **built site served on port 8080** and Node 22.

```bash
npm run build && npm run serve:out         # terminal 1
node scripts/link-check.mjs                # terminal 2: every internal link in the export
node scripts/a11y-test.mjs                 # keyboard, headings, reduced motion
node scripts/roundtrip-test.mjs --only home --rounds 10 --reduced 1
node scripts/page-end-test.mjs
bash scripts/lh.sh /quote/ mobile          # one Lighthouse run
bash scripts/final-verify.sh | tee docs/final-verification.txt   # the whole pass (long)
```

The full list, with what each script checks, is in [performance-and-testing.md](performance-and-testing.md).

Rules for timing tests:

- They **refuse to run when the machine load average is above 4** (a busy machine gives false frame times). Close heavy apps (VirtualBox, indexing, other browsers), or pass `--force` and note the load in your report.
- Headless Chrome runs with hardware GL flags (`--use-angle=metal`). Software GL gives false long-task numbers.
- Test scripts set `window.__eagerStory = true` (via `scripts/lib/cdp.mjs`) so the story canvas mounts without a visitor's first input. `scripts/visitor-story.mjs` passes `eager: false` to behave like a real visitor.

## 5b. Useful flags on pages

- `http://localhost:8080/?perf=1`: stats overlay (fps average and p99, draw calls, triangles, geometries, textures, scene object counts, JS heap).
- `?tier=low|mid|high|none`: force the device tier (`none` = no WebGL, shows the static fallbacks).
- Reduced motion: switch it on in the OS, or emulate it in Chrome DevTools (Rendering tab).

## 6. Working on content only

Most text changes need no code knowledge: see [content-guide.md](content-guide.md) (which file holds which words, how to add a product page).

## 7. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `ReferenceError: WebSocket is not defined` in a script | You are on Node 20. Use Node 22. |
| A page looks old after a rebuild | The static server serves an old process's files. `pkill -f scripts/serve.mjs` and start it again. |
| Test says "Load average ... (> 4)" | Machine too busy. Close apps or pass `--force` (and report the load). |
| `Could not find the Next.js package` when building a copy of the repo in another folder | Turbopack will not follow a symlinked `node_modules`. Copy it instead (`cp -Rc node_modules`). |
| Lighthouse shows a huge TBT (seconds) | Software WebGL. Use the project's `scripts/lh.sh` (hardware GL flags). |
| `npm run lint` shows many warnings about files in `.claude/` | Update `eslint.config.mjs`: `.claude/**` must be in the ignore list (it is). |
| Type errors mentioning `.next/types/validator.ts` and missing `src/app/t/...` | Stale generated types from the removed template routes. Delete `.next` and rebuild. |
| Hero or story looks empty in a screenshot | Check `?tier=none` is not set, and that the page waited for `window.__film` / `window.__glMaking` (see the scripts). |
