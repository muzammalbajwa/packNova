#!/usr/bin/env bash
# Full performance matrix + Lighthouse against the production export.
# 1) npm run build   2) npm run serve:out (in another terminal)   3) close heavy apps, check `uptime` load < 4
# Usage: bash scripts/perf-matrix.sh [base-url]
set -u
BASE="${1:-http://localhost:8080}"
export PATH="${NODE22_BIN:-$HOME/.nvm/versions/node/v22.23.2/bin}:$PATH"
echo "load average at start: $(uptime | sed 's/.*load averages*: //')"

node scripts/perf-measure.mjs --base "$BASE" --cpu 1 --label desktop-baseline          >/dev/null
node scripts/perf-measure.mjs --base "$BASE" --cpu 4 --label desktop-cpu4             >/dev/null
node scripts/perf-measure.mjs --base "$BASE" --cpu 6 --label desktop-cpu6             >/dev/null
node scripts/perf-measure.mjs --base "$BASE" --cpu 4 --net slow4g --mobile --label mobile-cpu4-slow4g        >/dev/null
node scripts/perf-measure.mjs --base "$BASE" --cpu 6 --net slow4g --mobile --label mobile-cpu6-slow4g        >/dev/null
node scripts/perf-measure.mjs --base "$BASE" --cpu 4 --net slow4g --mobile --tier mid --label mobile-cpu4-slow4g-forced-mid >/dev/null

mkdir -p docs/lighthouse
for page in "" "configurator/"; do
  name=$([ -z "$page" ] && echo home || echo configurator)
  npx --yes lighthouse@12 "$BASE/$page" --form-factor=mobile --quiet \
    --only-categories=performance,accessibility,best-practices,seo \
    --chrome-flags="--headless=new" --output=json --output=html --output-path="docs/lighthouse/$name" >/dev/null 2>&1
done
echo "load average at end: $(uptime | sed 's/.*load averages*: //')"
echo MATRIX_DONE
