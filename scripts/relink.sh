#!/usr/bin/env bash
#
# scripts/relink.sh — (re-)establish wrapper-to-forge-deploy file links.
#
# Idempotent. Safe to run any time. Removes any existing wrapper-side
# copy/link/junction for the targeted paths and re-points them at the
# forge-deploy canonical copy.
#
# Targets:
#   docker-compose.{dev,demo,cohost,export}.yml — hard-linked
#   tools/                                       — junction (Win) / symlink (Unix)
#
# docker-compose.yml is INTENTIONALLY not touched: its relative paths
# (./forge-ui) differ from forge-deploy's (../forge-ui) and the
# wrapper-local copy is the right thing for wrapper-cwd invocations.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$REPO_DIR/forge-deploy"
OVERLAYS=(docker-compose.dev.yml docker-compose.demo.yml docker-compose.cohost.yml docker-compose.export.yml)

if [[ ! -d "$DEPLOY_DIR" ]]; then
  echo "forge-deploy/ not present at $DEPLOY_DIR — clone it first (see bootstrap.sh)"
  exit 1
fi

echo "Re-establishing wrapper links to forge-deploy/:"

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    # Windows: git-bash's `ln -s` silently copies. Shell out to PowerShell
    # for real hard-links (files, no admin needed) and a directory junction
    # (no admin needed). cygpath -w converts /e/dev/forge -> E:\dev\forge.
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
    # Unix: native ln (hard) for files, ln -s (symbolic) for the dir.
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

echo
echo "Done. Verify with: bash scripts/check-overlay-parity.sh"
