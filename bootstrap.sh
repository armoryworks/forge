#!/usr/bin/env bash
#
# bootstrap.sh — clone all forge sibling repos as children of this one.
#
# Run from inside the forge/ wrapper directory after a fresh clone.
# Idempotent: skips repos that already exist; runs `git pull` instead.
# Also (re-)establishes hard-links + a junction so the wrapper's compose
# overlays and tools/ track the canonical copies in forge-deploy/.

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

# --- Establish compose overlay hard-links + tools/ junction ---
#
# The four overlay compose files (dev/demo/cohost/export) are byte-identical
# to forge-deploy's copies and live in both places. Hard-linking them gives
# one underlying inode, so edits in either repo propagate. docker-compose.yml
# is deliberately NOT linked — its relative build contexts (./forge-ui) differ
# from forge-deploy's (../forge-ui), so the wrapper keeps an independent copy.
#
# tools/ is junctioned (Windows) / symlinked (Unix) to forge-deploy/tools.

DEPLOY_DIR="$REPO_DIR/forge-deploy"
OVERLAYS=(docker-compose.dev.yml docker-compose.demo.yml docker-compose.cohost.yml docker-compose.export.yml)

if [[ ! -d "$DEPLOY_DIR" ]]; then
  echo
  echo "warning: forge-deploy not present — skipping link establishment"
else
  echo
  echo "Establishing wrapper links to forge-deploy/:"

  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
      # Windows: native ln -s in git-bash silently copies. Shell out to
      # PowerShell for real hard-links and a directory junction (no admin
      # needed for either). cygpath -w converts /e/dev/forge -> E:\dev\forge
      # so PowerShell receives proper Windows paths.
      WIN_REPO="$(cygpath -w "$REPO_DIR")"
      WIN_DEPLOY="$(cygpath -w "$DEPLOY_DIR")"
      for f in "${OVERLAYS[@]}"; do
        if [[ -f "$DEPLOY_DIR/$f" ]]; then
          powershell.exe -NoProfile -Command \
            "Remove-Item -Force '$WIN_REPO\\$f' -ErrorAction SilentlyContinue; New-Item -ItemType HardLink -Path '$WIN_REPO\\$f' -Value '$WIN_DEPLOY\\$f' -Force | Out-Null"
          echo "  $f: hard-link"
        fi
      done
      if [[ -d "$DEPLOY_DIR/tools" ]]; then
        powershell.exe -NoProfile -Command \
          "if (Test-Path '$WIN_REPO\\tools') { Remove-Item -Recurse -Force '$WIN_REPO\\tools' }; New-Item -ItemType Junction -Path '$WIN_REPO\\tools' -Value '$WIN_DEPLOY\\tools' | Out-Null"
        echo "  tools/: junction"
      fi
      ;;
    *)
      # Unix: ln (hard) for files, ln -s for the directory.
      for f in "${OVERLAYS[@]}"; do
        if [[ -f "$DEPLOY_DIR/$f" ]]; then
          rm -f "$REPO_DIR/$f"
          ln "$DEPLOY_DIR/$f" "$REPO_DIR/$f"
          echo "  $f: hard-link"
        fi
      done
      if [[ -d "$DEPLOY_DIR/tools" ]]; then
        rm -rf "$REPO_DIR/tools" 2>/dev/null || true
        ln -s forge-deploy/tools "$REPO_DIR/tools"
        echo "  tools/: symlink"
      fi
      ;;
  esac
fi

echo
echo "Done. Sibling layout:"
ls -d "$REPO_DIR"/forge-*
echo
echo "Next: cd forge-deploy && ./setup.sh"
