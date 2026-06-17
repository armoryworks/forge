#!/usr/bin/env bash
#
# Draft a weekly release-notes file from the app repos' commit messages.
#
# The output is a starting point, not the final text. It groups each repo's
# commit subjects since a date so the notes stay in the words the developers
# wrote. A person tidies it for readability (see releases/README.md) before it
# lands, and copies the headline items up into the primary RELEASES.md.
#
# Usage:
#   scripts/release-notes.sh [SINCE] [OUT]
#     SINCE  start date (YYYY-MM-DD). Default: the Monday of the most recent
#            weekly file, else 7 days ago.
#     OUT    output path. Default: releases/<SINCE>.md
#
# The app repos are expected as siblings of this repo. Edit APPS if that changes.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Display name -> repo path (relative to ROOT). Order sets section order.
APP_NAMES=(API Web Database)
declare -A APP_PATHS=(
  [API]="../forge-api"
  [Web]="../forge-ui"
  [Database]="../forge-db"
)

SINCE="${1:-}"
if [ -z "$SINCE" ]; then
  last="$(ls "$ROOT"/releases/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].md 2>/dev/null | sort | tail -1 || true)"
  if [ -n "$last" ]; then
    SINCE="$(basename "$last" .md)"
  else
    SINCE="$(date -d '7 days ago' +%Y-%m-%d)"
  fi
fi

OUT="${2:-$ROOT/releases/${SINCE}.md}"
PRETTY_DATE="$(date -d "$SINCE" '+%B %d, %Y' 2>/dev/null || echo "$SINCE")"

{
  echo "# Week of $PRETTY_DATE"
  echo
  echo "Draft built from commits since $SINCE. Tidy for readability before it lands,"
  echo "then copy the headline items into RELEASES.md at the top of the repo."
  echo
  for app in "${APP_NAMES[@]}"; do
    repo="$ROOT/${APP_PATHS[$app]}"
    [ -d "$repo/.git" ] || continue
    log="$(git -C "$repo" log --since="$SINCE" --no-merges --pretty='- %s' 2>/dev/null || true)"
    [ -z "$log" ] && continue
    echo "## $app"
    echo
    echo "$log"
    echo
  done
} > "$OUT"

echo "wrote $OUT"
