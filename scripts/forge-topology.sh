#!/usr/bin/env bash
# forge-topology — deploy a chosen ROLE's services on THIS box and remove the rest.
#
# Solves two needs on a split deployment:
#   1. Deploy only the part that belongs here          → `up <role>`
#   2. Remove parts accidentally installed here         → `reconcile <role>`
#
# Roles (which services run on a box):
#   ui    forge-ui                                        (the web/UI server)
#   api   forge-api forge forge-storage forge-backup      (API + DB + storage, current 2-tier)
#   db    forge forge-storage forge-backup                (future dedicated DB/storage server)
#   all   every service                                   (single all-in-one box)
#
# Commands:
#   up <role> [--api-host H] [--db-host H]   Start exactly this role's services.
#   reconcile <role> [--api-host H] [...]    up <role> AND remove every forge service NOT in it.
#   remove <svc...>                          Stop + remove specific services.
#   status                                   What's running here vs. a role (drift).
#   roles                                    Print the role → service map.
#
# Data: removing a service WIPES its named volume by default (DB/MinIO data is
# destroyed). Pass --keep-data to keep volumes, --yes to skip the confirmation.
#
# Cross-host: `--api-host <ip/host>` makes the UI box reach a remote API server
# (the API box must expose forge-api:8080 to this box). `--db-host` is reserved
# for the future API→remote-DB split.
#
# Project name: defaults to "forge"; override with FORGE_PROJECT or check
# `docker compose ls` if your install used a different one (e.g. forge-deploy).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="${FORGE_PROJECT:-forge}"
BASE=(-p "${PROJECT}" -f "${REPO_ROOT}/docker-compose.yml")

ALL_SERVICES="forge-ui forge-api forge forge-storage forge-backup forge-ai forge-ai-init forge-tts forge-logs forge-signing"

role_services() {
  case "$1" in
    ui)  echo "forge-ui" ;;
    api) echo "forge-api forge forge-storage forge-backup" ;;
    db)  echo "forge forge-storage forge-backup" ;;
    all) echo "${ALL_SERVICES}" ;;
    *)   echo "__INVALID__" ;;
  esac
}

# Exact whole-token membership (avoids grep -w treating "forge" as a substring
# of "forge-ui"/"forge-api", which would wrongly keep the DB on a UI box).
in_set() { local n="$1"; shift; local x; for x in "$@"; do [[ "$x" == "$n" ]] && return 0; done; return 1; }

# Named volume that holds a service's data (empty = stateless service).
vol_for() {
  case "$1" in
    forge)         echo "pgdata" ;;
    forge-storage) echo "miniodata" ;;
    forge-ai)      echo "ollamadata" ;;
    forge-signing) echo "docusealdata" ;;
    forge-tts)     echo "ttsdata" ;;
    forge-logs)    echo "seqdata" ;;
    *)             echo "" ;;
  esac
}

API_HOST="" ; DB_HOST="" ; KEEP_DATA=0 ; ASSUME_YES=0
parse_flags() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --api-host) API_HOST="$2"; shift 2 ;;
      --db-host)  DB_HOST="$2";  shift 2 ;;
      --keep-data) KEEP_DATA=1; shift ;;
      --yes|-y)   ASSUME_YES=1; shift ;;
      *) echo "Unknown flag: $1" >&2; exit 2 ;;
    esac
  done
}

# Compose file set + env for a role (adds the UI→remote-API overlay when needed).
compose_for_role() {
  local role="$1"; local files=("${BASE[@]}")
  if [[ "${role}" == "ui" || "${role}" == "all" ]] && [[ -n "${API_HOST}" ]]; then
    files+=(-f "${REPO_ROOT}/docker-compose.ui.yml")
    export FORGE_API_HOST="${API_HOST}"
    echo "  → forge-ui will reach the API at ${API_HOST}:8080" >&2
  fi
  printf '%s\n' "${files[@]}"
}

