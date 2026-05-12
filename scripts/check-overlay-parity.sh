#!/usr/bin/env bash
#
# scripts/check-overlay-parity.sh — detect drift between the wrapper's
# overlay compose files and forge-deploy/'s canonical copies.
#
# The four files (docker-compose.{dev,demo,cohost,export}.yml) should be
# byte-identical because they're hard-linked. If they've drifted (editor
# atomic-save broke the inode share, manual edit on one side, etc.), this
# script flags it.
#
# Exit codes:
#   0  all four files match across wrapper and forge-deploy/
#   1  drift detected (at least one file differs)
#   2  forge-deploy/ not present (can't compare)
#
# Intended uses:
#   - Run ad-hoc when compose edits don't seem to be taking effect.
#   - Wire into CI / pre-commit to catch drift before it ships.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$REPO_DIR/forge-deploy"
OVERLAYS=(docker-compose.dev.yml docker-compose.demo.yml docker-compose.cohost.yml docker-compose.export.yml)

if [[ ! -d "$DEPLOY_DIR" ]]; then
  echo "forge-deploy/ not present at $DEPLOY_DIR — cannot check parity"
  exit 2
fi

echo "Overlay parity check (wrapper vs forge-deploy/):"

drift=0
for f in "${OVERLAYS[@]}"; do
  wrap_path="$REPO_DIR/$f"
  deploy_path="$DEPLOY_DIR/$f"
  wrap_hash=""
  deploy_hash=""
  [[ -f "$wrap_path"   ]] && wrap_hash=$(sha256sum "$wrap_path"   | cut -d' ' -f1)
  [[ -f "$deploy_path" ]] && deploy_hash=$(sha256sum "$deploy_path" | cut -d' ' -f1)
  if [[ -z "$wrap_hash" ]]; then
    echo "  $f: MISSING from wrapper"
    drift=1
  elif [[ -z "$deploy_hash" ]]; then
    echo "  $f: MISSING from forge-deploy"
    drift=1
  elif [[ "$wrap_hash" != "$deploy_hash" ]]; then
    echo "  $f: DRIFT"
    echo "    wrapper:      $wrap_hash"
    echo "    forge-deploy: $deploy_hash"
    drift=1
  else
    echo "  $f: ok"
  fi
done

if [[ $drift -eq 1 ]]; then
  echo
  echo "Drift detected. To repair:"
  echo "  1. Identify the authoritative copy (usually forge-deploy/)."
  echo "  2. Copy the authoritative content over the divergent side, OR"
  echo "  3. Run: bash scripts/relink.sh"
  echo "     (re-establishes hard-links from forge-deploy/ — destructive on the wrapper side)"
  exit 1
fi

echo
echo "All four overlay files match. Hard-links intact."
