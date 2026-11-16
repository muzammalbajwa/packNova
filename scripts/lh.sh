#!/usr/bin/env bash
# Lighthouse (mobile by default) for one URL; prints scores and the main timings. Notes the machine load before and after.
# usage: bash scripts/lh.sh /quote/ [desktop] [out.json]
URL="http://127.0.0.1:8080$1"; MODE="${2:-mobile}"; OUT="${3:-/tmp/lh-$$.json}"
export PATH="${NODE22_BIN:-$HOME/.nvm/versions/node/v22.23.4/bin}:$PATH"
L0=$(sysctl -n vm.loadavg | awk '{print $2}')
FF="--form-factor=mobile"; [ "$MODE" = "desktop" ] && FF="--preset=desktop"
npx --yes lighthouse@12 "$URL" $FF --quiet --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new" --output=json --output-path="$OUT" >/dev/null 2>&1
L1=$(sysctl -n vm.loadavg | awk '{print $2}')
python3 - "$OUT" "$1" "$MODE" "$L0" "$L1" <<'PY'
import json,sys
d=json.load(open(sys.argv[1])); a=d['audits']; c=d['categories']
g=lambda k:a[k]['displayValue'].replace('\xa0',' ')
print(f"{sys.argv[2]:42} {sys.argv[3]:7} perf {round(c['performance']['score']*100):3} a11y {round(c['accessibility']['score']*100):3} bp {round(c['best-practices']['score']*100):3} seo {round(c['seo']['score']*100):3} | FCP {g('first-contentful-paint'):7} LCP {g('largest-contentful-paint'):7} TBT {g('total-blocking-time'):7} CLS {g('cumulative-layout-shift'):5} | load {sys.argv[4]}->{sys.argv[5]}")
PY