cmd_up() {
  local role="$1"; shift; parse_flags "$@"
  local svcs; svcs="$(role_services "${role}")"
  [[ "${svcs}" == "__INVALID__" ]] && { echo "Unknown role '${role}'. Try: ui | api | db | all" >&2; exit 2; }
  if [[ "${role}" == "ui" && -z "${API_HOST}" ]]; then
    echo "WARNING: role 'ui' without --api-host — the UI will look for the API on THIS box (localhost)." >&2
    echo "         On a split deployment pass: up ui --api-host <api-server-address>" >&2
  fi
  mapfile -t files < <(compose_for_role "${role}")
  echo "[forge-topology] starting role '${role}': ${svcs}"
  # shellcheck disable=SC2086
  docker compose "${files[@]}" up -d --no-deps ${svcs}
}

# Stop + remove the given services; wipe their volumes unless --keep-data.
do_remove() {
  local svcs=("$@")
  [[ ${#svcs[@]} -eq 0 ]] && { echo "[forge-topology] nothing to remove."; return; }
  local vols=()
  if [[ "${KEEP_DATA}" -eq 0 ]]; then
    for s in "${svcs[@]}"; do local v; v="$(vol_for "$s")"; [[ -n "$v" ]] && vols+=("${PROJECT}_${v}"); done
  fi
  echo "[forge-topology] will REMOVE containers: ${svcs[*]}"
  if [[ ${#vols[@]} -gt 0 ]]; then
    echo "[forge-topology] and DELETE data volumes (IRREVERSIBLE): ${vols[*]}"
  fi
  if [[ "${ASSUME_YES}" -ne 1 ]]; then
    read -r -p "Type the project name '${PROJECT}' to confirm: " ans
    [[ "${ans}" == "${PROJECT}" ]] || { echo "Aborted."; exit 1; }
  fi
  # shellcheck disable=SC2086
  docker compose "${BASE[@]}" rm -sf "${svcs[@]}" || true
  for v in "${vols[@]}"; do docker volume rm "$v" 2>/dev/null && echo "  removed volume $v" || true; done
}

cmd_remove() { parse_remove_args "$@"; do_remove "${POSITIONAL[@]}"; }

POSITIONAL=()
parse_remove_args() {
  POSITIONAL=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --keep-data) KEEP_DATA=1; shift ;;
      --yes|-y) ASSUME_YES=1; shift ;;
      *) POSITIONAL+=("$1"); shift ;;
    esac
  done
}

cmd_reconcile() {
  local role="$1"; shift; parse_flags "$@"
  local desired; desired="$(role_services "${role}")"
  [[ "${desired}" == "__INVALID__" ]] && { echo "Unknown role '${role}'. Try: ui | api | db | all" >&2; exit 2; }
  # remove = every known service NOT in the desired set
  local remove=() desired_arr
  read -ra desired_arr <<<"${desired}"
  for s in ${ALL_SERVICES}; do
    in_set "$s" "${desired_arr[@]}" || remove+=("$s")
  done
  echo "[forge-topology] reconcile to role '${role}'"
  echo "  keep:   ${desired}"
  echo "  remove: ${remove[*]}"
  do_remove "${remove[@]}"
  cmd_up "${role}"   # API_HOST/DB_HOST already set as globals by parse_flags above
}

cmd_status() {
  echo "[forge-topology] project '${PROJECT}' — services on this box:"
  docker compose "${BASE[@]}" ps --format 'table {{.Service}}\t{{.State}}\t{{.Status}}' 2>/dev/null || \
    docker ps --filter "name=${PROJECT}" --format 'table {{.Names}}\t{{.Status}}'
  echo
  echo "Role maps:"; for r in ui api db all; do printf '  %-4s %s\n' "$r" "$(role_services "$r")"; done
}

cmd="${1:-}"; shift || true
case "${cmd}" in
  up)        cmd_up "$@" ;;
  reconcile) cmd_reconcile "$@" ;;
  remove)    cmd_remove "$@" ;;
  status)    cmd_status ;;
  roles)     for r in ui api db all; do printf '%-4s %s\n' "$r" "$(role_services "$r")"; done ;;
  *) echo "usage: forge-topology {up|reconcile|remove|status|roles} ..." >&2; exit 2 ;;
esac
