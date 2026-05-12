#!/usr/bin/env bash
#
# bootstrap.sh — clone all forge sibling repos as children of this one,
# then (re-)establish the wrapper-side hard-links and junction to
# forge-deploy/.
#
# Run from inside the forge/ wrapper directory after a fresh clone.
# Idempotent: skips repos that already exist; runs `git pull` instead.

set -euo pipefail

OWNER="armoryworks"
SIBLINGS=(forge-ui forge-api forge-deploy forge-test forge-voice)

# Siblings clone INTO this wrapper (matches docker-compose.yml ./forge-ui
# build contexts and the .gitignore /forge-*/ entries).
REPO_DIR="$(pwd)"

echo "Bootstrapping forge siblings into: $REPO_DIR"
echo

for repo in "${SIBLINGS[@]}"; do
  target="$REPO_DIR/$repo"
  if [[ -d "$target/.git" ]]; then
    echo "  $repo: already cloned, pulling latest"
    (cd "$target" && git pull --ff-only) || echo "    (skipped — local changes?)"
  else
    echo "  $repo: cloning"
    git clone "https://github.com/$OWNER/$repo.git" "$target"
  fi
done

echo
if [[ -x "$REPO_DIR/scripts/relink.sh" ]]; then
  bash "$REPO_DIR/scripts/relink.sh"
else
  echo "warning: scripts/relink.sh missing — skipping link establishment"
fi

echo
echo "Done. Sibling layout:"
ls -d "$REPO_DIR"/forge-*
echo
echo "Next: cd forge-deploy && ./setup.sh"
