#!/usr/bin/env bash
# Lighthouse mobile and desktop for the main routes, one after the other, each waiting for the machine load to be under 3.5.
# bash scripts/lh-all.sh > docs/lighthouse/phase6-table.txt   (site on :8080, built)
cd "$(dirname "$0")/.."
PAGES="/ /material/rigid-boxes/ /material/corrugated-boxes/ /shape-and-style/tuck-boxes/ /shape-and-style/paper-bags/ /industry/mylar-bags/ /shape-and-style/hang-tags/ /shape-and-style/trays-and-sleeves/ /configurator/ /quote/ /contact/"
mkdir -p docs/lighthouse
DESKTOP="/ /material/rigid-boxes/ /configurator/ /quote/ /contact/"
for mode in mobile desktop; do
  LIST="$PAGES"; [ "$mode" = desktop ] && LIST="$DESKTOP"
  for p in $LIST; do
    n=$(echo "$p" | tr '/' '_'); [ -f "docs/lighthouse/p6-$mode$n.json" ] && continue  # already measured
    for i in $(seq 1 4); do l=$(sysctl -n vm.loadavg | awk '{print $2}'); [ "$(echo "$l < 3.5" | bc)" = 1 ] && break; sleep 15; done
    n=$(echo "$p" | tr '/' '_'); bash scripts/lh.sh "$p" "$mode" "docs/lighthouse/p6-$mode$n.json"
  done
done
echo LH_ALL_DONE
