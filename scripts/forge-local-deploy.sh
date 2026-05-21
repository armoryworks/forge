#!/usr/bin/env bash
# forge-local-deploy — lightweight LOCAL build/rollback path for the forge dev box.
#
# Production rollback lives in forge-deploy/scripts/forge-deploy (GHCR immutable
# tags + healthcheck-gated re-pin), which can't run on this box (no Pi, no GHCR).
# This gives the same guarantee locally with two primitives the charter requires
# ("a fix isn't real until it can be safely shipped and verified"):
#
#   1. DB layer  — pg_dump -Fc snapshot before a risky change; pg_restore to revert.
#   2. Code layer — build images SHA-tagged as forge-{api,ui}:main-<sha>, retain the
#                   last N, and re-pin the running stack to any retained tag.
#
# Commands:
#   build [--note "msg"]      Build + SHA-tag both images, record history, prune to N.
#   pin <api_tag> <ui_tag>    Re-pin running stack to those image tags (rollback). --no-build.
#   rollback                  Re-pin to the PREVIOUS history entry.
#   db-snapshot [label]       pg_dump -Fc the forge DB into the snapshots dir.
#   db-restore <dump>         Restore a dump into the live forge DB (stops/starts api).
#   db-verify <dump>          Restore into a throwaway DB and compare counts (non-destructive).
#   list | status            Show current pin, history, retained images, snapshots.
#
# Conventions: set -euo pipefail, quoted vars, [[ ]].
set -euo pipefail

# ── Paths / constants ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT="forge"
COMPOSE=(-p "${PROJECT}" -f "${REPO_ROOT}/docker-compose.yml" -f "${REPO_ROOT}/docker-compose.pin.yml")
STATE_DIR="${REPO_ROOT}/.local-deploy"
SNAP_DIR="${STATE_DIR}/db-snapshots"
STATE_FILE="${STATE_DIR}/state.env"
HISTORY="${STATE_DIR}/history.tsv"
RETAIN="${FORGE_RETAIN:-5}"             # how many SHA-tagged images to keep per repo
PG_CONTAINER="forge"
PG_USER="postgres"
PG_DB="forge"

mkdir -p "${SNAP_DIR}"
[[ -f "${HISTORY}" ]] || printf 'timestamp\tapi_image\tui_image\tnote\n' > "${HISTORY}"

c_g=$'\033[32m'; c_y=$'\033[33m'; c_r=$'\033[31m'; c_c=$'\033[36m'; c_0=$'\033[0m'
say() { printf '%s==>%s %s\n' "${c_c}" "${c_0}" "$*"; }
ok()  { printf '    %s[OK]%s %s\n' "${c_g}" "${c_0}" "$*"; }
warn(){ printf '    %s[!!]%s %s\n' "${c_y}" "${c_0}" "$*"; }
die() { printf '    %s[XX]%s %s\n' "${c_r}" "${c_0}" "$*" >&2; exit 1; }

git_sha() { git -C "${REPO_ROOT}/$1" rev-parse --short=7 HEAD 2>/dev/null || echo "nogit"; }
git_dirty() { [[ -n "$(git -C "${REPO_ROOT}/$1" status --porcelain 2>/dev/null)" ]] && echo "-dirty" || echo ""; }

# ── build ─────────────────────────────────────────────────────────────────────
cmd_build() {
  local note=""; [[ "${1:-}" == "--note" ]] && { note="${2:-}"; }
  local api_tag ui_tag
  api_tag="forge-api:main-$(git_sha forge-api)$(git_dirty forge-api)"
  ui_tag="forge-ui:main-$(git_sha forge-ui)$(git_dirty forge-ui)"
  say "Building + tagging  api=${api_tag}  ui=${ui_tag}"
  FORGE_API_IMAGE="${api_tag}" FORGE_UI_IMAGE="${ui_tag}" \
    docker compose "${COMPOSE[@]}" up -d --build
  # record state + history, then prune
  printf 'FORGE_API_IMAGE=%s\nFORGE_UI_IMAGE=%s\n' "${api_tag}" "${ui_tag}" > "${STATE_FILE}"
  printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "${api_tag}" "${ui_tag}" "${note}" >> "${HISTORY}"
  ok "Pinned to ${api_tag} / ${ui_tag}"
  _prune forge-api; _prune forge-ui
}

# Keep the newest $RETAIN main-* tags per repo; drop older ones not in use.
_prune() {
  local repo="$1" tag
  docker images --filter=reference="${repo}:main-*" --format '{{.Tag}} {{.CreatedAt}}' \
    | sort -k2 -r | awk 'NR>'"${RETAIN}"' {print $1}' | while read -r tag; do
      [[ -z "${tag}" ]] && continue
      if docker rmi "${repo}:${tag}" >/dev/null 2>&1; then
        warn "pruned ${repo}:${tag} (beyond retain=${RETAIN})"
      fi
    done
}

# ── pin / rollback ──────────────────────────────────────────────────────────--
cmd_pin() {
  local api_tag="$1" ui_tag="$2"
  docker image inspect "${api_tag}" >/dev/null 2>&1 || die "image not found locally: ${api_tag}"
  docker image inspect "${ui_tag}"  >/dev/null 2>&1 || die "image not found locally: ${ui_tag}"
  say "Re-pinning stack  api=${api_tag}  ui=${ui_tag}  (no rebuild)"
  FORGE_API_IMAGE="${api_tag}" FORGE_UI_IMAGE="${ui_tag}" \
    docker compose "${COMPOSE[@]}" up -d --no-build
  printf 'FORGE_API_IMAGE=%s\nFORGE_UI_IMAGE=%s\n' "${api_tag}" "${ui_tag}" > "${STATE_FILE}"
  printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "${api_tag}" "${ui_tag}" "pin/rollback" >> "${HISTORY}"
  ok "Re-pinned. Containers now run the named images."
}

