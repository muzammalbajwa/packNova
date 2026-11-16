#!/usr/bin/env bash
# The full verification pass (Phase 6). Needs: npm run build done, `node scripts/serve.mjs` running on :8080, Node 22.
# bash scripts/final-verify.sh | tee docs/final-verification.txt
cd "$(dirname "$0")/.."
export PATH="${NODE22_BIN:-$HOME/.nvm/versions/node/v22.23.4/bin}:$PATH"
quiet() { for i in $(seq 1 12); do l=$(sysctl -n vm.loadavg | awk '{print $2}'); [ "$(echo "$l < 3.5" | bc)" = 1 ] && return; sleep 15; done; }
sec() { echo; echo "=== $* (load $(sysctl -n vm.loadavg | awk '{print $2}'))"; }
RECIPES="/material/rigid-boxes/,/material/corrugated-boxes/,/shape-and-style/tuck-boxes/,/shape-and-style/paper-bags/,/industry/mylar-bags/,/shape-and-style/hang-tags/,/shape-and-style/trays-and-sleeves/"
sec "node and routes"; node -v; find out -name index.html | sed 's|^out||; s|index.html$||' | sort | tr '\n' ' '; echo; find out -name index.html | wc -l
sec "lint"; npm run lint 2>&1 | tail -3
sec "link check"; node scripts/link-check.mjs 2>&1 | tail -2
sec "initial JS per route (gzip, modern browsers)"; node scripts/route-size.mjs / /industry/ /material/rigid-boxes/ /shape-and-style/tuck-boxes/ /event/halloween/ /configurator/ /quote/ /contact/ /privacy/ | cut -c1-70
sec "lazy 3D chunks of a film page"; node scripts/film-chunks.mjs /shape-and-style/tuck-boxes/ 2>&1 | awk '$1>40'
sec "empty-frame sweeps, draw calls, triangles: 1440 px"; node scripts/film-sweep.mjs --paths $RECIPES,/shape-and-style/pillow-boxes/,/shape-and-style/gable-boxes/,/event/halloween/ 2>&1 | cut -c1-120
sec "empty-frame sweeps, draw calls, triangles: 390 px"; node scripts/film-sweep.mjs --paths $RECIPES,/event/halloween/ --mode mobile 2>&1 | cut -c1-120
quiet; sec "frame rate: 1440 px, no throttle"; node scripts/perf-film.mjs --paths $RECIPES --mode desktop --cpu 1 --dur 8000 2>&1 | python3 -c "import sys,json
for l in sys.stdin:
    if l.startswith('{'):
        d=json.loads(l); print(f\"{d['path']:42} avg {d['fps']:5} fps  p99 {d['p99ms']:5} ms  max {d['maxms']:6} ms  >33ms: {d['over33']}  draw cpu avg {d['drawAvgMs']} ms\")
    elif 'load' in l: print(l.strip())"
quiet; sec "frame rate: 390 px, 4x CPU throttle"; node scripts/perf-film.mjs --paths $RECIPES --mode mobile --cpu 4 --dur 8000 2>&1 | python3 -c "import sys,json
for l in sys.stdin:
    if l.startswith('{'):
        d=json.loads(l); print(f\"{d['path']:42} avg {d['fps']:5} fps  p99 {d['p99ms']:5} ms  max {d['maxms']:6} ms  >33ms: {d['over33']}  draw cpu avg {d['drawAvgMs']} ms\")
    elif 'load' in l: print(l.strip())"
sec "20 navigations: renderer geometries, textures, programs, JS heap"; R="/material/rigid-boxes/,/material/corrugated-boxes/,/shape-and-style/tuck-boxes/,/shape-and-style/pillow-boxes/,/shape-and-style/paper-bags/,/industry/mylar-bags/,/shape-and-style/hang-tags/,/shape-and-style/trays-and-sleeves/,/event/halloween/"; node scripts/leak-test.mjs --seq "$R,/,$R,/" 2>&1 | tail -34
sec "menus (mobile menu), prefetch"; node scripts/menu-test.mjs 2>&1 | tail -12; node scripts/prefetch-test.mjs 2>&1 | tail -3
sec "accessibility (keyboard, focus, reduced motion, headings)"; node --no-warnings scripts/a11y-test.mjs 2>&1 | tail -45
sec "context loss and device tiers"; node --no-warnings scripts/context-loss-test.mjs 2>&1 | tail -15
sec "configurator"; node --no-warnings scripts/configurator-test.mjs 2>&1 | grep -E "FAIL|passed|draw calls|PASS  no"; node --no-warnings scripts/configurator-extra.mjs 2>&1 | grep -E "FAIL|passed"
sec "quote and contact (unit, browser)"; node --no-warnings scripts/quote-unit.mjs | tail -1; node --no-warnings scripts/quote-e2e.mjs 2>&1 | grep -E "FAIL|passed|FAILED|SKIP"
sec "screenshots"; node scripts/final-shots.mjs 2>&1 | tail -3
echo; echo VERIFY_DONE
