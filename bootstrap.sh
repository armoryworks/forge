#!/usr/bin/env bash
#
# bootstrap.sh — clone all forge sibling repos as siblings of this one.
#
# Run from inside the forge/ directory after a fresh clone.
# Idempotent: skips repos that already exist; runs `git pull` instead.

set -euo pipefail

OWNER="danielhokanson"
SIBLINGS=(forge-ui forge-api forge-deploy forge-test)

# We expect to be inside forge/, so siblings go in ../
PARENT_DIR="$(cd .. && pwd)"

echo "Bootstrapping forge siblings into: $PARENT_DIR"
echo

for repo in "${SIBLINGS[@]}"; do
  target="$PARENT_DIR/$repo"
  if [[ -d "$target/.git" ]]; then
    echo "  $repo: already cloned, pulling latest"
    (cd "$target" && git pull --ff-only) || echo "    (skipped — local changes?)"
  else
    echo "  $repo: cloning"
    git clone "https://github.com/$OWNER/$repo.git" "$target"
  fi
done

echo
echo "Done. Sibling layout:"
ls -d "$PARENT_DIR"/forge*
echo
echo "Next: cd ../forge-deploy && ./setup.sh"
