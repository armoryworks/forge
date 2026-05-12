#!/usr/bin/env bash
#
# scripts/check-ps1-bom.sh — verify every wrapper-tracked .ps1 file
# starts with a UTF-8 BOM (EF BB BF).
#
# Windows PowerShell 5 reads .ps1 files as Windows-1252 unless they
# start with a UTF-8 BOM. Any non-ASCII character (em-dashes, smart
# quotes, accented letters) in a BOM-less .ps1 will be mis-decoded
# and the parser will produce confusing "missing closing brace"-style
# errors. .editorconfig declares the convention; this script enforces it.
#
# Exit codes:
#   0  every tracked .ps1 file has the BOM
#   1  at least one is missing it
#
# Uses `git ls-files` so it only checks .ps1 files owned by this
# wrapper repo — sibling repos (forge-ui, forge-api, etc.) are nested
# but gitignored, so they don't get checked.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

echo "Checking wrapper-tracked .ps1 files for UTF-8 BOM:"

missing=0
found=0
while IFS= read -r f; do
  found=$((found + 1))
  bom=$(head -c 3 "$f" 2>/dev/null | od -An -tx1 | tr -s ' \n' ' ' | sed 's/^ //; s/ $//')
  if [[ "$bom" == "ef bb bf" ]]; then
    echo "  $f: ok"
  else
    echo "  $f: MISSING BOM (first 3 bytes: ${bom:-<empty>})"
    missing=1
  fi
done < <(git ls-files "*.ps1")

if [[ $found -eq 0 ]]; then
  echo "  (no tracked .ps1 files)"
fi

if [[ $missing -eq 1 ]]; then
  echo
  echo "Files without a BOM may parse incorrectly in Windows PowerShell 5."
  echo "To repair on Windows: powershell.exe -File scripts/fix-ps1-bom.ps1"
  exit 1
fi

echo
echo "All tracked .ps1 files have UTF-8 BOM."