cmd_rollback() {
  # previous distinct entry = second-to-last unique (api,ui) pair in history
  local prev
  prev="$(awk -F'\t' 'NR>1{print $2"\t"$3}' "${HISTORY}" | uniq | tail -2 | head -1)"
  [[ -z "${prev}" ]] && die "no previous version in history to roll back to"
  cmd_pin "$(echo "${prev}" | cut -f1)" "$(echo "${prev}" | cut -f2)"
}

# ── db snapshot / restore / verify ─────────────────────────────────────────────
cmd_db_snapshot() {
  local label="${1:-}" ts file
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  file="${SNAP_DIR}/forge-${ts}${label:+-${label}}.dump"
  say "pg_dump -Fc ${PG_DB} -> ${file}"
  docker exec "${PG_CONTAINER}" sh -c "pg_dump -U ${PG_USER} -Fc -d ${PG_DB} -f /tmp/snap.dump"
  docker cp "${PG_CONTAINER}:/tmp/snap.dump" "${file}"
  docker exec "${PG_CONTAINER}" rm -f /tmp/snap.dump
  ok "snapshot $(du -h "${file}" | cut -f1) -> ${file}"
}

cmd_db_restore() {
  local dump="$1"; [[ -f "${dump}" ]] || die "dump not found: ${dump}"
  warn "This OVERWRITES the live ${PG_DB} database. Ctrl-C within 3s to abort."; sleep 3 || true
  say "Stopping forge-api to release connections"
  docker compose "${COMPOSE[@]}" stop forge-api >/dev/null 2>&1 || docker stop forge-api >/dev/null 2>&1 || true
  docker cp "${dump}" "${PG_CONTAINER}:/tmp/restore.dump"
  docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${PG_DB}' AND pid<>pg_backend_pid();" >/dev/null
  docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${PG_DB};"
  docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d postgres -c "CREATE DATABASE ${PG_DB};"
  docker exec "${PG_CONTAINER}" pg_restore -U "${PG_USER}" -d "${PG_DB}" --no-owner --no-acl /tmp/restore.dump
  docker exec "${PG_CONTAINER}" rm -f /tmp/restore.dump
  say "Starting forge-api"
  docker compose "${COMPOSE[@]}" start forge-api >/dev/null 2>&1 || docker start forge-api >/dev/null 2>&1 || true
  ok "Restored ${dump} into ${PG_DB}. Poll /api/v1/health for readiness."
}

# Non-destructive: restore into a throwaway DB and compare table/row counts.
cmd_db_verify() {
  local dump="$1"; [[ -f "${dump}" ]] || die "dump not found: ${dump}"
  local tdb="forge_verify_$$"
  say "Verifying ${dump} -> throwaway ${tdb}"
  docker cp "${dump}" "${PG_CONTAINER}:/tmp/verify.dump"
  docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${tdb};" >/dev/null
  docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d postgres -c "CREATE DATABASE ${tdb};" >/dev/null
  local errs
  errs="$(docker exec "${PG_CONTAINER}" sh -c "pg_restore -U ${PG_USER} -d ${tdb} --no-owner --no-acl /tmp/verify.dump 2>&1 1>/dev/null | wc -l")"
  local live tabs
  tabs="$(docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${tdb}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('public','hangfire');")"
  live="$(docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${PG_DB}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('public','hangfire');")"
  docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d postgres -c "DROP DATABASE ${tdb};" >/dev/null
  docker exec "${PG_CONTAINER}" rm -f /tmp/verify.dump
  printf '    restore_stderr_lines=%s  restored_tables=%s  live_tables=%s\n' "${errs}" "${tabs}" "${live}"
  [[ "${errs}" == "0" && "${tabs}" == "${live}" ]] && ok "VERIFIED: clean restore, table count matches live" \
    || warn "review: stderr lines or table mismatch (live may have drifted since dump)"
}

# ── list / status ─────────────────────────────────────────────────────────────
cmd_list() {
  say "Current pin (${STATE_FILE})"; [[ -f "${STATE_FILE}" ]] && cat "${STATE_FILE}" || echo "  (none yet)"
  echo; say "History (newest last)"; column -t -s$'\t' "${HISTORY}" 2>/dev/null || cat "${HISTORY}"
  echo; say "Retained SHA-tagged images (retain=${RETAIN})"
  docker images --filter=reference='forge-api:main-*' --format '    {{.Repository}}:{{.Tag}}  {{.ID}}  {{.Size}}  {{.CreatedSince}}' || true
  docker images --filter=reference='forge-ui:main-*'  --format '    {{.Repository}}:{{.Tag}}  {{.ID}}  {{.Size}}  {{.CreatedSince}}' || true
  echo; say "DB snapshots"; ls -1sh "${SNAP_DIR}" 2>/dev/null | grep -v '^total' || echo "  (none)"
}

# ── dispatch ──────────────────────────────────────────────────────────────────
case "${1:-list}" in
  build)        shift; cmd_build "$@" ;;
  pin)          shift; [[ $# -eq 2 ]] || die "usage: pin <api_tag> <ui_tag>"; cmd_pin "$@" ;;
  rollback)     cmd_rollback ;;
  db-snapshot)  shift; cmd_db_snapshot "${1:-}" ;;
  db-restore)   shift; [[ $# -eq 1 ]] || die "usage: db-restore <dump>"; cmd_db_restore "$1" ;;
  db-verify)    shift; [[ $# -eq 1 ]] || die "usage: db-verify <dump>"; cmd_db_verify "$1" ;;
  list|status)  cmd_list ;;
  *) die "unknown command: ${1}. See header for commands." ;;
esac
