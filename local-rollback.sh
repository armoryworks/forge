#!/usr/bin/env bash
# local-rollback.sh — lightweight local rollback helper for the forge dev stack.
# Two capabilities:
#   snapshot  — pg_dump the live DB with a timestamp label; tags current images with current git SHAs.
#   rollback  — restores the most-recent (or named) snapshot; re-pins images to a given SHA tag.
#
# Usage:
#   ./local-rollback.sh snapshot [label]          # take a pre-change snapshot
#   ./local-rollback.sh rollback [label]           # restore that snapshot + stop/start API
#   ./local-rollback.sh list                       # show available snapshots + image tags
#   ./local-rollback.sh pin-images                 # tag current :latest images with current git SHAs (no dump)
#
# Rollback does NOT rebuild images. It restores the DB dump and optionally re-pins the
# compose image tags to a prior SHA (edit docker-compose.pin.yml or pass --api-sha / --ui-sha).

set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "$0")/.db-backups" && pwd)"
COMPOSE_PROJECT="forge"
PG_CONTAINER="forge"
PG_USER="postgres"
PG_DB="forge"
API_REPO="$(cd "$(dirname "$0")/forge-api" && pwd)"
UI_REPO="$(cd "$(dirname "$0")/forge-ui" && pwd)"
HEALTH_URL="http://localhost:5000/api/v1/health"
HEALTH_TIMEOUT=180

cmd="${1:-help}"
label="${2:-}"

pg_dump_snapshot() {
    local name="$1"
    local dir="${BACKUP_DIR}/${name}"
    mkdir -p "$dir"
    echo "[rollback] Dumping DB to ${dir}/${name}.dump ..."
    # Stream via stdout — avoids container temp-path issues on Docker Desktop for Windows
    docker exec -i "${PG_CONTAINER}" pg_dump -U "${PG_USER}" -Fc -d "${PG_DB}" > "${dir}/${name}.dump"
    local size; size=$(stat -c%s "${dir}/${name}.dump" 2>/dev/null || stat -f%z "${dir}/${name}.dump")
    echo "[rollback] Dump complete: ${size} bytes"
}

tag_images() {
    local api_sha; api_sha=$(git -C "${API_REPO}" rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local ui_sha;  ui_sha=$(git  -C "${UI_REPO}"  rev-parse --short HEAD 2>/dev/null || echo "unknown")
    docker tag forge-forge-api:latest "forge-forge-api:main-${api_sha}" 2>/dev/null && echo "[rollback] Tagged forge-forge-api:main-${api_sha}" || true
    docker tag forge-forge-ui:latest  "forge-forge-ui:main-${ui_sha}"  2>/dev/null && echo "[rollback] Tagged forge-forge-ui:main-${ui_sha}"  || true
    echo "[rollback] Current image tags:"
    docker images --format "  {{.Repository}}:{{.Tag}}  ({{.CreatedAt}})" | grep "forge-forge" | sort
}

wait_healthy() {
    echo "[rollback] Waiting for API healthy (${HEALTH_TIMEOUT}s timeout)..."
    local elapsed=0
    until curl -sf "${HEALTH_URL}" | grep -q "Healthy" 2>/dev/null; do
        sleep 5; elapsed=$((elapsed+5))
        if [ $elapsed -ge ${HEALTH_TIMEOUT} ]; then
            echo "[rollback] ERROR: API did not become healthy within ${HEALTH_TIMEOUT}s" >&2; exit 1
        fi
        echo "  ...waiting (${elapsed}s)"
    done
    echo "[rollback] API is Healthy."
}

case "$cmd" in
  snapshot)
    ts=$(date +%Y-%m-%d-%H%M%S)
    name="${label:-snapshot-${ts}}"
    pg_dump_snapshot "$name"
    tag_images
    echo "[rollback] Snapshot '${name}' captured. To restore: $0 rollback ${name}"
    ;;

  rollback)
    if [ -z "$label" ]; then
        # Use most-recent snapshot
        label=$(ls -1t "${BACKUP_DIR}" | grep -v "^as-is" | head -1)
        [ -z "$label" ] && label="as-is-2026-05-20"
        echo "[rollback] No label given — using most-recent: ${label}"
    fi
    dump=$(ls "${BACKUP_DIR}/${label}/"*.dump 2>/dev/null | head -1 || true)
    if [ -z "$dump" ] || [ ! -f "$dump" ]; then
        echo "[rollback] ERROR: no .dump file found in ${BACKUP_DIR}/${label}/" >&2; exit 1
    fi
    echo "[rollback] Restoring from ${dump} ..."
    # Stop the API (but leave postgres running)
    docker compose -p "${COMPOSE_PROJECT}" stop forge-api forge-ui
    # Restore DB — stream via stdin to avoid container temp-path issues on Docker Desktop for Windows
    docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -c "DROP DATABASE IF EXISTS ${PG_DB};"
    docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -c "CREATE DATABASE ${PG_DB};"
    docker exec -i "${PG_CONTAINER}" pg_restore -U "${PG_USER}" -d "${PG_DB}" --no-owner --no-acl < "${dump}"
    # Restart API + UI (no rebuild — uses existing image)
    docker compose -p "${COMPOSE_PROJECT}" start forge-api forge-ui
    wait_healthy
    echo "[rollback] Rollback to '${label}' complete. DB restored; images unchanged (re-pin manually if needed)."
    ;;

  pin-images)
    tag_images
    ;;

  list)
    echo "=== Snapshots in ${BACKUP_DIR} ==="
    ls -1t "${BACKUP_DIR}" | while read -r d; do
        f="${BACKUP_DIR}/${d}"
        if [ -d "$f" ]; then
            # find any .dump file in the snapshot dir
            dump=$(ls "${f}"/*.dump 2>/dev/null | head -1 || true)
            if [ -n "$dump" ]; then
                size=$(stat -c%s "$dump" 2>/dev/null || stat -f%z "$dump")
                echo "  ${d}  (${size} bytes)"
            else
                echo "  ${d}  (no .dump file)"
            fi
        fi
    done
    echo ""
    echo "=== Local forge image tags ==="
    docker images --format "  {{.Repository}}:{{.Tag}}  ({{.CreatedAt}})" | grep "forge-forge" | sort
    ;;

  help|*)
    echo "Usage: $0 {snapshot [label] | rollback [label] | list | pin-images}"
    echo "  snapshot [label]  — dump current DB + tag images with current git SHAs"
    echo "  rollback [label]  — restore named snapshot (or most-recent) + restart API"
    echo "  list              — show available snapshots and image tags"
    echo "  pin-images        — tag :latest images with current git SHAs (no dump)"
    ;;
esac
